/**
 * Redis-backed + live Socket.IO presence service.
 * Keys: "presence:{userId}" -> "1" with 90-second TTL (refreshed on activity).
 * Falls back to live Socket.IO room checks if Redis is unavailable or single-instance.
 */
import { redisConnection, isRedisReady } from "../config/redis.js";
import { getIO } from "../sockets/socket.js";

const TTL_SECONDS = 90;
const PREFIX = "presence:";

/** Mark a user as online in Redis. */
export async function setOnline(userId: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redisConnection.set(`${PREFIX}${userId}`, "1", "EX", TTL_SECONDS);
  } catch {
    // Non-fatal
  }
}

/** Mark a user as offline (only if they have no remaining active sockets). */
export async function setOffline(userId: string): Promise<void> {
  try {
    const io = getIO();
    const remaining = await io.in(`user:${userId}`).fetchSockets();
    if (remaining.length > 0) return;
  } catch {
    // Socket server unavailable
  }

  if (!isRedisReady()) return;
  try {
    await redisConnection.del(`${PREFIX}${userId}`);
  } catch {
    // Non-fatal
  }
}

/** Refresh TTL to keep a user online (call on any socket activity). */
export async function refreshPresence(userId: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redisConnection.expire(`${PREFIX}${userId}`, TTL_SECONDS);
  } catch {
    // Non-fatal
  }
}

/** Check if a user is currently online. */
export async function isOnline(userId: string): Promise<boolean> {
  const result = await bulkIsOnline([userId]);
  return Boolean(result[userId]);
}

/** Check online status for multiple users at once (Redis + live Socket.IO fallback). */
export async function bulkIsOnline(userIds: string[]): Promise<Record<string, boolean>> {
  const statusMap: Record<string, boolean> = Object.fromEntries(
    userIds.map((id) => [id, false])
  );
  if (userIds.length === 0) return statusMap;

  if (isRedisReady()) {
    try {
      const keys = userIds.map((id) => `${PREFIX}${id}`);
      const values = await redisConnection.mget(...keys);
      userIds.forEach((id, i) => {
        if (values[i] === "1") statusMap[id] = true;
      });
    } catch {
      // Fall back to Socket.IO room check below
    }
  }

  // Also check live Socket.IO rooms for any user still marked false
  try {
    const io = getIO();
    await Promise.all(
      userIds
        .filter((id) => !statusMap[id])
        .map(async (id) => {
          try {
            const sockets = await io.in(`user:${id}`).fetchSockets();
            if (sockets.length > 0) statusMap[id] = true;
          } catch {
            // Ignore per-user check failure
          }
        })
    );
  } catch {
    // Socket server not initialized
  }

  return statusMap;
}
