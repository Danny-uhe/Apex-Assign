import { X, HelpCircle, CalendarCheck, Bell, ShieldCheck, Mail } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SupportModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4'>
      <div className='w-full max-w-md rounded-t-2xl border border-zinc-700 bg-zinc-900 shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-zinc-700 px-5 py-4 sm:px-6'>
          <div className='flex items-center gap-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500'>
              <HelpCircle size={18} />
            </div>
            <h2 className='text-base font-bold text-white sm:text-lg'>ApexAssign Support</h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          >
            <X size={18} />
          </button>
        </div>

        <div className='space-y-3 p-5 text-sm text-zinc-400 sm:p-6'>
          <div className='flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3.5'>
            <CalendarCheck size={16} className='mt-0.5 flex-shrink-0 text-orange-500' />
            <div>
              <p className='font-semibold text-zinc-200'>My Tasks & Calendar</p>
              <p className='mt-0.5 text-xs'>
                Schedule personal tasks ahead with reminders, repeating rules, and `.ics` calendar export. Missed tasks mark as Expired but can still be completed.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3.5'>
            <Bell size={16} className='mt-0.5 flex-shrink-0 text-orange-500' />
            <div>
              <p className='font-semibold text-zinc-200'>Notifications & Desktop Alerts</p>
              <p className='mt-0.5 text-xs'>
                Open the notification bell in the header and click Enable to receive browser alerts for upcoming reminders, task assignments, and project updates.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3.5'>
            <ShieldCheck size={16} className='mt-0.5 flex-shrink-0 text-orange-500' />
            <div>
              <p className='font-semibold text-zinc-200'>Roles & Approvals</p>
              <p className='mt-0.5 text-xs'>
                Project tasks move to In Review for team members and require a project admin/owner to mark as Done.
              </p>
            </div>
          </div>

          <div className='flex items-center justify-between rounded-xl border border-zinc-700 px-4 py-3 text-xs'>
            <span className='flex items-center gap-2 text-zinc-300'>
              <Mail size={14} className='text-orange-500' /> Need help from an admin?
            </span>
            <a
              href='mailto:support@apexassign.app'
              className='font-semibold text-orange-500 hover:underline'
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
