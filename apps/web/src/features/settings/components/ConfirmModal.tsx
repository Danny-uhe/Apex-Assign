import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
      <div className='w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-100 shadow-2xl'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
              <AlertTriangle size={18} className='text-red-400' />
            </div>
            <h3 className='font-bold text-zinc-100'>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className='rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p className='mt-4 text-sm leading-relaxed text-zinc-400'>{message}</p>

        {/* Actions */}
        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700'
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
