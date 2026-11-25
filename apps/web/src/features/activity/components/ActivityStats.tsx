import { CheckCircle2, ListChecks, Trophy } from 'lucide-react';
import type { ActivityResponse } from '../services/activity.service';

export default function ActivityStats({
  stats,
}: {
  stats: ActivityResponse['stats'] | null;
}) {
  const items = [
    { title: 'Completed Today', value: stats?.completedToday, icon: CheckCircle2, color: 'bg-green-500/10 text-green-400' },
    { title: 'Tasks Updated Today', value: stats?.updatedToday, icon: ListChecks, color: 'bg-orange-500/10 text-orange-500 dark:text-orange-400' },
    { title: 'Total Points', value: stats?.points, icon: Trophy, color: 'bg-yellow-500/10 text-yellow-300' },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6'>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className='rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm sm:p-6'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-zinc-400'>{item.title}</p>
                <h2 className='mt-2 text-3xl font-bold text-zinc-100'>
                  {item.value === undefined ? '—' : item.value.toLocaleString()}
                </h2>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color} sm:h-12 sm:w-12`}
              >
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
