import { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, Loader2, MessageCircle } from 'lucide-react';
import { useDirectMessages, useSendDM, useDeleteDM } from '@/hooks/useDirectMessages';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  initials: string;
  color: string;
  status: 'online' | 'away' | 'offline';
  targetUserId: string;
};

const statusDot: Record<string, string> = {
  online: 'bg-green-400', away: 'bg-yellow-400', offline: 'bg-zinc-500',
};
const statusText: Record<string, string> = {
  online: 'Online', away: 'Away', offline: 'Offline',
};

const AVATAR_COLORS = [
  'bg-orange-600','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500',
];
function avatarColor(id: string) {
  const s = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function MessageModal({ open, onClose, name, initials, color, status, targetUserId }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);

  const { data: messages = [], isLoading } = useDirectMessages(targetUserId);
  const send = useSendDM(targetUserId);
  const del  = useDeleteDM(targetUserId);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  if (!open) return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    send.mutate(text, {
      onError: () => toast.error('Failed to send message'),
    });
    setInput('');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4'>
      <div className='flex w-full max-w-md flex-col rounded-t-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl sm:rounded-2xl' style={{ height: '520px' }}>

        {/* Header */}
        <div className='flex flex-shrink-0 items-center gap-3 border-b border-zinc-800 px-5 py-4'>
          <div className='relative'>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${color}`}>
              {initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot[status]}`} />
          </div>
          <div className='flex-1'>
            <p className='font-semibold text-zinc-100'>{name}</p>
            <p className={`text-xs font-medium ${status === 'online' ? 'text-green-400' : status === 'away' ? 'text-yellow-300' : 'text-zinc-400'}`}>
              {statusText[status]}
            </p>
          </div>
          <button onClick={onClose} className='rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className='flex-1 space-y-3 overflow-y-auto px-5 py-4'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader2 size={22} className='animate-spin text-orange-600' />
            </div>
          ) : messages.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center text-center'>
              <MessageCircle size={32} className='mb-3 text-zinc-600' />
              <p className='text-sm font-medium text-zinc-300'>No messages yet</p>
              <p className='mt-1 text-xs text-zinc-500'>Send the first message to {name.split(' ')[0]}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <div className={`h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(msg.senderId)}`}>
                      {getInitials(msg.sender?.name ?? '?')}
                    </div>
                  )}
                  <div className={`group max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn ? 'rounded-br-sm bg-orange-700 text-white' : 'rounded-bl-sm bg-zinc-800 text-zinc-200'
                    }`}>
                      {msg.content}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-[10px] text-zinc-500'>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => del.mutate(msg.id)}
                          className='hidden group-hover:block text-[10px] text-zinc-500 hover:text-red-400'
                        >
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className='flex-shrink-0 border-t border-zinc-800 p-4'>
          <div className='flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2'>
            <button className='text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'><Smile size={18} /></button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message ${name.split(' ')[0]}...`}
              className='flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500'
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || send.isPending}
              className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40'
            >
              {send.isPending ? <Loader2 size={14} className='animate-spin' /> : <Send size={14} />}
            </button>
          </div>
          <p className='mt-1.5 text-center text-[10px] text-zinc-500'>Press Enter to send</p>
        </div>
      </div>
    </div>
  );
}
