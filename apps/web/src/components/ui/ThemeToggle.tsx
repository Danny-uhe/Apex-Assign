import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/Providers/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex h-9 w-9 items-center justify-center rounded-full border
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400
        sm:h-10 sm:w-10
        ${isDark
          ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-sky-400 hover:text-sky-400'
          : 'border-slate-200 bg-white text-slate-500 hover:border-sky-500 hover:text-sky-600 shadow-sm'
        }
      `}
    >
      {isDark
        ? <Sun size={17} />
        : <Moon size={17} />
      }
    </button>
  );
}
