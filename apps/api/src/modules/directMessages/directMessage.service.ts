import { prisma } from "../../config/prisma.js";
import { getIO } from "../../sockets/socket.js";

const DM_PAGE_SIZE = 50;

/**
 * Get conversation between two users (paginated, oldest-first).
 */
export async function getDirectMessages(
  userId: string,
  otherUserId: string,
  cursor?: string
) {
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, position: true },
      },
      receiver: {
        select: { id: true, name: true, avatar: true, position: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: DM_PAGE_SIZE,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
  });

  return messages.reverse();
}

/**
 * Send a DM to any authenticated user.
 */
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  if (senderId === receiverId) {
    throw new Error("You cannot message yourself");
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) throw new Error("User not found");

  const message = await prisma.directMessage.create({
    data: { content: content.trim(), senderId, receiverId },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, position: true },
      },
      receiver: {
        select: { id: true, name: true, avatar: true, position: true },
      },
    },
  });

  // Push to both user rooms via socket
  try {
    const io = getIO();
    io.to(`user:${receiverId}`).emit("new_direct_message", message);
    io.to(`user:${senderId}`).emit("new_direct_message", message);
  } catch (error) {
    console.error("[DM] Failed to broadcast DM:", error);
  }

  return message;
}

/**
 * Delete a DM (only sender can delete).
 */
export async function deleteDirectMessage(messageId: string, userId: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new Error("Message not found");
  if (message.senderId !== userId)
    throw new Error("You can only delete your own messages");

  await prisma.directMessage.delete({ where: { id: messageId } });

  // Broadcast deletion to both parties
  try {
    const io = getIO();
    io.to(`user:${message.senderId}`).emit("direct_message_deleted", {
      messageId,
      otherUserId: message.receiverId,
    });
    io.to(`user:${message.receiverId}`).emit("direct_message_deleted", {
      messageId,
      otherUserId: message.senderId,
    });
  } catch {
    /* socket not ready */
  }

  return { message: "Message deleted" };
}

/**
 * Get a list of recent DM conversations (unique users + last message).
 */
export async function getConversations(userId: string) {
  // Get latest DMs involving this user, grouped by the other party
  const sent = await prisma.directMessage.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    distinct: ["receiverId"],
    take: 50,
    include: {
      receiver: {
        select: { id: true, name: true, avatar: true, position: true, isOnline: true },
      },
    },
  });

  const received = await prisma.directMessage.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    distinct: ["senderId"],
    take: 50,
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, position: true, isOnline: true },
      },
    },
  });

  // Merge into unique conversations with the latest message
  const convMap = new Map<
    string,
    { user: any; lastMessage: string; lastMessageAt: Date }
  >();

  for (const dm of sent) {
    const existing = convMap.get(dm.receiverId);
    if (!existing || dm.createdAt > existing.lastMessageAt) {
      convMap.set(dm.receiverId, {
        user: dm.receiver,
        lastMessage: dm.content,
        lastMessageAt: dm.createdAt,
      });
    }
  }

  for (const dm of received) {
    const existing = convMap.get(dm.senderId);
    if (!existing || dm.createdAt > existing.lastMessageAt) {
      convMap.set(dm.senderId, {
        user: dm.sender,
        lastMessage: dm.content,
        lastMessageAt: dm.createdAt,
      });
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  );
}
