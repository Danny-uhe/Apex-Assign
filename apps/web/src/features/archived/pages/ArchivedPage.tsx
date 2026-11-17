import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ArchiveRestore, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import AppLayout from '@/layout/AppLayout';
import { useTaskContext } from '@/app/Providers/TaskContext';
import { taskService, type ArchivedTask } from '@/features/tasks/services/task.service';

const priorityStyles: Record<string, string> = {
  high: 'bg-red-500/10 text-red-300',
  medium: 'bg-orange-500/10 text-orange-300',
  low: 'bg-zinc-800 text-zinc-300',
};

function initials(name?: string | null) {
  return name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

function dateLabel(date?: string | null) {
  return date ? new Date(date).toLocaleDateString() : 'No due date';
}

export default function ArchivedPage() {
  const { refetch } = useTaskContext();
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await taskService.getArchivedTasks();
      setTasks(data.tasks);
    } catch {
      setError('Could not load archived tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const visible = useMemo(() => tasks.filter((task) =>
    `${task.title} ${task.description ?? ''} ${task.project.name}`
      .toLowerCase().includes(search.toLowerCase()),
  ), [tasks, search]);

  async function handleRestore(task: ArchivedTask) {
    setBusyTaskId(task.id);
    setError('');
    try {
      await taskService.restoreTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      refetch();
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(message ?? `Could not restore "${task.title}". Please try again.`);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDelete(task: ArchivedTask) {
    if (!window.confirm(`Permanently delete "${task.title}"? This cannot be undone.`)) return;
    setBusyTaskId(task.id);
    setError('');
    try {
      await taskService.deleteTask(task.projectId, task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch {
      setError(`Could not delete "${task.title}". Please try again.`);
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <AppLayout>
      <div className='space-y-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative w-full sm:w-72'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500' />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search archived tasks...'
              aria-label='Search archived tasks'
              className='h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20'
            />
          </div>
          <p className='text-sm text-zinc-500'>
            {visible.length} archived task{visible.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div role='alert' className='flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300'>
            <span>{error}</span>
            {loading === false && tasks.length === 0 && (
              <button type='button' onClick={() => void loadTasks()} className='font-semibold underline'>
                Retry
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div role='status' className='flex justify-center rounded-2xl border border-zinc-800 bg-zinc-900 py-20 text-cyan-400'>
            <Loader2 className='animate-spin' aria-label='Loading archived tasks' />
          </div>
        ) : error ? null : visible.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 py-20 text-zinc-500'>
            <p className='text-sm font-medium'>
              {tasks.length === 0 ? 'No archived tasks yet' : 'No archived tasks match your search'}
            </p>
            {tasks.length === 0 && <p className='mt-1 text-xs'>Archive a completed task from its task menu.</p>}
          </div>
        ) : (
          <div className='space-y-3'>
            {visible.map((task) => (
              <div
                key={task.id}
                className='flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition hover:border-zinc-700 hover:shadow-lg sm:flex-row sm:items-start sm:justify-between'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white'>
                    {initials(task.assignedTo?.name)}
                  </div>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='font-semibold text-zinc-200 line-through'>{task.title}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${priorityStyles[task.priority] ?? priorityStyles.low}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className='mt-0.5 line-clamp-1 text-sm text-zinc-400'>{task.description || task.project.name}</p>
                    <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500'>
                      <span className='flex items-center gap-1'>
                        <CalendarDays size={12} />
                        Due: {dateLabel(task.dueDate)}
                      </span>
                      <span>Completed: {dateLabel(task.updatedAt)}</span>
                      <span>Archived: {dateLabel(task.archivedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className='flex flex-shrink-0 items-center gap-2 self-start sm:self-center'>
                  <button
                    type='button'
                    disabled={busyTaskId === task.id}
                    onClick={() => void handleRestore(task)}
                    className='flex items-center gap-1.5 rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50'
                  >
                    {busyTaskId === task.id ? <Loader2 size={13} className='animate-spin' /> : <ArchiveRestore size={13} />}
                    Restore
                  </button>
                  <button
                    type='button'
                    disabled={busyTaskId === task.id}
                    onClick={() => void handleDelete(task)}
                    className='flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50'
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
