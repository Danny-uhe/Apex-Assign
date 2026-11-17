import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, MoreVertical } from 'lucide-react';

import PriorityBadge from './PriorityBadge';
import MemberAvatar from './MemberAvatar';
import ProgressBar from './ProgressBar';

type Props = {
  id: number;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  dueDate: string;
  assignee: string;
  avatarColor: string;
  onClick?: () => void;
};

export default function TaskCard({
  id,
  title,
  priority,
  progress,
  dueDate,
  assignee,
  avatarColor,
  onClick,
}: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className='cursor-grab rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition-all hover:border-zinc-700 hover:shadow-lg active:cursor-grabbing'
    >
      <div className='mb-4 flex items-center justify-between'>
        <PriorityBadge priority={priority} />

        <button type='button'>
          <MoreVertical size={18} className='text-zinc-500' />
        </button>
      </div>

      <h3 className='text-sm font-semibold text-zinc-100'>{title}</h3>

      {progress > 0 && progress < 100 && <ProgressBar progress={progress} />}

      <div className='mt-5 flex items-center justify-between'>
        <MemberAvatar initials={assignee} color={avatarColor} />

        <div className='text-right'>
          <div className='flex items-center gap-1 text-xs text-zinc-400'>
            <CalendarDays size={14} />
            <span>Due {dueDate}</span>
          </div>

          {progress > 0 && progress < 100 && (
            <p className='mt-1 text-xs text-zinc-500'>{progress}% Complete</p>
          )}

          {progress === 100 && (
            <p className='mt-1 text-xs text-green-600'>Completed</p>
          )}
        </div>
      </div>
    </div>
  );
}
