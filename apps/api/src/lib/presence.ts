/**
 * Redis-backed presence service.
 * Replaces the isOnline DB column writes on every socket connect/disconnect.
 * Keys: "presence:{userId}" → "1" with 90-second TTL (refreshed on activity).
 * This means 0 DB writes for presence — purely Redis.
 */
import { redisConnection, isRedisReady } from "../config/redis.js";

const TTL_SECONDS = 90; // user considered online for 90s after last heartbeat
const PREFIX = "presence:";

/** Mark a user as online in Redis. */
export async function setOnline(userId: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redisConnection.set(`${PREFIX}${userId}`, "1", "EX", TTL_SECONDS);
  } catch {
    // Non-fatal — presence is best-effort
  }
}

/** Mark a user as offline (remove their key). */
export async function setOffline(userId: string): Promise<void> {
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
  if (!isRedisReady()) return false;
  try {
    const val = await redisConnection.get(`${PREFIX}${userId}`);
    return val === "1";
  } catch {
    return false;
  }
}

/** Check online status for multiple users at once. */
export async function bulkIsOnline(userIds: string[]): Promise<Record<string, boolean>> {
  if (!isRedisReady() || userIds.length === 0) {
    return Object.fromEntries(userIds.map((id) => [id, false]));
  }
  try {
    const keys = userIds.map((id) => `${PREFIX}${id}`);
    const values = await redisConnection.mget(...keys);
    return Object.fromEntries(userIds.map((id, i) => [id, values[i] === "1"]));
  } catch {
    return Object.fromEntries(userIds.map((id) => [id, false]));
  }
}
