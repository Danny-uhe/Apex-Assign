import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    position: string | null;
  };
  receiver: {
    id: string;
    name: string;
    avatar: string | null;
    position: string | null;
  };
}

export interface Conversation {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    position: string | null;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageAt: string;
}

/** Fetch DM history with a specific user (REST). */
export function useDirectMessages(otherUserId: string) {
  return useQuery<DirectMessage[]>({
    queryKey: ["dm", otherUserId],
    queryFn: async () => {
      const { data } = await api.get(`/dm/${otherUserId}`);
      return data.messages;
    },
    enabled: !!otherUserId,
    staleTime: 1000 * 15,
  });
}

/** Send a DM via REST. */
export function useSendDM(otherUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/dm/${otherUserId}`, { content });
      return data.message as DirectMessage;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["dm", otherUserId] });
      const previous = queryClient.getQueryData<DirectMessage[]>(["dm", otherUserId]);

      const optimistic: DirectMessage = {
        id: `optimistic-${Date.now()}`,
        content,
        senderId: "",
        receiverId: otherUserId,
        createdAt: new Date().toISOString(),
        sender: { id: "", name: "You", avatar: null, position: null },
        receiver: { id: otherUserId, name: "", avatar: null, position: null },
      };

      queryClient.setQueryData<DirectMessage[]>(["dm", otherUserId], (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous };
    },
    onSuccess: (message) => {
      queryClient.setQueryData<DirectMessage[]>(["dm", otherUserId], (old = []) => {
        const without = old.filter((m) => !m.id.startsWith("optimistic-"));
        const exists = without.some((m) => m.id === message.id);
        return exists ? without : [...without, message];
      });
      // Also invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["dm", otherUserId], ctx.previous);
      }
    },
  });
}

/** Delete a DM. */
export function useDeleteDM(otherUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/dm/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData<DirectMessage[]>(["dm", otherUserId], (old = []) =>
        old.filter((m) => m.id !== messageId)
      );
    },
  });
}

/** Fetch recent DM conversations (list of unique users). */
export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["dm-conversations"],
    queryFn: async () => {
      const { data } = await api.get("/dm/conversations");
      return data.conversations;
    },
    staleTime: 1000 * 30,
  });
}
