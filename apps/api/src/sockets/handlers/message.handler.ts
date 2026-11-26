import { Server, Socket } from "socket.io";
import { prisma } from "../../config/prisma.js";
import { notifyProjectMessage } from "../../modules/notifications/notification.service.js";
import { stripHtml } from "../../utils/sanitize.js";

interface SendMessagePayload {
  projectId: string;
  content: string;
}

const SOCKET_RATE_WINDOW_MS = 10_000;
const SOCKET_RATE_MAX_MSGS = 20;

export function registerMessageHandlers(io: Server, socket: Socket) {
  const { userId } = socket.user;
  let windowStart = Date.now();
  let msgCount = 0;

  socket.on("send_message", async (payload: SendMessagePayload) => {
    const now = Date.now();
    if (now - windowStart > SOCKET_RATE_WINDOW_MS) {
      windowStart = now;
      msgCount = 0;
    }
    msgCount += 1;
    if (msgCount > SOCKET_RATE_MAX_MSGS) {
      socket.emit("error_message", { message: "Rate limit exceeded. Slow down." });
      return;
    }

    const projectId = typeof payload?.projectId === "string" ? payload.projectId.trim() : "";
    const rawContent = typeof payload?.content === "string" ? payload.content : "";
    const content = stripHtml(rawContent);

    if (!content || content.length > 2000 || !projectId) return;

    // Verify sender is a project member
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!member) return;

    const message = await prisma.message.create({
      data: { content, projectId, userId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, position: true },
        },
      },
    });

    // Broadcast to project room (catches users actively in the room)
    io.to(`project:${projectId}`).emit("new_message", message);

    // Also push directly to each member's personal room
    // — this guarantees delivery even if a member's socket missed the room join
    try {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      });
      members.forEach(({ userId: memberId }) => {
        if (memberId !== userId) {
          io.to(`user:${memberId}`).emit("new_message", message);
        }
      });
    } catch (error) {
      console.error("[Socket] Failed to broadcast message to project members:", error);
    }

    try {
      await notifyProjectMessage(message, io);
    } catch (error) {
      console.error("[MessageNotification] Failed to notify project members:", error);
    }
  });
}
