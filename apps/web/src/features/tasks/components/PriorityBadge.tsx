type Props = {
  priority: 'High' | 'Medium' | 'Low';
};

export default function PriorityBadge({ priority }: Props) {
  const styles = {
    High: 'bg-red-100 text-red-600',
    Medium: 'bg-orange-100 text-orange-600',
    Low: 'bg-zinc-800 text-zinc-300',
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}
