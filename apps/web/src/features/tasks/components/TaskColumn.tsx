import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  children: ReactNode;
};

export default function TaskColumn({ id, title, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
        isOver ? 'border-orange-600 bg-orange-600/5' : 'border-zinc-700 bg-zinc-900'
      }`}
    >
      <h2 className='mb-4 text-lg font-bold text-white sm:mb-5 sm:text-xl'>{title}</h2>

      <div className='min-h-[160px] space-y-3 sm:min-h-[280px] sm:space-y-4 xl:min-h-[420px]'>{children}</div>
    </div>
  );
}
