import { useState, useEffect } from "react";
import { X, CalendarDays, Bell, Clock, UserCheck, Repeat } from "lucide-react";
import toast from "react-hot-toast";
import {
  personalTaskService,
  type PersonalTask,
  type PersonalTaskPriority,
  type PersonalTaskRepeat,
  type PersonalTaskStatus,
} from "../services/personal-task.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (task: PersonalTask) => void;
  defaultDueDate?: string;
  editTask?: PersonalTask | null;
};

const priorities: { value: PersonalTaskPriority; label: string; dot: string }[] = [
  { value: "high",   label: "High",   dot: "bg-red-500"   },
  { value: "medium", label: "Medium", dot: "bg-amber-400" },
  { value: "low",    label: "Low",    dot: "bg-zinc-500"  },
];

const statuses: { value: PersonalTaskStatus; label: string }[] = [
  { value: "todo",        label: "To Do"       },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done"        },
];

const repeatOptions: { value: PersonalTaskRepeat; label: string }[] = [
  { value: "none",    label: "Does not repeat" },
  { value: "daily",   label: "Daily"           },
  { value: "weekly",  label: "Weekly"          },
  { value: "monthly", label: "Monthly"         },
];

const reminderOptions = [
  { label: "No reminder",         value: "none"   },
  { label: "At time of due date", value: "at"     },
  { label: "15 min before",       value: "15min"  },
  { label: "1 hour before",       value: "1hour"  },
  { label: "1 day before",        value: "1day"   },
  { label: "Custom datetime",     value: "custom" },
] as const;

type ReminderOption = (typeof reminderOptions)[number]["value"];

