
'use client';

import { usePathname } from 'next/navigation';
import { BottomNavigation } from './bottom-navigation';

const adminPaths = ['/login', '/dashboard'];

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isUserFacingApp = !adminPaths.some(path => pathname.startsWith(path));

  if (isUserFacingApp) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <main className="flex-1 pb-16">{children}</main>
        <BottomNavigation />
      </div>
    );
  }

  // For admin pages, we don't render the bottom navigation.
  // The layout is controlled by (admin)/layout.tsx
  return <>{children}</>;
}
