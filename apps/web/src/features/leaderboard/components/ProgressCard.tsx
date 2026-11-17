import { Lock } from 'lucide-react';
import type { GamificationProfile } from '../services/leaderboard.service';

export default function ProgressCard({ profile }: { profile: GamificationProfile }) {
  const { completedTasks, completionRate, streak } = profile.stats;

  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900 p-6'>
      <div className='mb-6'>
        <h2 className='text-xl font-bold text-zinc-100'>Your progress</h2>
        <p className='mt-1 text-sm text-zinc-400'>
          Personal — only visible to you unless you choose to share it
        </p>
      </div>
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>Tasks Done</p>
          <p className='mt-1.5 text-2xl font-extrabold text-zinc-100'>{completedTasks} completed</p>
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>Completion Rate</p>
          <p className='mt-1.5 text-2xl font-extrabold text-zinc-100'>{completionRate}%</p>
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>Current Streak</p>
          <p className='mt-1.5 text-2xl font-extrabold text-orange-500'>{streak} days</p>
        </div>
      </div>
      <div className='mt-6 flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4'>
        <Lock className='mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500' />
        <p className='text-sm text-zinc-400'>
          Streaks and completion rate are private by default. Turn on sharing
          below if you want your team to see them.
        </p>
      </div>
    </div>
  );
}
