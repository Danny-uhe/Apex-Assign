import type { MouseEvent } from "react";
import type { PersonalTask } from "../services/personal-task.service";

type Props = {
  task: PersonalTask;
  onClick: (task: PersonalTask) => void;
};

const priorityDot: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-400",
  low:    "bg-zinc-500",
};

export default function TaskCalendarCard({ task, onClick }: Props) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick(task);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-left transition-colors ${
        task.isExpired && task.status !== "done"
          ? "border-red-500/40 bg-red-500/10 hover:bg-red-500/20"
          : "border-zinc-700 bg-zinc-800 hover:border-orange-500/50 hover:bg-zinc-700"
      }`}
    >
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          priorityDot[task.priority] ?? priorityDot.medium
        }`}
      />
      <span
        className={`min-w-0 flex-1 truncate text-[11px] font-medium ${
          task.status === "done"
            ? "text-zinc-500 line-through"
            : "text-zinc-200"
        }`}
      >
        {task.title}
      </span>
      {task.isExpired && task.status !== "done" && (
        <span className="flex-shrink-0 rounded bg-red-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-red-400">
          Expired
        </span>
      )}
    </button>
  );
}
