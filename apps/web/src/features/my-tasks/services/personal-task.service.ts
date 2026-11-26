import api from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type PersonalTaskStatus   = "todo" | "in_progress" | "done";
export type PersonalTaskPriority = "low" | "medium" | "high";
export type PersonalTaskRepeat   = "none" | "daily" | "weekly" | "monthly";

export interface PersonalTask {
  id:           string;
  title:        string;
  description?: string | null;
  priority:     PersonalTaskPriority;
  status:       PersonalTaskStatus;
  repeat?:      PersonalTaskRepeat;
  dueDate?:     string | null;
  reminderAt?:  string | null;
  isExpired:    boolean;
  expiresAt?:   string | null;
  userId:       string;
  createdAt:    string;
  updatedAt:    string;
}

export interface CreatePersonalTaskPayload {
  title:        string;
  description?: string;
  priority?:    PersonalTaskPriority;
  status?:      PersonalTaskStatus;
  repeat?:      PersonalTaskRepeat;
  dueDate?:     string;
  reminderAt?:  string;
  expiresAt?:   string;
}

export interface UpdatePersonalTaskPayload {
  title?:       string;
  description?: string | null;
  priority?:    PersonalTaskPriority;
  status?:      PersonalTaskStatus;
  repeat?:      PersonalTaskRepeat;
  dueDate?:     string | null;
  reminderAt?:  string | null;
  expiresAt?:   string | null;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const personalTaskService = {
  /** Get all personal tasks for the current user */
  getAll(month?: string) {
    return api.get<{ success: boolean; tasks: PersonalTask[] }>(
      "/personal-tasks",
      month ? { params: { month } } : undefined
    );
  },

  /** Get a single personal task */
  getById(id: string) {
    return api.get<{ success: boolean; task: PersonalTask }>(
      `/personal-tasks/${id}`
    );
  },

  /** Get tasks grouped by day for a calendar month */
  getCalendar(year: number, month: number) {
    return api.get<{ success: boolean; calendar: Record<string, PersonalTask[]> }>(
      `/personal-tasks/calendar/${year}/${month}`
    );
  },

  /** Create a personal task */
  create(payload: CreatePersonalTaskPayload) {
    return api.post<{ success: boolean; task: PersonalTask }>(
      "/personal-tasks",
      payload
    );
  },

  /** Update a personal task */
  update(id: string, payload: UpdatePersonalTaskPayload) {
    return api.patch<{ success: boolean; task: PersonalTask; nextTask?: PersonalTask | null }>(
      `/personal-tasks/${id}`,
      payload
    );
  },

  /** Delete a personal task */
  delete(id: string) {
    return api.delete(`/personal-tasks/${id}`);
  },

  /** Set / update reminder */
  setReminder(id: string, reminderAt: string) {
    return api.post<{ success: boolean; task: PersonalTask }>(
      `/personal-tasks/${id}/remind`,
      { reminderAt }
    );
  },
};
