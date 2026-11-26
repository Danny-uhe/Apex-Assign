import { create } from "zustand";

interface PresenceState {
  onlineMap: Record<string, boolean>;
  setPresence: (userId: string, isOnline: boolean) => void;
  seedPresence: (entries: Array<{ id: string; isOnline: boolean }>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineMap: {},
  setPresence: (userId, isOnline) =>
    set((s) => ({
      onlineMap: { ...s.onlineMap, [userId]: isOnline },
    })),
  seedPresence: (entries) =>
    set((s) => {
      const next = { ...s.onlineMap };
      for (const item of entries) {
        next[item.id] = item.isOnline;
      }
      return { onlineMap: next };
    }),
}));
