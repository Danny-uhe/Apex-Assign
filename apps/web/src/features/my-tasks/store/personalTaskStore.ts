import { create } from "zustand";
import {
  personalTaskService,
  type PersonalTask,
} from "../services/personal-task.service";

interface PersonalTaskState {
  tasks: PersonalTask[];
  loading: boolean;
  addModalOpen: boolean;
  defaultDueDate: string;
  openAddModal: (defaultDueDate?: string) => void;
  closeAddModal: () => void;
  fetchTasks: () => Promise<void>;
  upsertTask: (task: PersonalTask) => void;
  removeTask: (id: string) => void;
}

export const usePersonalTaskStore = create<PersonalTaskState>((set) => ({
  tasks: [],
  loading: false,
  addModalOpen: false,
  defaultDueDate: "",

  openAddModal: (defaultDueDate = "") =>
    set({ addModalOpen: true, defaultDueDate }),

  closeAddModal: () =>
    set({ addModalOpen: false, defaultDueDate: "" }),

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const res = await personalTaskService.getAll();
      set({ tasks: res.data.tasks });
    } finally {
      set({ loading: false });
    }
  },

  upsertTask: (task) =>
    set((s) => {
      const exists = s.tasks.some((t) => t.id === task.id);
      return {
        tasks: exists
          ? s.tasks.map((t) => (t.id === task.id ? task : t))
          : [task, ...s.tasks],
      };
    }),

  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
    })),
}));
