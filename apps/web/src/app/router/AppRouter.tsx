import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import ProtectedRoute from './ProtectedRoute';
import AdminRoute     from './AdminRoute';

// Auth pages (public)
const LoginPage          = lazy(() => import('@/features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const AcceptInvitePage   = lazy(() => import('@/features/auth/pages/AcceptInvitePage'));

// App pages (require login)
const DashboardPage    = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const TasksPage        = lazy(() => import('@/features/tasks/pages/TasksPage'));
const MyTasksPage      = lazy(() => import('@/features/my-tasks/pages/MyTasksPage'));
const LeaderboardPage  = lazy(() => import('@/features/leaderboard/pages/LeaderBoardPage'));
const ActivityPage     = lazy(() => import('@/features/activity/pages/ActivityPage'));
const ArchivedPage     = lazy(() => import('@/features/archived/pages/ArchivedPage'));
const SettingsPage     = lazy(() => import('@/features/settings/pages/SettingsPage'));
const MembersPage      = lazy(() => import('@/features/members/pages/MembersPage'));
const UserProfilePage  = lazy(() => import('@/features/profile/pages/UserProfilePage'));

// Admin-only pages
const OrganisationPage = lazy(() => import('@/features/organisation/pages/OrganisationPage'));

const NotFoundPage = lazy(() => import('@/features/shared/NotFoundPage'));

function PageLoader() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
      <Loader2 size={28} className='animate-spin text-orange-600' />
    </div>
  );
}

const router = createBrowserRouter([
  // ── Public routes ───────────────────────────────────────────────────────────
  { path: '/',                      element: <LoginPage /> },
  { path: '/login',                 element: <LoginPage /> },
  { path: '/forgot-password',       element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/invite/:token',         element: <AcceptInvitePage /> },

  // ── Authenticated routes ────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',   element: <DashboardPage /> },
      { path: '/tasks',       element: <TasksPage /> },
      { path: '/my-tasks',    element: <MyTasksPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/activity',    element: <ActivityPage /> },
      { path: '/archived',    element: <ArchivedPage /> },
      { path: '/settings',    element: <SettingsPage /> },
      { path: '/members',     element: <MembersPage /> },
      { path: '/profile/:id', element: <UserProfilePage /> },

      // ── Admin-only routes ─────────────────────────────────────────────────
      {
        element: <AdminRoute />,
        children: [
          { path: '/organisation', element: <OrganisationPage /> },
        ],
      },
    ],
  },

  // ── 404 ─────────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
]);

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
