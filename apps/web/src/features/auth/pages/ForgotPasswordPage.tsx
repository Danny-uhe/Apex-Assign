import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '@/features/auth/services/auth.services';

export default function ForgotPasswordPage() {
  const [email,       setEmail]       = useState('');
  const [sent,        setSent]        = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      // Always show success — don't reveal if email exists
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className='flex min-h-screen'>
      {/* Left blue panel — hidden on mobile */}
      <div className='hidden flex-col justify-between border-r border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 lg:flex lg:w-[45%]'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-100'>ApexAssign</h1>
          <p className='mt-1 text-sm tracking-widest text-zinc-400'>WORKSPACE</p>
        </div>

        <div>
          <h2 className='text-4xl font-bold leading-tight text-white'>
            Reset your password
          </h2>
          <p className='mt-4 text-zinc-400'>
            We'll send a secure link to your email so you can get back to your
            workspace in minutes.
          </p>
        </div>

        <div className='flex gap-8 text-sm text-zinc-400'>
          <div>
            <p className='text-2xl font-bold text-zinc-100'>2,400+</p>
            <p>Teams using ApexAssign</p>
          </div>
          <div>
            <p className='text-2xl font-bold text-zinc-100'>98%</p>
            <p>Uptime last quarter</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className='flex flex-1 flex-col items-center justify-center bg-zinc-950 px-6 py-12 sm:px-12'>
        <div className='w-full max-w-md'>
          {/* Mobile logo */}
          <h1 className='mb-8 text-2xl font-bold text-orange-500 dark:text-orange-400 lg:hidden'>
            ApexAssign
          </h1>

          {!sent ? (
            <>
              <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10'>
                <Mail size={22} className='text-orange-500 dark:text-orange-400' />
              </div>
              <h2 className='mt-4 text-3xl font-bold text-zinc-100'>
                Forgot password?
              </h2>
              <p className='mt-2 text-sm text-zinc-400'>
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className='mt-8 space-y-4'>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400'>
                    Email address
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@company.com'
                    required
                    className='h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='h-11 w-full rounded-xl bg-orange-600 text-sm font-semibold text-zinc-950 transition hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60'
                >
                  {isLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className='flex flex-col items-center text-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10'>
                <CheckCircle2 size={32} className='text-green-400' />
              </div>
              <h2 className='mt-5 text-2xl font-bold text-zinc-100'>
                Check your inbox
              </h2>
              <p className='mt-2 text-sm text-zinc-400'>
                We sent a password reset link to{' '}
                <span className='font-semibold text-zinc-200'>{email}</span>
              </p>
              <p className='mt-4 text-xs text-zinc-400'>
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                className='mt-5 text-sm font-semibold text-orange-500 dark:text-orange-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
              >
                Try a different email
              </button>
            </div>
          )}

          {/* Back to login */}
          <Link
            to='/login'
            className='mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
          >
            <ArrowLeft size={16} />
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
