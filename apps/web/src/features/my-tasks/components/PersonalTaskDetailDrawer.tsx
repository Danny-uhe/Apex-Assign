import { useState } from "react";
import {
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  CalendarDays,
  Bell,
  Clock,
  Repeat,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  personalTaskService,
  type PersonalTask,
  type PersonalTaskStatus,
} from "../services/personal-task.service";

type Props = {
  task: PersonalTask | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: PersonalTask) => void;
  onUpdated?: (task: PersonalTask, nextTask?: PersonalTask | null) => void;
  onDeleted?: (id: string) => void;
};

const priorityBadge: Record<string, { label: string; cls: string }> = {
  high:   { label: "High",   cls: "bg-red-500/20 text-red-400"    },
  medium: { label: "Medium", cls: "bg-amber-400/20 text-amber-400" },
  low:    { label: "Low",    cls: "bg-zinc-500/20 text-zinc-400"   },
};

const statusFlow: PersonalTaskStatus[] = ["todo", "in_progress", "done"];
const statusLabel: Record<PersonalTaskStatus, string> = {
  todo:        "To Do",
  in_progress: "In Progress",
  done:        "Done",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const datePart = d.slice(0, 10);
  return new Date(`${datePart}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
  });
}

export default function PersonalTaskDetailDrawer({
  task,
  open,
  onClose,
  onEdit,
  onUpdated,
  onDeleted,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!open || !task) return null;

  const badge = priorityBadge[task.priority] ?? priorityBadge.medium;

  const handleStatusChange = async (newStatus: PersonalTaskStatus) => {
    if (task.status === newStatus || updating) return;
    setUpdating(true);
    try {
      const res = await personalTaskService.update(task.id, { status: newStatus });
      toast.success(
        res.data.nextTask
          ? `Completed! Next occurrence scheduled.`
          : `Status updated to ${statusLabel[newStatus]}`
      );
      onUpdated?.(res.data.task, res.data.nextTask);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await personalTaskService.delete(task.id);
      toast.success("Task deleted");
      onDeleted?.(task.id);
      onClose();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />

      {/* Slide-in Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Task Details</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-orange-500 dark:text-orange-400 hover:bg-orange-500/10"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40"
            >
              <Trash2 size={13} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Expired banner */}
          {task.isExpired && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-400">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
              <span>This task has expired. You can still mark it as done.</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white">{task.title}</h3>

          {/* Description */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Description
            </p>
            <p className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-sm leading-relaxed text-zinc-400">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Priority
              </p>
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badge.cls}`}
              >
                {badge.label}
              </span>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Status
              </p>
              <span className="text-sm font-semibold text-zinc-200">
                {statusLabel[task.status] ?? task.status}
              </span>
            </div>

            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <CalendarDays size={11} /> Due Date
              </p>
              <span className="text-sm text-zinc-300">{fmtDate(task.dueDate)}</span>
            </div>

            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <Bell size={11} /> Reminder
              </p>
              <span className="text-sm text-zinc-300">
                {fmtDateTime(task.reminderAt)}
              </span>
            </div>

            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <Clock size={11} /> Expiration
              </p>
              <span
                className={`text-sm font-medium ${
                  task.isExpired ? "text-red-400" : "text-zinc-300"
                }`}
              >
                {task.isExpired
                  ? "Expired"
                  : task.expiresAt
                  ? `Expires ${fmtDate(task.expiresAt)}`
                  : "No expiration"}
              </span>
            </div>

            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <Repeat size={11} /> Repeat
              </p>
              <span className="text-sm capitalize text-zinc-300">
                {task.repeat && task.repeat !== "none" ? task.repeat : "Does not repeat"}
              </span>
            </div>
          </div>

          {/* Status change buttons */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Move Status
            </p>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  disabled={updating || task.status === s}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    task.status === s
                      ? "bg-orange-600 text-white"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-orange-500/50 hover:text-zinc-200"
                  }`}
                >
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 border-t border-zinc-700 pt-4 text-xs text-zinc-500">
            <p>Created: {fmtDateTime(task.createdAt)}</p>
            <p>Updated: {fmtDateTime(task.updatedAt)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-700 px-6 py-4">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            <Trash2 size={14} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </aside>
    </>
  );
}
