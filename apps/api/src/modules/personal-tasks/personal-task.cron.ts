import crypto from "node:crypto";
import { checkExpiredTasks } from "./personal-task.service.js";
import { redisConnection, isRedisReady } from "../../config/redis.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const LOCK_KEY = "lock:personal-task-cron";
const LOCK_TTL_SEC = 14 * 60; // 14 minutes

let personalTaskCronTimer: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  let lockToken: string | null = null;

  // Use a Redis distributed lock when available so multi-instance deploys don't duplicate notifications
  if (isRedisReady()) {
    try {
      lockToken = crypto.randomUUID();
      const acquired = await redisConnection.set(
        LOCK_KEY,
        lockToken,
        "EX",
        LOCK_TTL_SEC,
        "NX"
      );
      if (acquired !== "OK") {
        return;
      }
    } catch {
      lockToken = null;
    }
  }

  try {
    const result = await checkExpiredTasks();
    if (result.expiredCount > 0 || result.remindedCount > 0) {
      console.log(
        `[PersonalTaskCron] Marked ${result.expiredCount} expired, sent ${result.remindedCount} reminders`
      );
    }
  } catch (error) {
    console.error("[PersonalTaskCron] Check failed:", error);
  } finally {
    if (lockToken && isRedisReady()) {
      try {
        const current = await redisConnection.get(LOCK_KEY);
        if (current === lockToken) {
          await redisConnection.del(LOCK_KEY);
        }
      } catch {
        // Non-fatal; TTL will expire
      }
    }
  }
}

export function startPersonalTaskCron() {
  if (personalTaskCronTimer) return;

  void runCheck();

  personalTaskCronTimer = setInterval(() => {
    void runCheck();
  }, FIFTEEN_MINUTES_MS);
  personalTaskCronTimer.unref();
}

export function stopPersonalTaskCron() {
  if (personalTaskCronTimer) {
    clearInterval(personalTaskCronTimer);
    personalTaskCronTimer = null;
  }
}
