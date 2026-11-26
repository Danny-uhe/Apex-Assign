import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useNotifications, notificationTypeFromString } from "./NotificationContext";
import type {
  SocketMessage,
  SocketNotification,
  SocketTaskEvent,
  SocketPresence,
  SocketTyping,
} from "@/types/socket.types";
import type { GlobalMessage } from "@/hooks/useGlobalMessages";
import type { DirectMessage } from "@/hooks/useDirectMessages";

interface SocketCtx {
  sendMessage: (projectId: string, content: string) => void;
  sendTyping: (projectId: string) => void;
  sendStopTyping: (projectId: string) => void;
  sendGlobalMessage: (content: string) => void;
}

const SocketContext = createContext<SocketCtx | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      connectedRef.current = false;
      return;
    }

    if (connectedRef.current) return;

    const socket = connectSocket(accessToken);
    connectedRef.current = true;

    // ── Incoming project messages ───────────────────────────────────────────
    socket.on("new_message", (msg: SocketMessage) => {
      queryClient.setQueryData<SocketMessage[]>(
        ["messages", msg.projectId],
        (old = []) => [...old, msg]
      );
    });

    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      void messageId;
    });

    // ── Global chat ─────────────────────────────────────────────────────────
    socket.on("new_global_message", (msg: GlobalMessage) => {
      queryClient.setQueryData<GlobalMessage[]>(
        ["global-messages"],
        (old = []) => {
          // Dedup: skip if already in cache (e.g. optimistic entry replaced)
          const exists = old.some((m) => m.id === msg.id);
          if (exists) return old;
          // Replace any lingering optimistic placeholder
          const without = old.filter((m) => !m.id.startsWith("optimistic-"));
          return [...without, msg];
        }
      );
    });

    socket.on("global_message_deleted", ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData<GlobalMessage[]>(
        ["global-messages"],
        (old = []) => old.filter((m) => m.id !== messageId)
      );
    });

    // ── Direct messages ───────────────────────────────────────────────────
    socket.on("new_direct_message", (msg: DirectMessage) => {
      const otherUserId = msg.senderId === useAuthStore.getState().user?.id
        ? msg.receiverId
        : msg.senderId;
      queryClient.setQueryData<DirectMessage[]>(
        ["dm", otherUserId],
        (old = []) => {
          const exists = old.some((m) => m.id === msg.id);
          if (exists) return old;
          const without = old.filter((m) => !m.id.startsWith("optimistic-"));
          return [...without, msg];
        }
      );
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
    });

    socket.on("direct_message_deleted", ({ messageId, otherUserId }: { messageId: string; otherUserId: string }) => {
      queryClient.setQueryData<DirectMessage[]>(
        ["dm", otherUserId],
        (old = []) => old.filter((m) => m.id !== messageId)
      );
    });

    // ── Task updates ────────────────────────────────────────────────────────
    socket.on("task_updated", (event: SocketTaskEvent) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void event;
    });

    // ── Live notifications ──────────────────────────────────────────────────
    socket.on("notification", (notif: SocketNotification) => {
      const title = notif.type === "new_message"
        ? "New message"
        : notif.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      addNotification({
        type: notificationTypeFromString(notif.type),
        rawType: notif.type,
        title,
        message: notif.message,
        dbId: notif.id,
        relatedId: notif.relatedId,
      });
      toast(notif.message, { icon: "🔔" });

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted" &&
        document.hidden
      ) {
        try {
          new window.Notification(title, {
            body: notif.message,
            icon: "/favicon.svg",
          });
        } catch {
          // Ignore browser notification errors
        }
      }
    });

    // ── Presence ────────────────────────────────────────────────────────────
    socket.on("user_presence", (presence: SocketPresence) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      void presence;
    });

    // ── Typing (project chat) ───────────────────────────────────────────────
    socket.on("typing", (payload: SocketTyping) => {
      queryClient.setQueryData(
        ["typing", payload.projectId],
        (old: string[] = []) =>
          old.includes(payload.userId) ? old : [...old, payload.userId]
      );
    });

    socket.on("stop_typing", (payload: SocketTyping) => {
      queryClient.setQueryData(["typing", payload.projectId], (old: string[] = []) =>
        old.filter((id) => id !== payload.userId)
      );
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    return () => {
      socket.off("new_message");
      socket.off("message_deleted");
      socket.off("new_global_message");
      socket.off("global_message_deleted");
      socket.off("new_direct_message");
      socket.off("direct_message_deleted");
      socket.off("task_updated");
      socket.off("notification");
      socket.off("user_presence");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("connect_error");
    };
  }, [accessToken, queryClient, addNotification]);

  // Disconnect on logout
  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      connectedRef.current = false;
    }
  }, [accessToken]);

  const sendMessage = (projectId: string, content: string) => {
    getSocket()?.emit("send_message", { projectId, content });
  };

  const sendTyping = (projectId: string) => {
    getSocket()?.emit("typing", { projectId });
  };

  const sendStopTyping = (projectId: string) => {
    getSocket()?.emit("stop_typing", { projectId });
  };

  const sendGlobalMessage = (content: string) => {
    getSocket()?.emit("send_global_message", { content });
  };

  return (
    <SocketContext.Provider value={{ sendMessage, sendTyping, sendStopTyping, sendGlobalMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
