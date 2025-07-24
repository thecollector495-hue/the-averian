
'use client';

import { Loader2 } from 'lucide-react';

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
