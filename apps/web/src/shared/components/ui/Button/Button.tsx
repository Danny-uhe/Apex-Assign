import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

import type { ButtonProps } from './Button.types';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',

        secondary: 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700',

        outline: 'border border-[var(--color-border)] bg-zinc-900 text-zinc-100 hover:bg-zinc-800',

        ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',

        danger: 'bg-[var(--color-danger)] text-white',
      },

      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-6',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export default function Button({
  className,
  variant,
  size,
  loading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
