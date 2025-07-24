
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/full-page-loader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bird, LogOut, Code2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Bird className="h-6 w-6" />
                <span>The Avarian - Admin</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
                 <Button asChild variant="outline" size="sm">
                    <Link href="/developer">
                        <Code2 className="mr-2 h-4 w-4" />
                        Developer
                    </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
        <main>{children}</main>
    </div>
  );
}
