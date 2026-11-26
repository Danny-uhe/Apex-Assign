import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  List,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  X,
  Repeat,
  Folder,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "@/layout/AppLayout";
import { useTaskContext } from "@/app/Providers/TaskContext";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import TaskDetailPanel from "@/features/tasks/components/TaskDetailPanel";
import EditTaskModal from "@/features/tasks/components/EditTaskModal";
import type { Task } from "@/features/tasks/types/types";
import {
  personalTaskService,
  type PersonalTask,
} from "../services/personal-task.service";
import { usePersonalTaskStore } from "../store/personalTaskStore";
import AddPersonalTaskModal from "../components/AddPersonalTaskModal";
import TaskCalendarCard from "../components/TaskCalendarCard";
import PersonalTaskDetailDrawer from "../components/PersonalTaskDetailDrawer";

type ViewTab = "list" | "calendar";
type CalendarFilter = "all" | "personal" | "project";

const PRIORITY_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  high:   { label: "High",   cls: "bg-red-500/15 text-red-400",     dot: "bg-red-500"   },
  medium: { label: "Medium", cls: "bg-amber-400/15 text-amber-400", dot: "bg-amber-400" },
  low:    { label: "Low",    cls: "bg-zinc-500/15 text-zinc-400",   dot: "bg-zinc-500"  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDue(d?: string | null): string | null {
  if (!d) return null;
  const datePart = d.slice(0, 10);
  return new Date(`${datePart}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

export default function MyTasksPage() {
  const {
    tasks,
    loading,
    addModalOpen,
    defaultDueDate,
    openAddModal,
    closeAddModal,
    fetchTasks,
    upsertTask,
    removeTask,
  } = usePersonalTaskStore();

  const { tasks: projectTasks } = useTaskContext();
  const projects = useProjectStore((s) => s.projects);
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<ViewTab>("list");
  const [calFilter, setCalFilter] = useState<CalendarFilter>("all");
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [editTask, setEditTask] = useState<PersonalTask | null>(null);
  const [selectedProjectTask, setSelectedProjectTask] = useState<Task | null>(null);
  const [editProjectTask, setEditProjectTask] = useState<Task | null>(null);

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [calendarMap, setCalendarMap] = useState<Record<string, PersonalTask[]>>({});
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      await fetchTasks();
    } catch {
      toast.error("Failed to load personal tasks");
    }
  }, [fetchTasks]);

  const loadCalendar = useCallback(async (year: number, month0: number) => {
    setCalLoading(true);
    try {
      const res = await personalTaskService.getCalendar(year, month0 + 1);
      setCalendarMap(res.data.calendar ?? {});
    } catch {
      // Fall back to empty map; local tasks with dueDate still render if needed
      setCalendarMap({});
    } finally {
      setCalLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (activeTab === "calendar") {
      loadCalendar(calYear, calMonth);
    }
  }, [activeTab, calYear, calMonth, loadCalendar]);

  const refreshAll = useCallback(() => {
    loadTasks();
    if (activeTab === "calendar") {
      loadCalendar(calYear, calMonth);
    }
  }, [loadTasks, loadCalendar, activeTab, calYear, calMonth]);

  // ── List View grouping ─────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const expired = tasks.filter((t) => t.isExpired && t.status !== "done");
    const todo = tasks.filter((t) => t.status === "todo" && !t.isExpired);
    const inProgress = tasks.filter((t) => t.status === "in_progress" && !t.isExpired);
    const done = tasks.filter((t) => t.status === "done");

    return [
      {
        key:   "todo",
        title: "Todo",
        icon:  Circle,
        accent: "text-zinc-400",
        items: todo,
      },
      {
        key:   "in_progress",
        title: "In Progress",
        icon:  Clock,
        accent: "text-orange-500 dark:text-orange-400",
        items: inProgress,
      },
      {
        key:   "done",
        title: "Done",
        icon:  CheckCircle2,
        accent: "text-green-400",
        items: done,
      },
      {
        key:   "expired",
        title: "Expired",
        icon:  AlertTriangle,
        accent: "text-red-400",
        items: expired,
      },
    ];
  }, [tasks]);

  // ── Calendar grid computation ──────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const cells: Array<{ date: Date | null; dayNum: number | null; key: string }> = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, dayNum: null, key: `pad-start-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calYear, calMonth, day);
      cells.push({ date, dayNum: day, key: toDateKey(date) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dayNum: null, key: `pad-end-${cells.length}` });
    }

    return cells;
  }, [calYear, calMonth]);

  // Merge API calendar map + fallback by dueDate so keys of any format work cleanly
  const tasksByDateKey = useMemo(() => {
    const map: Record<string, PersonalTask[]> = {};

    const addEntry = (key: string, task: PersonalTask) => {
      if (!map[key]) map[key] = [];
      if (!map[key].some((t) => t.id === task.id)) {
        map[key].push(task);
      }
    };

    const pad = (n: number) => String(n).padStart(2, "0");
    for (const [rawKey, list] of Object.entries(calendarMap)) {
      let normalized = rawKey;
      if (/^\d{1,2}$/.test(rawKey)) {
        normalized = `${calYear}-${pad(calMonth + 1)}-${pad(Number(rawKey))}`;
      } else if (rawKey.length > 10) {
        normalized = rawKey.slice(0, 10);
      }
      for (const task of list) {
        addEntry(normalized, task);
      }
    }

    // Also include tasks from store that fall in the displayed month
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      const [y, m] = key.split("-").map(Number);
      if (y === calYear && m === calMonth + 1) {
        addEntry(key, task);
      }
    }

    return map;
  }, [calendarMap, tasks, calYear, calMonth]);

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });

  const handlePrevMonth = () => {
    setSelectedDayKey(null);
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayKey(null);
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedDayKey(null);
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
  };

  const todayKey = toDateKey(today);
  const selectedDayTasks = selectedDayKey ? tasksByDateKey[selectedDayKey] ?? [] : [];

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const projectTasksByDateKey = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of projectTasks) {
      if (!task.dueDate) continue;
      // Include tasks assigned to current user or unassigned in their projects
      if (task.assignedToId && currentUser?.id && task.assignedToId !== currentUser.id) {
        continue;
      }
      const key = task.dueDate.slice(0, 10);
      const [y, m] = key.split("-").map(Number);
      if (y === calYear && m === calMonth + 1) {
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [projectTasks, currentUser?.id, calYear, calMonth]);

  const selectedDayProjectTasks = selectedDayKey
    ? projectTasksByDateKey[selectedDayKey] ?? []
    : [];

  const handleExportIcs = () => {
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const toIcsDate = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
    const nowStamp = (() => {
      const d = new Date();
      return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
    })();
    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

    const events: string[] = [];
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const dt = toIcsDate(t.dueDate);
      events.push(
        "BEGIN:VEVENT",
        `UID:personal-${t.id}@apexassign`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `SUMMARY:${esc(t.title)}`,
        ...(t.description ? [`DESCRIPTION:${esc(t.description)}`] : []),
        "END:VEVENT"
      );
    }
    for (const pt of projectTasks) {
      if (!pt.dueDate) continue;
      if (pt.assignedToId && currentUser?.id && pt.assignedToId !== currentUser.id) continue;
      const dt = toIcsDate(pt.dueDate);
      events.push(
        "BEGIN:VEVENT",
        `UID:project-${pt.id}@apexassign`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `SUMMARY:${esc(`[Project] ${pt.title}`)}`,
        ...(pt.description ? [`DESCRIPTION:${esc(pt.description)}`] : []),
        "END:VEVENT"
      );
    }

    if (events.length === 0) {
      toast.error("No scheduled tasks with due dates to export");
      return;
    }

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ApexAssign//MyTasks//EN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apexassign-tasks.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Calendar exported (.ics)");
  };

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* ── Top Controls Bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs: List View | Calendar View */}
          <div className="grid w-full grid-cols-2 items-center gap-1 rounded-2xl border border-zinc-700 bg-zinc-900 p-1 sm:inline-flex sm:w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                activeTab === "list"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <List size={16} />
              List View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                activeTab === "calendar"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <CalendarIcon size={16} />
              Calendar View
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportIcs}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-white sm:text-sm"
            >
              <Download size={15} />
              Export .ics
            </button>

            {/* Prominent Add Task button */}
            <button
              type="button"
              onClick={() => openAddModal()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 active:scale-95 sm:flex-initial"
            >
              <Plus size={17} />
              Add Task
            </button>
          </div>
        </div>

        {/* ══════════════ LIST VIEW ══════════════ */}
        {activeTab === "list" && (
          <>
            {loading && tasks.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-orange-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 py-20 text-center">
                <CalendarDays size={36} className="mb-3 text-zinc-500 opacity-60" />
                <p className="text-base font-semibold text-zinc-200">
                  No personal tasks yet
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Create your first personal task to organize your schedule.
                </p>
                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {groups.map(({ key, title, icon: Icon, accent, items }) => (
                  <section
                    key={key}
                    className="flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-zinc-700 pb-3">
                      <div className="flex items-center gap-2">
                        <Icon size={17} className={accent} />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                          {title}
                        </h2>
                      </div>
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-300">
                        {items.length}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-700 py-8 text-xs text-zinc-500">
                        No {title.toLowerCase()} tasks
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {items.map((task) => {
                          const pBadge = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium;
                          const dueStr = formatDue(task.dueDate);

                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => setSelectedTask(task)}
                              className="flex w-full flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3.5 text-left transition-all hover:border-orange-500/50 hover:shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span
                                  className={`text-sm font-semibold ${
                                    task.status === "done"
                                      ? "text-zinc-500 line-through"
                                      : "text-white"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <div className="flex flex-shrink-0 items-center gap-1.5">
                                  {task.isExpired && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
                                      <AlertTriangle size={11} />
                                      Expired
                                    </span>
                                  )}
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pBadge.cls}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${pBadge.dot}`} />
                                    {pBadge.label}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                                {dueStr && (
                                  <span className="flex items-center gap-1">
                                    <CalendarDays size={12} className="text-zinc-500" />
                                    Due {dueStr}
                                  </span>
                                )}
                                {task.reminderAt && (
                                  <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                                    <Bell size={12} />
                                    Reminder set
                                  </span>
                                )}
                                {task.repeat && task.repeat !== "none" && (
                                  <span className="flex items-center gap-1 capitalize text-zinc-400">
                                    <Repeat size={12} className="text-orange-500" />
                                    {task.repeat}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════ CALENDAR VIEW ══════════════ */}
        {activeTab === "calendar" && (
          <div className="relative rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-sm sm:p-6">
            {/* Calendar header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  {monthLabel}
                </h2>
                {calLoading && (
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-800 p-0.5 text-xs font-semibold">
                  {(["all", "personal", "project"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCalFilter(f)}
                      className={`rounded-lg px-2.5 py-1 capitalize transition-colors ${
                        calFilter === f
                          ? "bg-orange-600 text-white"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {f === "project" ? "Project Tasks" : f}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-white"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Responsive scrollable calendar wrapper for small/medium screens */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[600px]">
                {/* Weekday headers */}
                <div className="mb-2 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell) => {
                if (!cell.date || cell.dayNum === null) {
                  return (
                    <div
                      key={cell.key}
                      className="min-h-[96px] rounded-xl border border-transparent bg-zinc-800/30 p-2 sm:min-h-[112px]"
                    />
                  );
                }

                const dayPersonalTasks = calFilter === "project" ? [] : (tasksByDateKey[cell.key] ?? []);
                const dayProjectTasks = calFilter === "personal" ? [] : (projectTasksByDateKey[cell.key] ?? []);
                const totalDayCount = dayPersonalTasks.length + dayProjectTasks.length;
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selectedDayKey;

                return (
                  <div
                    key={cell.key}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedDayKey(isSelected ? null : cell.key)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDayKey(isSelected ? null : cell.key);
                      }
                    }}
                    className={`flex min-h-[96px] cursor-pointer flex-col gap-1.5 rounded-xl border p-2 text-left transition-colors sm:min-h-[112px] ${
                      isSelected
                        ? "border-orange-600 bg-orange-500/10"
                        : isToday
                        ? "border-orange-500/60 bg-zinc-800"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {/* Day number + colored task dots */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-orange-600 text-white"
                            : "text-zinc-300"
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {totalDayCount > 0 && (
                        <div className="flex items-center gap-1">
                          {dayPersonalTasks.slice(0, 3).map((t) => {
                            const dot =
                              t.isExpired && t.status !== "done"
                                ? "bg-red-500"
                                : PRIORITY_BADGE[t.priority]?.dot ?? "bg-amber-400";
                            return (
                              <span
                                key={t.id}
                                className={`h-2 w-2 rounded-full ${dot}`}
                              />
                            );
                          })}
                          {dayProjectTasks.slice(0, 2).map((pt) => {
                            const proj = projectMap.get(pt.projectId);
                            return (
                              <span
                                key={pt.id}
                                className="h-2 w-2 rounded-sm"
                                style={{ backgroundColor: proj?.color ?? "#ea580c" }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Task cards inside cell */}
                    <div className="flex flex-col gap-1">
                      {dayPersonalTasks.slice(0, 2).map((t) => (
                        <TaskCalendarCard
                          key={t.id}
                          task={t}
                          onClick={(task) => setSelectedTask(task)}
                        />
                      ))}
                      {dayPersonalTasks.length < 2 &&
                        dayProjectTasks.slice(0, 2 - dayPersonalTasks.length).map((pt) => {
                          const proj = projectMap.get(pt.projectId);
                          return (
                            <button
                              key={pt.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectTask(pt);
                              }}
                              className="flex w-full items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-left transition-colors hover:border-orange-500/50"
                            >
                              <span
                                className="h-2 w-2 flex-shrink-0 rounded-sm"
                                style={{ backgroundColor: proj?.color ?? "#ea580c" }}
                              />
                              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">
                                {pt.title}
                              </span>
                            </button>
                          );
                        })}
                      {totalDayCount > 2 && (
                        <span className="px-1 text-[10px] font-semibold text-orange-500 dark:text-orange-400">
                          +{totalDayCount - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>

            {/* Day Popover / Selected Day Tasks */}
            {selectedDayKey && (
              <div className="mt-5 rounded-2xl border border-orange-500/40 bg-zinc-800 p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 dark:text-orange-400">
                      Tasks for{" "}
                      {new Date(`${selectedDayKey}T00:00:00`).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month:   "short",
                          day:     "numeric",
                          year:    "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAddModal(selectedDayKey)}
                      className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                    >
                      <Plus size={13} />
                      Add for day
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDayKey(null)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {((calFilter === "project" ? 0 : selectedDayTasks.length) +
                  (calFilter === "personal" ? 0 : selectedDayProjectTasks.length)) === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500">
                    No tasks scheduled for this day.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {calFilter !== "project" && selectedDayTasks.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {selectedDayTasks.map((t) => (
                          <TaskCalendarCard
                            key={t.id}
                            task={t}
                            onClick={(task) => setSelectedTask(task)}
                          />
                        ))}
                      </div>
                    )}
                    {calFilter !== "personal" && selectedDayProjectTasks.length > 0 && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          <Folder size={12} className="text-orange-500" />
                          Project Tasks
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {selectedDayProjectTasks.map((pt) => {
                            const proj = projectMap.get(pt.projectId);
                            return (
                              <button
                                key={pt.id}
                                type="button"
                                onClick={() => setSelectedProjectTask(pt)}
                                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-left transition-colors hover:border-orange-500/50"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                                    style={{ backgroundColor: proj?.color ?? "#ea580c" }}
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-zinc-200">{pt.title}</p>
                                    {proj && <p className="truncate text-[10px] text-zinc-500">{proj.name}</p>}
                                  </div>
                                </div>
                                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] capitalize text-zinc-400">
                                  {pt.status.replace("_", " ")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Personal Task Modal */}
      <AddPersonalTaskModal
        open={addModalOpen || editTask !== null}
        editTask={editTask}
        defaultDueDate={defaultDueDate}
        onClose={() => {
          closeAddModal();
          setEditTask(null);
        }}
        onSaved={(saved) => {
          upsertTask(saved);
          if (selectedTask?.id === saved.id) {
            setSelectedTask(saved);
          }
          refreshAll();
        }}
      />

      {/* Detail Drawer */}
      <PersonalTaskDetailDrawer
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setEditTask(task);
        }}
        onUpdated={(updated, nextTask) => {
          upsertTask(updated);
          if (nextTask) upsertTask(nextTask);
          setSelectedTask(updated);
          refreshAll();
        }}
        onDeleted={(id) => {
          removeTask(id);
          setSelectedTask(null);
          refreshAll();
        }}
      />

      {/* Project Task Detail Drawer */}
      {selectedProjectTask && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSelectedProjectTask(null)} />
          <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[420px] flex-col overflow-hidden bg-zinc-900 shadow-2xl">
            <TaskDetailPanel
              task={selectedProjectTask}
              onClose={() => setSelectedProjectTask(null)}
              onEdit={() => {
                setEditProjectTask(selectedProjectTask);
                setSelectedProjectTask(null);
              }}
            />
          </div>
        </>
      )}

      <EditTaskModal
        open={editProjectTask !== null}
        task={editProjectTask}
        onClose={() => setEditProjectTask(null)}
      />
    </AppLayout>
  );
}
