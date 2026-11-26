import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, CheckCircle2, ClipboardList,
  Zap, Flame, Trophy, MessageCircle, Loader2, Pencil, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '@/layout/AppLayout';
import MessageModal from '../components/MessageModal';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/user.service';
import { useUserProfile } from '@/app/Providers/UserProfileContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  systemRole: 'admin' | 'member';
  isActive: boolean;
  isOnline: boolean;
  avatar?: string | null;
  position?: string | null;
  bio?: string | null;
  points: number;
  streak: number;
  taskCount: number;
  tasksCompleted?: number;
  projectCount: number;
  createdAt: string;
  _count?: {
    assignedTasks: number;
    projects: number;
  };
}

const AVATAR_COLORS = [
  'bg-orange-600','bg-purple-500','bg-emerald-500',
  'bg-amber-500','bg-rose-500','bg-teal-500',
];
function avatarColor(id: string) {
  const s = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function UserProfilePage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const updateUser  = useAuthStore((s) => s.updateUser);
  const { setName: setCtxName, setRole: setCtxRole } = useUserProfile();

  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [msgOpen,  setMsgOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Try to fetch all org members and find the one with matching id
    api.get<{ success: boolean; members: UserProfile[] }>('/organisation/members')
      .then((res) => {
        const found = res.data.members.find((m) => m.id === id) ?? null;
        setProfile(found);
        if (found && searchParams.get('message') === '1') setMsgOpen(true);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  if (loading) {
    return (
      <AppLayout>
        <div className='flex items-center justify-center py-32'>
          <Loader2 size={28} className='animate-spin text-orange-600' />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className='flex flex-col items-center justify-center py-32 text-zinc-400'>
          <p className='text-lg font-semibold'>User not found</p>
          <button onClick={() => navigate(-1)} className='mt-4 text-sm text-orange-600 hover:underline'>
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  const isOnline = profile.isOnline;
  const isSelf   = currentUser?.id === profile.id;
  const color    = avatarColor(profile.id);
  const initials = getInitials(profile.name);
  const tasksCompleted = profile.tasksCompleted ?? 0;
  const tasksAssigned  = profile.taskCount ?? 0;
  const points         = profile.points    ?? 0;
  const streak         = profile.streak    ?? 0;

  const openEditProfile = () => {
    setEditName(profile.name);
    setEditPosition(profile.position ?? '');
    setEditBio(profile.bio ?? '');
    setEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile({
        name: editName.trim(),
        position: editPosition.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      const updated = res.data.user;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              position: updated.position ?? null,
              bio: updated.bio ?? null,
            }
          : prev
      );
      updateUser({
        name: updated.name,
        position: updated.position,
        bio: updated.bio,
      });
      setCtxName(updated.name);
      if (updated.position) setCtxRole(updated.position);
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Failed to update profile'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const stats = [
    { icon: CheckCircle2,  label: 'Tasks Done',  value: tasksCompleted, color: 'text-green-400',  bg: 'bg-green-500/10'  },
    { icon: ClipboardList, label: 'Assigned',     value: tasksAssigned,  color: 'text-orange-500 dark:text-orange-400',   bg: 'bg-orange-500/10'   },
    { icon: Zap,           label: 'Points',       value: points,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Flame,         label: 'Day Streak',   value: streak,         color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const joinedAt = new Date(profile.createdAt).toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  });

  return (
    <AppLayout>
      <div className='mx-auto max-w-3xl space-y-5'>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className='flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
        >
          <ArrowLeft size={16} />
          Back to Members
        </button>

        {/* Profile hero */}
        <section className='relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-orange-50/70 to-white p-6 text-zinc-900 shadow-lg dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900 dark:text-white sm:p-8'>
          <div className='pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-orange-500/10 dark:bg-white/5' />
          <div className='pointer-events-none absolute bottom-0 left-24 h-24 w-24 rounded-full bg-orange-500/10 dark:bg-white/5' />

          <div className='relative flex flex-col gap-5 sm:flex-row sm:items-start'>
            {/* Avatar */}
            <div className='relative flex-shrink-0'>
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className='h-20 w-20 rounded-2xl object-cover' />
              ) : (
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg ${color}`}>
                  {initials}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-800 ${isOnline ? 'bg-green-400' : 'bg-zinc-500'}`} />
            </div>

            {/* Info */}
            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-3'>
                <h1 className='text-xl font-bold sm:text-2xl'>{profile.name}</h1>
                {profile.systemRole === 'admin' && (
                  <span className='rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-yellow-300'>
                    Admin
                  </span>
                )}
                <span className={`flex items-center gap-1.5 text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`}>
                  <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 dark:bg-green-400' : 'bg-zinc-500'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {profile.position && (
                <p className='mt-1 text-sm text-zinc-400'>{profile.position}</p>
              )}
              <div className='mt-1 flex items-center gap-2 text-sm text-zinc-400'>
                <Mail size={13} />
                {profile.email}
              </div>
              {profile.bio && (
                <p className='mt-3 text-sm leading-relaxed text-zinc-300'>{profile.bio}</p>
              )}
            </div>

            {/* Action button */}
            {!isSelf ? (
              <button
                onClick={() => setMsgOpen(true)}
                className='flex w-fit items-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
              >
                <MessageCircle size={15} />
                Message
              </button>
            ) : (
              <button
                onClick={openEditProfile}
                className='flex w-fit items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            )}
          </div>

          <div className='relative mt-5 flex items-center gap-2 text-sm text-zinc-400'>
            <Trophy size={14} className='text-yellow-500 dark:text-yellow-400' />
            <span>{profile.points.toLocaleString()} points</span>
            <span className='mx-2'>·</span>
            <span>Member since {joinedAt}</span>
          </div>
        </section>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          {stats.map(({ icon: Icon, label, value, color: c, bg }) => (
            <div key={label} className='flex flex-col items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-sm'>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={18} className={c} />
              </div>
              <p className={`text-xl font-bold ${c}`}>{value.toLocaleString()}</p>
              <p className='text-xs text-zinc-400'>{label}</p>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className='rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm'>
          <h2 className='mb-3 font-bold text-zinc-100'>About</h2>
          <div className='space-y-2 text-sm text-zinc-400'>
            <p><span className='font-medium text-zinc-200'>Role:</span> {profile.systemRole === 'admin' ? 'Admin' : 'Member'}</p>
            <p><span className='font-medium text-zinc-200'>Status:</span> {profile.isActive ? 'Active' : 'Inactive'}</p>
            <p><span className='font-medium text-zinc-200'>Joined:</span> {joinedAt}</p>
            {profile.position && <p><span className='font-medium text-zinc-200'>Position:</span> {profile.position}</p>}
          </div>
        </div>

      </div>

      {!isSelf && id && (
        <MessageModal
          open={msgOpen}
          onClose={() => setMsgOpen(false)}
          name={profile.name}
          initials={initials}
          color={color}
          status={isOnline ? 'online' : 'offline'}
          targetUserId={id}
        />
      )}

      {isSelf && editOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
          <div className='w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-zinc-700 px-6 py-4'>
              <h2 className='text-lg font-bold text-white'>Edit Profile</h2>
              <button
                type='button'
                onClick={() => setEditOpen(false)}
                className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800'
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className='space-y-4 p-6'>
              <div>
                <label className='mb-1.5 block text-sm font-semibold text-zinc-300'>Full Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className='w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20'
                />
              </div>
              <div>
                <label className='mb-1.5 block text-sm font-semibold text-zinc-300'>Position / Role</label>
                <input
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder='e.g. Product Designer'
                  className='w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20'
                />
              </div>
              <div>
                <label className='mb-1.5 block text-sm font-semibold text-zinc-300'>Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder='Tell your team about yourself…'
                  className='w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20'
                />
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setEditOpen(false)}
                  className='rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={savingProfile || !editName.trim()}
                  className='rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40'
                >
                  {savingProfile ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
