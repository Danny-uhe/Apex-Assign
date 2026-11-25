import { useState, useRef, useEffect } from "react";
import { Globe, Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  useGlobalMessages,
  useSendGlobalMessage,
  useDeleteGlobalMessage,
  useGlobalTypingUsers,
} from "@/hooks/useGlobalMessages";
import { useSocket } from "@/app/Providers/SocketProvider";
import { useAuthStore } from "@/store/authStore";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-orange-600",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

function avatarColor(userId: string) {
  const sum = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GlobalChatPage() {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const { data: messages = [], isLoading } = useGlobalMessages();
  const send = useSendGlobalMessage();
  const del = useDeleteGlobalMessage();
  const typingUsers = useGlobalTypingUsers();
  useSocket(); // ensure socket is connected and listening for global events

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    // No global typing broadcast yet — could add later
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    // Send via REST (also updates cache); socket broadcast is handled server-side
    send.mutate(text.trim());
    setText("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-sm">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <Globe size={20} className="text-orange-500 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-100">Global Chat</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                {messages.length} messages
              </span>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-orange-500 dark:text-orange-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <MessageCircle size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.userId === currentUser?.id;
              const initials = getInitials(msg.user?.name ?? "?");
              const bgColor = avatarColor(msg.userId || "x");
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {msg.user?.id ? (
                    <Link
                      to={`/profile/${msg.userId}`}
                      aria-label={`View ${msg.user?.name ?? "user"}'s profile`}
                      className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${bgColor}`}
                    >
                      {initials}
                    </Link>
                  ) : (
                    <div
                      className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold text-white ${bgColor}`}
                    >
                      {initials}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`group max-w-[70%] flex flex-col gap-1 ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    <p className={`text-[11px] text-zinc-500 ${isOwn ? "text-right" : ""}`}>
                      {msg.user?.name ?? "Unknown"}
                    </p>
                    <div className="flex items-end gap-2">
                      {isOwn && (
                        <button
                          onClick={() => del.mutate(msg.id)}
                          className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          aria-label="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          isOwn
                            ? "rounded-tr-sm bg-orange-700 text-white"
                            : "rounded-tl-sm bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span>
                {typingUsers.length === 1
                  ? "Someone is"
                  : `${typingUsers.length} people are`}{" "}
                typing…
              </span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* ── Input ── */}
        <form onSubmit={handleSend} className="border-t border-zinc-800 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message everyone…"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <button
              type="submit"
              disabled={!text.trim() || send.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              {send.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
