import { Mail } from 'lucide-react';

export default function HelpCard() {
  return (
    <div className='rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-5'>
      <h2 className='font-bold text-zinc-100'>Need help with performance?</h2>
      <p className='mt-1 text-sm text-zinc-400'>
        Talk to your team lead or explore our productivity guide.
      </p>

      <button
        id='contact-support-btn'
        className='mt-3 flex items-center gap-1.5 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
      >
        Contact Support
        <Mail className='h-4 w-4' />
      </button>
    </div>
  );
}
