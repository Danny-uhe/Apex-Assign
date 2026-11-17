import { useState, useRef, useEffect } from "react";
import { Send, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMessages, useSendMessage, useDeleteMessage, useTypingUsers } from "@/hooks/useMessages";
import { useSocket } from "@/app/Providers/SocketProvider";
import { useAuthStore } from "@/store/authStore";

interface Props {
  projectId: string;
  projectName?: string;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];

function avatarColor(userId: string) {
  const sum = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function ChatPanel({ projectId, projectName }: Props) {
  const [text, setText]     = useState("");
  const endRef              = useRef<HTMLDivElement>(null);
  const typingTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser         = useAuthStore((s) => s.user);
  const { data: messages = [], isLoading } = useMessages(projectId);
  const send                = useSendMessage(projectId);
  const del                 = useDeleteMessage(projectId);
  const typingUsers         = useTypingUsers(projectId);
  const { sendTyping, sendStopTyping } = useSocket();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    sendTyping(projectId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendStopTyping(projectId), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    send.mutate(text.trim());
    setText("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    sendStopTyping(projectId);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10">
          <MessageCircle size={16} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {projectName ? `${projectName} Chat` : "Project Chat"}
          </h3>
          <p className="text-xs text-zinc-500">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <MessageCircle size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <Link
                  to={`/profile/${msg.userId}`}
                  aria-label={`View ${msg.user?.name ?? "user"}'s profile`}
                  className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${avatarColor(msg.userId)}`}
                >
                  {getInitials(msg.user?.name ?? "?")}
                </Link>

                <div className={`group max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <p className={`text-[11px] text-zinc-500 ${isOwn ? "text-right" : ""}`}>
                    {msg.user?.name ?? "Unknown"}
                  </p>
                  <div className="flex items-end gap-2">
                    {isOwn && (
                      <button
                        onClick={() => del.mutate(msg.id)}
                        className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isOwn
                        ? "rounded-tr-sm bg-blue-600 text-white"
                        : "rounded-tl-sm bg-zinc-800 text-zinc-200"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="flex gap-0.5">
              {[0,1,2].map((i) => (
                <span key={i} className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span>{typingUsers.length === 1 ? "Someone is" : `${typingUsers.length} people are`} typing…</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-zinc-800 px-4 py-3">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={handleInput}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-40"
          >
            {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
