import { Mail } from 'lucide-react';

export default function HelpCard() {
  return (
    <div className='rounded-2xl border border-dashed border-orange-500/30 bg-orange-600/5 p-5'>
      <h2 className='font-bold text-zinc-100'>Need help with performance?</h2>
      <p className='mt-1 text-sm text-zinc-400'>
        Talk to your team lead or explore our productivity guide.
      </p>

      <button
        id='contact-support-btn'
        className='mt-3 flex items-center gap-1.5 text-sm font-semibold text-orange-500 dark:text-orange-400 transition-colors hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
      >
        Contact Support
        <Mail className='h-4 w-4' />
      </button>
    </div>
  );
}
