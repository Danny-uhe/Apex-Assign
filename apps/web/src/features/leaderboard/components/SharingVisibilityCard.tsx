import type { GamificationPreferences } from '../services/leaderboard.service';

type PreferenceKey = keyof GamificationPreferences;

function Toggle({
  id,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      id={id}
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-wait disabled:opacity-60 ${
        checked ? 'bg-orange-600' : 'bg-zinc-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function SharingVisibilityCard({
  preferences,
  savingPreference,
  onChange,
}: {
  preferences: GamificationPreferences;
  savingPreference: PreferenceKey | null;
  onChange: (key: PreferenceKey, value: boolean) => void;
}) {
  const items: {
    key: PreferenceKey;
    id: string;
    label: string;
    description: string;
  }[] = [
    {
      key: 'leaderboardVisible',
      id: 'toggle-show-leaderboard',
      label: 'Show me on the team leaderboard',
      description: 'Choose whether your name and points appear in the team ranking.',
    },
    {
      key: 'shareStreak',
      id: 'toggle-share-streak',
      label: 'Share my streak with my team',
      description: 'Your daily streak stays private until you enable sharing.',
    },
    {
      key: 'notifyAchievement',
      id: 'toggle-notify-achievement',
      label: 'Notify teammates when I unlock an achievement',
      description: 'Save your preference for achievement announcements.',
    },
  ];

  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900 p-6'>
      <div className='mb-5'>
        <h2 className='text-xl font-bold text-zinc-100'>Sharing &amp; visibility</h2>
        <p className='mt-1 text-sm text-zinc-400'>
          You control what teammates can see about your activity
        </p>
      </div>
      <div className='space-y-3'>
        {items.map((item) => (
          <div key={item.id} className='flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4'>
            <div className='min-w-0'>
              <p className='font-semibold text-zinc-100'>{item.label}</p>
              <p className='mt-0.5 text-sm text-zinc-400'>{item.description}</p>
            </div>
            <Toggle
              id={item.id}
              checked={preferences[item.key]}
              disabled={savingPreference === item.key}
              onChange={() => onChange(item.key, !preferences[item.key])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
