import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

// ── Types matching the backend schema ────────────────────────────────────────

export type TaskStatus   = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ApiSubtask {
  id: string;
  title: string;
  isDone: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}

export interface ApiTask {
  id:           string;
  title:        string;
  description?: string | null;
  status:       TaskStatus;
  priority:     TaskPriority;
  dueDate?:     string | null;
  points:       number;
  projectId:    string;
  assignedToId?: string | null;
  assignedTo?:  { id: string; name: string; avatar?: string | null } | null;
  createdById?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?:   { id: string; name: string } | null;
  createdAt:    string;
  updatedAt:    string;
  _count?:      { comments: number; attachments: number };
}

export interface ArchivedTask extends ApiTask {
  archivedAt: string | null;
  project: { id: string; name: string; color: string | null };
}

export interface CreateTaskPayload {
  title:        string;
  description?: string;
  status?:      TaskStatus;
  priority?:    TaskPriority;
  dueDate?:     string;
  points?:      number;
  assignedToId?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  id: string;
}

// ── Project tasks ─────────────────────────────────────────────────────────────

export const taskService = {
  /** Get all tasks for a project */
  getProjectTasks(projectId: string) {
    return api.get<{ success: boolean; tasks: ApiTask[] }>(
      `/projects/${projectId}/tasks`
    );
  },

  /** Get a single task */
  getTask(projectId: string, taskId: string) {
    return api.get<{ success: boolean; task: ApiTask }>(
      `/projects/${projectId}/tasks/${taskId}`
    );
  },

  /** Create a task */
  createTask(projectId: string, payload: CreateTaskPayload) {
    return api.post<{ success: boolean; task: ApiTask }>(
      `/projects/${projectId}/tasks`,
      payload
    );
  },

  /** Update a task (status change, edit, etc.) */
  updateTask(projectId: string, taskId: string, payload: Partial<CreateTaskPayload>) {
    return api.patch<{ success: boolean; task: ApiTask }>(
      `/projects/${projectId}/tasks/${taskId}`,
      payload
    );
  },

  /** Delete a task */
  deleteTask(projectId: string, taskId: string) {
    return api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },

  getArchivedTasks() {
    return api.get<{ success: boolean; tasks: ArchivedTask[] }>('/tasks/archived');
  },

  archiveTask(taskId: string) {
    return api.patch<{ success: boolean; task: ApiTask }>(`/tasks/${taskId}/archive`);
  },

  restoreTask(taskId: string) {
    return api.patch<{ success: boolean; task: ApiTask }>(`/tasks/${taskId}/restore`);
  },

  // ── Subtasks ───────────────────────────────────────────────────────────────
  getSubtasks(taskId: string) {
    return api.get<{ success: boolean; subtasks: ApiSubtask[] }>(`/tasks/${taskId}/subtasks`);
  },

  createSubtask(taskId: string, title: string) {
    return api.post<{ success: boolean; subtask: ApiSubtask }>(`/tasks/${taskId}/subtasks`, { title });
  },

  updateSubtask(subtaskId: string, payload: { title?: string; isDone?: boolean }) {
    return api.patch<{ success: boolean; subtask: ApiSubtask }>(`/subtasks/${subtaskId}`, payload);
  },

  deleteSubtask(subtaskId: string) {
    return api.delete<{ success: boolean }>(`/subtasks/${subtaskId}`);
  },

  // ── Attachments ────────────────────────────────────────────────────────────
  getAttachments(taskId: string) {
    return api.get<{ success: boolean; attachments: ApiAttachment[] }>(`/tasks/${taskId}/attachments`);
  },

  uploadAttachments(taskId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append("attachments", f));
    return api.post<{ success: boolean; attachments: ApiAttachment[] }>(
      `/tasks/${taskId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  async downloadAttachment(fileUrl: string, originalName: string) {
    const base = (api.defaults.baseURL ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");
    const token = useAuthStore.getState().accessToken;
    const res = await axios.get<Blob>(`${base}${fileUrl}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
