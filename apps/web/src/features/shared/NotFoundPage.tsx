import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center'>
      <div className='flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-500/10'>
        <span className='text-5xl font-black text-orange-500 dark:text-orange-400'>4</span>
        <span className='text-5xl font-black text-zinc-700'>0</span>
        <span className='text-5xl font-black text-orange-500 dark:text-orange-400'>4</span>
      </div>
      <h1 className='mt-6 text-2xl font-bold text-zinc-100'>Page not found</h1>
      <p className='mt-2 text-sm text-zinc-400'>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to='/dashboard'
        className='mt-6 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
