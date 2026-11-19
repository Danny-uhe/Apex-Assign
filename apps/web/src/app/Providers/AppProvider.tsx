import type { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import ToastProvider from './ToastProvider';
import { UserProfileProvider } from './UserProfileContext';
import { TaskProvider } from './TaskContext';
import { NotificationProvider } from './NotificationContext';
import { SocketProvider } from './SocketProvider';
import { ThemeProvider } from './ThemeContext';

interface Props { children: ReactNode; }

export default function AppProvider({ children }: Props) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UserProfileProvider>
          <NotificationProvider>
            <SocketProvider>
              <TaskProvider>
                {children}
                <ToastProvider />
              </TaskProvider>
            </SocketProvider>
          </NotificationProvider>
        </UserProfileProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
