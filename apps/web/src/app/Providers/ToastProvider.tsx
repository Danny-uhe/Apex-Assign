import { useState } from 'react';
import { CircleAlert, CircleCheck, Info, LoaderCircle, X } from 'lucide-react';
import { ToastBar, Toaster, toast } from 'react-hot-toast';

function ToastContent({
  message,
  notificationId,
}: {
  message: React.ReactNode;
  notificationId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLongMessage = typeof message === 'string' && message.length > 180;

  return (
    <div className='min-w-0 flex-1'>
      <div
        id={`toast-message-${notificationId}`}
        className={`text-sm font-medium leading-5 text-zinc-100 [overflow-wrap:anywhere] ${
          isLongMessage && !expanded
            ? 'line-clamp-4'
            : expanded
              ? 'max-h-[35vh] overflow-y-auto whitespace-pre-wrap'
              : ''
        }`}
      >
        {message}
      </div>
      {isLongMessage && (
        <button
          type='button'
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={`toast-message-${notificationId}`}
          className='mt-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:underline'
        >
          {expanded ? 'Show less' : 'Show details'}
        </button>
      )}
    </div>
  );
}

export default function ToastProvider() {
  return (
    <Toaster
      position='top-right'
      gutter={12}
      toastOptions={{
        duration: 4000,
        error: { duration: 6500 },
      }}
    >
      {(notification) => {
        const isError = notification.type === 'error';
        const isSuccess = notification.type === 'success';
        const Icon = isError
          ? CircleAlert
          : isSuccess
            ? CircleCheck
            : notification.type === 'loading'
              ? LoaderCircle
              : Info;
        const tone = isError
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : isSuccess
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';

        return (
          <ToastBar
            toast={notification}
            style={{
              background: 'transparent',
              boxShadow: 'none',
              maxWidth: 'calc(100vw - 2rem)',
              padding: 0,
            }}
          >
            {({ message }) => (
              <div className='flex w-[min(26rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-left shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04]'>
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tone}`}
                  aria-hidden='true'
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${notification.type === 'loading' ? 'animate-spin' : ''}`}
                    strokeWidth={2}
                  />
                </span>
                <ToastContent message={message} notificationId={notification.id} />
                <button
                  type='button'
                  onClick={() => toast.dismiss(notification.id)}
                  aria-label='Dismiss notification'
                  className='-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                >
                  <X className='h-4 w-4' aria-hidden='true' />
                </button>
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
