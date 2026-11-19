import { prisma } from "../../config/prisma.js";
import { getIO } from "../../sockets/socket.js";

const MESSAGE_PAGE_SIZE = 50;

export async function getGlobalMessages(userId: string, cursor?: string) {
  const messages = await prisma.globalMessage.findMany({
    include: {
      user: {
        select: { id: true, name: true, avatar: true, position: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MESSAGE_PAGE_SIZE,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
  });

  // Return oldest-first for display
  return messages.reverse();
}

export async function createGlobalMessage(userId: string, content: string) {
  const message = await prisma.globalMessage.create({
    data: { content: content.trim(), userId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, position: true },
      },
    },
  });

  // Broadcast to global chat room
  try {
    const io = getIO();
    io.to("global:chat").emit("new_global_message", message);
  } catch (error) {
    console.error("[GlobalMessage] Failed to broadcast message:", error);
  }

  return message;
}

export async function deleteGlobalMessage(messageId: string, userId: string) {
  const message = await prisma.globalMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");
  if (message.userId !== userId) throw new Error("You can only delete your own messages");

  await prisma.globalMessage.delete({ where: { id: messageId } });

  // Broadcast deletion to global chat room
  try {
    getIO().to("global:chat").emit("global_message_deleted", { messageId });
  } catch { /* socket not ready */ }

  return { message: "Message deleted" };
}