function toLocalDateStr(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalDatetimeInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computePresetDatetimeLocal(option: ReminderOption, dueDateStr: string): string {
  if (!dueDateStr || option === "none" || option === "custom") return "";
  const [y, m, d] = dueDateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  // Default due time 09:00 local time
  const base = new Date(y, m - 1, d, 9, 0, 0, 0);
  const offsetMs: Record<string, number> = {
    at: 0,
    "15min": 15 * 60_000,
    "1hour": 60 * 60_000,
    "1day": 24 * 60 * 60_000,
  };
  const target = new Date(base.getTime() - (offsetMs[option] ?? 0));
  return toLocalDatetimeInput(target.toISOString());
}

export default function AddPersonalTaskModal({
  open,
  onClose,
  onSaved,
  defaultDueDate = "",
  editTask = null,
}: Props) {
  const isEdit = Boolean(editTask);

  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [priority,       setPriority]       = useState<PersonalTaskPriority>("medium");
  const [status,         setStatus]         = useState<PersonalTaskStatus>("todo");
  const [repeat,         setRepeat]         = useState<PersonalTaskRepeat>("none");
  const [dueDate,        setDueDate]        = useState("");
  const [expiresAt,      setExpiresAt]      = useState("");
  const [addToCalendar,  setAddToCalendar]  = useState(true);
  const [reminderOption, setReminderOption] = useState<ReminderOption>("none");
  const [reminderDt,     setReminderDt]     = useState("");
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description ?? "");
      setPriority(editTask.priority ?? "medium");
      setStatus(editTask.status ?? "todo");
      setRepeat(editTask.repeat ?? "none");
      const due = editTask.dueDate ? editTask.dueDate.slice(0, 10) : "";
      setDueDate(due);
      setAddToCalendar(Boolean(due));
      setExpiresAt(editTask.expiresAt ? editTask.expiresAt.slice(0, 10) : "");
      if (editTask.reminderAt) {
        setReminderOption("custom");
        setReminderDt(toLocalDatetimeInput(editTask.reminderAt));
      } else {
        setReminderOption("none");
        setReminderDt("");
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setRepeat("none");
      setDueDate(defaultDueDate);
      setAddToCalendar(true);
      setExpiresAt("");
      setReminderOption("none");
      setReminderDt("");
    }
    setSaving(false);
  }, [open, editTask, defaultDueDate]);

  if (!open) return null;

  const handleToggleCalendar = () => {
    const next = !addToCalendar;
    setAddToCalendar(next);
    if (next && !dueDate) {
      setDueDate(toLocalDateStr());
    } else if (!next) {
      setDueDate("");
    }
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    if (val && !addToCalendar) {
      setAddToCalendar(true);
    }
    if (reminderOption !== "none" && reminderOption !== "custom") {
      setReminderDt(computePresetDatetimeLocal(reminderOption, val));
    }
  };

  const handleReminderOptionChange = (opt: ReminderOption) => {
    setReminderOption(opt);
    if (opt === "none") {
      setReminderDt("");
    } else if (opt === "custom") {
      if (!reminderDt && dueDate) {
        setReminderDt(computePresetDatetimeLocal("at", dueDate));
      }
    } else {
      const targetDue = dueDate || toLocalDateStr();
      if (!dueDate) {
        setDueDate(targetDue);
        setAddToCalendar(true);
      }
      setReminderDt(computePresetDatetimeLocal(opt, targetDue));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const resolvedDueDate = addToCalendar && dueDate ? dueDate : undefined;
      const resolvedReminder =
        reminderOption !== "none" && reminderDt
          ? new Date(reminderDt).toISOString()
          : undefined;

      let savedTask: PersonalTask;

      if (editTask) {
        const res = await personalTaskService.update(editTask.id, {
          title:       title.trim(),
          description: description.trim() || null,
          priority,
          status,
          repeat,
          dueDate:     resolvedDueDate ?? null,
          reminderAt:  resolvedReminder ?? null,
          expiresAt:   expiresAt || null,
        });
        savedTask = res.data.task;
        toast.success("Personal task updated");
      } else {
        const res = await personalTaskService.create({
          title:       title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          repeat,
          dueDate:     resolvedDueDate,
          reminderAt:  resolvedReminder,
          expiresAt:   expiresAt || undefined,
        });
        savedTask = res.data.task;
        toast.success("Personal task created");
      }

      onSaved?.(savedTask);
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ??
          (isEdit ? "Failed to update task" : "Failed to create task")
      );
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <div className="flex w-full max-w-md flex-col rounded-t-2xl bg-zinc-900 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white">
              {isEdit ? "Edit Personal Task" : "Add Personal Task"}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500 dark:text-orange-400">
              <UserCheck size={11} />
              Assigned to me
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-300">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish sprint retrospective notes"
              className={inp}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details…"
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 py-3 transition-all ${
                    priority === p.value
                      ? "border-orange-600 bg-orange-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${p.dot}`} />
                  <span
                    className={`text-sm font-semibold ${
                      priority === p.value ? "text-white" : "text-zinc-400"
                    }`}
                  >
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    status === s.value
                      ? "bg-orange-600 text-white"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Calendar toggle */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Add to Calendar
              </p>
              <p className="text-xs text-zinc-500">
                Sets the due date as a calendar event
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addToCalendar}
              onClick={handleToggleCalendar}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                addToCalendar ? "bg-orange-600" : "bg-zinc-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  addToCalendar ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-300">
              Due Date
            </label>
            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className={`${inp} pl-9`}
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Bell size={14} className="text-orange-500" />
              Reminder
            </label>
            <select
              value={reminderOption}
              onChange={(e) =>
                handleReminderOptionChange(e.target.value as ReminderOption)
              }
              className={inp}
            >
              {reminderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={reminderDt}
              onChange={(e) => {
                setReminderDt(e.target.value);
                setReminderOption(e.target.value ? "custom" : "none");
              }}
              aria-label="Reminder date and time"
              className={inp}
            />
          </div>

          {/* Repeat */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Repeat size={14} className="text-orange-500" />
              Repeat
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as PersonalTaskRepeat)}
              className={inp}
            >
              {repeatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expires At */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Clock size={14} className="text-zinc-400" />
              Expires At{" "}
              <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={`${inp} pl-9`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-700 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className="rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40"
          >
            {saving
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
              ? "Save Changes"
              : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
