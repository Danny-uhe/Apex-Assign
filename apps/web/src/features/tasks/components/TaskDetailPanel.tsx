import { useEffect, useState } from 'react';
import { X, FileText, ImageIcon, Paperclip, Plus, MessageCircle, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Task } from '../types/types';
import { taskService, type ApiAttachment, type ApiSubtask } from '../services/task.service';
import CommentsModal from './CommentsModal';
import FilesModal from './FilesModal';

type Props = {
  task: Task;
  onClose: () => void;
  onEdit?: () => void;
};

type Tab = 'Notes' | 'Comments' | 'Files';

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskDetailPanel({ task, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Notes');
  const [showComments, setShowComments] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const [subtasks, setSubtasks] = useState<ApiSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);

  const loadExtras = () => {
    taskService
      .getSubtasks(task.id)
      .then((r) => setSubtasks(r.data.subtasks ?? []))
      .catch(() => setSubtasks([]));
    taskService
      .getAttachments(task.id)
      .then((r) => setAttachments(r.data.attachments ?? []))
      .catch(() => setAttachments([]));
  };

  useEffect(() => {
    loadExtras();
  }, [task.id]);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || addingSubtask) return;
    setAddingSubtask(true);
    try {
      const res = await taskService.createSubtask(task.id, newSubtaskTitle.trim());
      setSubtasks((prev) => [...prev, res.data.subtask]);
      setNewSubtaskTitle('');
    } catch {
      toast.error('Could not add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (item: ApiSubtask) => {
    const nextDone = !item.isDone;
    setSubtasks((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, isDone: nextDone } : s))
    );
    try {
      await taskService.updateSubtask(item.id, { isDone: nextDone });
    } catch {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isDone: item.isDone } : s))
      );
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const prev = subtasks;
    setSubtasks((cur) => cur.filter((s) => s.id !== subtaskId));
    try {
      await taskService.deleteSubtask(subtaskId);
    } catch {
      setSubtasks(prev);
      toast.error('Failed to delete subtask');
    }
  };

  const doneCount = subtasks.filter((a) => a.isDone).length;
  const tabs: Tab[] = ['Notes', 'Comments', 'Files'];

  const handleTabClick = (tab: Tab) => {
    if (tab === 'Comments') {
      setShowComments(true);
      return;
    }
    if (tab === 'Files') {
      setShowFiles(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <>
      <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900'>

        {/* ── Header ─────────────────────────────────── */}
        <div className='flex items-start justify-between border-b border-zinc-700 p-4 sm:p-5'>
          <h2 className='pr-3 text-sm font-bold leading-snug text-white sm:text-base'>
            {task.title}
          </h2>
          <div className='flex flex-shrink-0 items-center gap-1'>
            {onEdit && (
              <button
                onClick={onEdit}
                className='rounded-lg px-2.5 py-1 text-xs font-semibold text-orange-500 dark:text-orange-400 hover:bg-orange-600/10'
              >
                Edit
              </button>
            )}
            <button
              id='close-detail-panel-btn'
              onClick={onClose}
              className='rounded-lg p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Assignee + Due Date ─────────────────────── */}
        <div className='grid grid-cols-1 gap-3 border-b border-zinc-700 px-4 py-3 sm:grid-cols-2 sm:px-5 sm:py-4'>
          <div>
            <p className='mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500'>
              Assignee
            </p>
            <div className='flex items-center gap-2'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white'>
                {(task.assignedTo?.name ?? 'UN').slice(0, 2).toUpperCase()}
              </div>
              <span className='truncate text-sm font-medium text-zinc-300'>
                {task.assignedTo?.name ?? 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <p className='mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500'>
              Due Date
            </p>
            <p className='text-sm font-medium text-zinc-300'>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
            </p>
          </div>
        </div>

        {/* ── Description ──────────────────────────────── */}
        <div className='border-b border-zinc-700 px-4 py-3 sm:px-5 sm:py-4'>
          <div className='mb-2 flex items-center gap-2'>
            <FileText size={13} className='text-zinc-500' />
            <p className='text-xs font-semibold text-zinc-300'>Description</p>
          </div>
          <p className='rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className='flex border-b border-zinc-700 px-4 sm:px-5'>
          {tabs.map((tab) => (
            <button
              key={tab}
              id={`detail-tab-${tab.toLowerCase()}-btn`}
              onClick={() => handleTabClick(tab)}
              className={`mr-3 border-b-2 py-2.5 text-xs font-medium transition-colors sm:mr-4 sm:text-sm ${
                activeTab === tab && tab === 'Notes'
                  ? 'border-orange-600 text-orange-500 dark:text-orange-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
              {tab === 'Comments' && task.comments !== undefined && (
                <span className='ml-1 text-zinc-500'>({task.comments})</span>
              )}
              {tab === 'Files' && (
                <span className='ml-1 text-zinc-500'>({attachments.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Notes / Subtasks + Attachments content ────── */}
        <div className='flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4'>
          {/* Subtasks / Action items */}
          <div className='flex items-center justify-between'>
            <p className='text-[10px] font-semibold uppercase tracking-widest text-zinc-500'>
              Checklist ({subtasks.length})
            </p>
            {subtasks.length > 0 && (
              <span className='text-xs font-semibold text-orange-500 dark:text-orange-400'>
                {doneCount}/{subtasks.length} Done
              </span>
            )}
          </div>

          <form onSubmit={handleAddSubtask} className='mt-2 flex gap-2'>
            <input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder='Add a checklist item…'
              className='min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-600'
            />
            <button
              type='submit'
              disabled={!newSubtaskTitle.trim() || addingSubtask}
              className='flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-40'
            >
              <Plus size={13} /> Add
            </button>
          </form>

          <div className='mt-2.5 space-y-2'>
            {subtasks.length === 0 ? (
              <p className='rounded-xl border border-dashed border-zinc-700 py-3 text-center text-xs text-zinc-500'>
                No checklist items yet.
              </p>
            ) : (
              subtasks.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5'
                >
                  <button
                    type='button'
                    onClick={() => void handleToggleSubtask(item)}
                    aria-label={item.isDone ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                      item.isDone
                        ? 'bg-orange-600'
                        : 'border-2 border-zinc-600 bg-zinc-700 hover:border-orange-500'
                    }`}
                  >
                    {item.isDone && (
                      <svg
                        className='h-3 w-3 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={3}
                      >
                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`min-w-0 flex-1 break-words text-xs sm:text-sm ${
                      item.isDone ? 'text-zinc-500 line-through' : 'text-zinc-300'
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    type='button'
                    onClick={() => void handleDeleteSubtask(item.id)}
                    className='rounded p-1 text-zinc-500 hover:text-red-400'
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Attachments */}
          <div className='mt-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Paperclip size={12} className='text-zinc-500' />
                <p className='text-[10px] font-semibold uppercase tracking-widest text-zinc-500'>
                  Attachments
                </p>
              </div>
              <button
                id='add-attachment-btn'
                onClick={() => setShowFiles(true)}
                className='flex items-center gap-1 text-xs font-semibold text-orange-500 dark:text-orange-400 hover:text-orange-300'
              >
                <Plus size={12} /> Add New
              </button>
            </div>

            {attachments.length === 0 ? (
              <p className='mt-2 rounded-xl border border-dashed border-zinc-700 py-3 text-center text-xs text-zinc-500'>
                No files attached yet.
              </p>
            ) : (
              <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {attachments.map((file) => {
                  const isPdf = file.mimeType === 'application/pdf' || file.originalName.toLowerCase().endsWith('.pdf');
                  return (
                    <button
                      key={file.id}
                      type='button'
                      onClick={() => void taskService.downloadAttachment(file.fileUrl, file.originalName)}
                      className='flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-left transition hover:border-orange-500/50 sm:p-3'
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          isPdf
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-orange-500/10 text-orange-500 dark:text-orange-400'
                        }`}
                      >
                        {isPdf ? <FileText size={14} /> : <ImageIcon size={14} />}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-semibold text-zinc-300'>
                          {file.originalName}
                        </p>
                        <p className='text-[10px] text-zinc-500'>{fmtSize(file.fileSize)}</p>
                      </div>
                      <Download size={13} className='flex-shrink-0 text-zinc-500' />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Open full files view */}
            <button
              onClick={() => setShowFiles(true)}
              className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 py-2 text-xs font-medium text-zinc-500 hover:border-orange-500/50 hover:text-orange-400'
            >
              <MessageCircle size={12} />
              Manage files
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CommentsModal
        open={showComments}
        taskTitle={task.title}
        onClose={() => setShowComments(false)}
      />
      <FilesModal
        open={showFiles}
        taskId={task.id}
        taskTitle={task.title}
        onClose={() => setShowFiles(false)}
        onUploaded={loadExtras}
      />
    </>
  );
}
