import { Lock } from 'lucide-react';

export default function PeerViewCard() {
  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900 p-5'>
      {/* Header */}
      <h2 className='font-bold text-zinc-100'>Peer view — opted out</h2>
      <p className='mt-0.5 text-xs text-zinc-400'>
        Example of how a teammate who hasn't opted in appears to others
      </p>

      {/* Content */}
      <div className='mt-4 flex flex-col items-center py-2 text-center'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800'>
          <Lock className='h-6 w-6 text-zinc-400' />
        </div>

        <p className='mt-3 text-sm leading-relaxed text-zinc-400'>
          This teammate keeps their task activity private. No rank, no streak,
          no points shown to the team.
        </p>
      </div>
    </div>
  );
}
