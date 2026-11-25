export default function LogoPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-sm select-none">
        A
      </div>
      <span className="text-base font-semibold text-zinc-100 dark:text-zinc-100">ApexAssign</span>
    </div>
  );
}
