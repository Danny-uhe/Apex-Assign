import type { AuthLayoutProps } from './AuthLayout.types';
import VantaGlobe from '@/features/auth/components/VantaGlobe';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className='relative flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-12'>
      {/* Animated orange particle network background */}
      <VantaGlobe />

      <div className='fixed right-5 top-5 z-20'>
        <ThemeToggle />
      </div>

      {/* Frosted-glass login card — sits above the canvas */}
      <div className='relative z-10 w-full max-w-[420px]'>
        <header className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex w-fit items-center gap-3 drop-shadow-[0_0_24px_rgba(234,88,12,0.35)]'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white shadow-lg shadow-orange-600/30 select-none'>
              A
            </div>
            <span className='text-2xl font-bold tracking-tight text-zinc-100'>
              ApexAssign
            </span>
          </div>
          <p className='mt-2 text-sm text-zinc-400'>
            A clearer way to work together.
          </p>
        </header>

        {/* Card with subtle glass effect */}
        <section className='rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-md sm:p-8'>
          {children}
        </section>
      </div>
    </main>
  );
}
