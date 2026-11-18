import { CheckCircle2 } from 'lucide-react';
import type { AuthBrandingProps } from './AuthBranding.types';

export default function AuthBranding({
  quote,
  author,
  statOne,
  statOneLabel,
  statTwo,
  statTwoLabel,
  features,
}: AuthBrandingProps) {
  return (
    <div className='flex h-full flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 px-8 py-10 text-zinc-100'>
      {/* Logo image — replaces old text header */}
      <div>
        <img
          src='/logo.png'
          alt='ApexAssign'
          className='h-12 w-auto'
        />
      </div>

      {/* Quote */}
      <div className='mt-auto mb-24 max-w-[360px]'>
        <h2 className='text-[22px] font-semibold leading-[40px]'>{quote}</h2>

        <p className='mt-8 text-[16px] text-zinc-400'>{author}</p>
      </div>

      {/* Stats */}
      <div className='flex gap-16'>
        <div>
          <h3 className='text-[42px] font-bold leading-none'>{statOne}</h3>

          <p className='mt-2 text-sm text-zinc-400'>{statOneLabel}</p>
        </div>

        <div>
          <h3 className='text-[42px] font-bold leading-none'>{statTwo}</h3>

          <p className='mt-2 text-sm text-zinc-400'>{statTwoLabel}</p>
        </div>
      </div>

      {/* Features */}
      <div className='mt-10 rounded-2xl border border-zinc-700 bg-zinc-800/70 p-6'>
        <div className='space-y-4'>
          {features.map((feature) => (
            <div key={feature} className='flex items-center gap-3'>
              <CheckCircle2
                size={18}
                className='text-cyan-400'
                strokeWidth={2.5}
              />

              <span className='text-[15px]'>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
