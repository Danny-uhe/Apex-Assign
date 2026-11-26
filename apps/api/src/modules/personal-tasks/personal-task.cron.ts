import { checkExpiredTasks } from "./personal-task.service.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

let personalTaskCronTimer: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  try {
    const result = await checkExpiredTasks();
    if (result.expiredCount > 0 || result.remindedCount > 0) {
      console.log(
        `[PersonalTaskCron] Marked ${result.expiredCount} expired, sent ${result.remindedCount} reminders`
      );
    }
  } catch (error) {
    console.error("[PersonalTaskCron] Check failed:", error);
  }
}

export function startPersonalTaskCron() {
  if (personalTaskCronTimer) return;

  // Run an initial check on startup, then every 15 minutes
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
