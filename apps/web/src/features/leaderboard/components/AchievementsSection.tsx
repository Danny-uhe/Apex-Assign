import { Award, CheckCircle2, Flame, Star, Target, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GamificationProfile } from '../services/leaderboard.service';

const icons: Record<string, LucideIcon> = {
  'five-day-streak': Flame,
  'task-master': CheckCircle2,
  'project-starter': Target,
  'completion-rate': Star,
  'speed-runner': Zap,
  'team-player': Award,
};

const colors: Record<string, { icon: string; background: string; border: string }> = {
  'five-day-streak': { icon: 'text-orange-300', background: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'task-master': { icon: 'text-green-300', background: 'bg-green-500/10', border: 'border-green-500/20' },
  'project-starter': { icon: 'text-orange-300', background: 'bg-orange-500/10', border: 'border-orange-600/20' },
  'completion-rate': { icon: 'text-yellow-300', background: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'speed-runner': { icon: 'text-purple-300', background: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'team-player': { icon: 'text-teal-300', background: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

export default function AchievementsSection({
  achievements,
}: {
  achievements: GamificationProfile['achievements'];
}) {
  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900 p-6'>
      <div className='mb-5'>
        <h2 className='text-xl font-bold text-zinc-100'>Achievements</h2>
        <p className='mt-1 text-sm text-zinc-400'>Milestones based on your saved task and activity data</p>
      </div>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {achievements.map((achievement) => {
          const Icon = icons[achievement.id] ?? Award;
          const color = colors[achievement.id] ?? colors['team-player'];
          return (
            <div
              key={achievement.id}
              className={`flex flex-col items-center rounded-xl border p-4 text-center transition-opacity ${
                achievement.unlocked
                  ? `${color.background} ${color.border}`
                  : 'border-zinc-800 bg-zinc-950/60 opacity-70'
              }`}
            >
              <div className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-full ${
                achievement.unlocked ? color.background : 'bg-zinc-800'
              }`}>
                <Icon className={`h-5 w-5 ${achievement.unlocked ? color.icon : 'text-gray-300'}`} />
              </div>
              <p className='text-sm font-semibold text-zinc-100'>{achievement.label}</p>
              <p className='mt-0.5 text-xs text-zinc-400'>{achievement.description}</p>
              {!achievement.unlocked && (
                <span className='mt-2 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400'>
                  Locked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
