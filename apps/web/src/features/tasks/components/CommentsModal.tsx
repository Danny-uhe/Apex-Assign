import { useState } from 'react';
import { X, Send } from 'lucide-react';

type Comment = {
  id: number;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
};

const SEED_COMMENTS: Comment[] = [
  {
    id: 1,
    author: 'Rowland E.',
    initials: 'RE',
    color: 'bg-orange-600',
    text: 'Started working on the bento-grid layout. Should have a draft by EOD.',
    time: '10 mins ago',
  },
  {
    id: 2,
    author: 'Sarah M.',
    initials: 'SM',
    color: 'bg-purple-500',
    text: 'Looks great so far! Make sure the tablet breakpoints follow the Figma spec.',
    time: '25 mins ago',
  },
  {
    id: 3,
    author: 'Dev Team',
    initials: 'DT',
    color: 'bg-emerald-500',
    text: 'API endpoints are ready whenever you need to integrate.',
    time: '1 hr ago',
  },
];

type Props = {
  open: boolean;
  taskTitle: string;
  onClose: () => void;
};

export default function CommentsModal({ open, taskTitle, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>(SEED_COMMENTS);
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setComments((prev) => [
      {
        id: Date.now(),
        author: 'You',
        initials: 'YO',
        color: 'bg-orange-700',
        text,
        time: 'Just now',
      },
      ...prev,
    ]);
    setInput('');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/50 sm:items-center sm:p-4'>
      <div className='flex h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl sm:h-[600px] sm:rounded-2xl'>
        {/* Header */}
        <div className='flex items-start justify-between border-b border-zinc-800 px-6 py-4'>
          <div>
            <h2 className='font-bold text-zinc-100'>Comments</h2>
            <p className='mt-0.5 truncate text-xs text-zinc-500'>{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
          >
            <X size={18} />
          </button>
        </div>

        {/* Comment list */}
        <div className='flex-1 space-y-4 overflow-y-auto px-6 py-4'>
          {comments.map((c) => (
            <div key={c.id} className='flex gap-3'>
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${c.color}`}
              >
                {c.initials}
              </div>
              <div className='flex-1 rounded-2xl rounded-tl-none bg-zinc-800 px-4 py-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-zinc-200'>
                    {c.author}
                  </span>
                  <span className='text-[10px] text-zinc-500'>{c.time}</span>
                </div>
                <p className='mt-1 text-sm text-zinc-300'>{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className='border-t border-zinc-800 px-4 py-3'>
          <div className='flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2'>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder='Write a comment...'
              className='flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500'
            />
            <button
              onClick={handleSend}
              className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40'
              disabled={!input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
