import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, FolderPlus, ListChecks, Search } from 'lucide-react';
import type { ActivityEntry } from '../services/activity.service';

type Period = 'Today' | 'This Week' | 'This Month';
const periods: Period[] = ['Today', 'This Week', 'This Month'];

function periodStart(period: Period) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === 'This Week') start.setDate(start.getDate() - 7);
  if (period === 'This Month') start.setDate(start.getDate() - 30);
  return start;
}

function formatRelativeTime(date: string) {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString();
}

export default function ActivityFilter({
  activities,
}: {
  activities: ActivityEntry[] | null;
}) {
  const [active, setActive] = useState<Period>('Today');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => Object.fromEntries(
    periods.map((period) => [
      period,
      (activities ?? []).filter((item) => new Date(item.occurredAt) >= periodStart(period)).length,
    ]),
  ) as Record<Period, number>, [activities]);
  const visible = (activities ?? []).filter((item) =>
    new Date(item.occurredAt) >= periodStart(active) &&
    `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className='flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap gap-2'>
          {periods.map((period) => (
            <button
              key={period}
              id={`activity-filter-${period.toLowerCase().replace(' ', '-')}-btn`}
              type='button'
              aria-pressed={active === period}
              onClick={() => setActive(period)}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                active === period
                  ? 'bg-orange-600 text-white'
                  : 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {period}
              <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                active === period ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
              }`}>
                {counts[period]}
              </span>
            </button>
          ))}
        </div>
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500' size={16} />
          <input
            id='activity-search'
            aria-label='Search activity'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search activity...'
            className='w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20'
          />
        </div>
      </div>

      <div className='space-y-4'>
        {activities === null ? (
          <div role='status' className='rounded-2xl border border-dashed border-zinc-700 py-16 text-center text-sm text-zinc-500'>
            Loading activity…
          </div>
        ) : visible.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 py-16 text-zinc-500'>
            <p className='text-sm font-medium'>No activity in this period</p>
          </div>
        ) : visible.map((item) => <ActivityRow key={item.id} item={item} />)}
      </div>
    </>
  );
}

function ActivityRow({ item }: { item: ActivityEntry }) {
  const iconMap = {
    task_created: { icon: ListChecks, bg: 'bg-orange-500/10', color: 'text-orange-500 dark:text-orange-400' },
    task_completed: { icon: CheckCircle2, bg: 'bg-green-500/10', color: 'text-green-400' },
    notification: { icon: Bell, bg: 'bg-yellow-500/10', color: 'text-yellow-300' },
    project_created: { icon: FolderPlus, bg: 'bg-orange-500/10', color: 'text-orange-500 dark:text-orange-400' },
  };
  const { icon: Icon, bg, color } = iconMap[item.type];

  return (
    <div className='flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition hover:border-zinc-700 hover:shadow-lg'>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div className='flex-1'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='font-semibold text-zinc-100'>{item.title}</h3>
            <p className='mt-0.5 text-sm text-zinc-400'>{item.description}</p>
          </div>
          <time dateTime={item.occurredAt} className='flex-shrink-0 text-sm text-zinc-500'>
            {formatRelativeTime(item.occurredAt)}
          </time>
        </div>
      </div>
    </div>
  );
}
