
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from './bottom-navigation';
import { useAuth } from '@/context/AuthContext';
import { TrialExpiredDialog } from './trial-expired-dialog';

const adminPaths = ['/login', '/dashboard'];
const SESSION_STORAGE_KEY = 'trial-expired-dialog-shown';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isReadOnly } = useAuth();
  const [isTrialDialogVisible, setTrialDialogVisible] = useState(false);

  useEffect(() => {
    // Check if the user's trial is expired and if the dialog has already been shown in this session
    const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (isReadOnly && !hasBeenShown) {
      setTrialDialogVisible(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }
  }, [isReadOnly, user]);


  const isUserFacingApp = !adminPaths.some(path => pathname.startsWith(path));

  if (isUserFacingApp) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <TrialExpiredDialog isOpen={isTrialDialogVisible} onOpenChange={setTrialDialogVisible} />
        <main className="flex-1 pb-16">{children}</main>
        <BottomNavigation />
      </div>
    );
  }

  // For admin pages, we don't render the bottom navigation.
  // The layout is controlled by (admin)/layout.tsx
  return <>{children}</>;
}
