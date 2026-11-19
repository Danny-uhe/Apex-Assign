import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { SocketMessage } from "@/types/socket.types";

export interface GlobalMessage {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    position: string | null;
  };
}

/** Fetch the global message history (REST). */
export function useGlobalMessages() {
  return useQuery<GlobalMessage[]>({
    queryKey: ["global-messages"],
    queryFn: async () => {
      const { data } = await api.get("/chat/messages");
      return data.messages ?? data;
    },
    staleTime: 1000 * 30, // 30s — socket keeps it fresh
  });
}

/** Send a global message via REST (optimistically adds to cache). */
export function useSendGlobalMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post("/chat/messages", { content });
      return (data.message ?? data) as GlobalMessage;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["global-messages"] });
      const previous = queryClient.getQueryData<GlobalMessage[]>(["global-messages"]);

      // Optimistic placeholder
      const optimistic: GlobalMessage = {
        id: `optimistic-${Date.now()}`,
        content,
        userId: "",
        createdAt: new Date().toISOString(),
        user: { id: "", name: "You", avatar: null, position: null },
      };

      queryClient.setQueryData<GlobalMessage[]>(["global-messages"], (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous };
    },
    onSuccess: (message) => {
      // Replace optimistic entry with real one (dedup by id)
      queryClient.setQueryData<GlobalMessage[]>(["global-messages"], (old = []) => {
        const without = old.filter((m) => !m.id.startsWith("optimistic-"));
        const exists = without.some((m) => m.id === message.id);
        return exists ? without : [...without, message];
      });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["global-messages"], ctx.previous);
      }
    },
  });
}

/** Delete a global message by id. */
export function useDeleteGlobalMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/chat/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData<GlobalMessage[]>(["global-messages"], (old = []) =>
        old.filter((m) => m.id !== messageId)
      );
    },
  });
}

/** Read global typing indicator users (populated by SocketProvider). */
export function useGlobalTypingUsers(): string[] {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<string[]>(["typing", "global"]) ?? [];
}

// Keep SocketMessage re-export so callers can share the type surface
export type { SocketMessage };
