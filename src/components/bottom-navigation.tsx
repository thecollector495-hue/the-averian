
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bird, ClipboardList, StickyNote, LayoutGrid, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Birds', icon: Bird },
  { href: '/breeding', label: 'Breeding', icon: ClipboardList },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/birds', label: 'Assistant', icon: Sparkles },
  { href: '/additional', label: 'More', icon: LayoutGrid },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <header className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border z-50">
      <nav className="flex justify-around w-full h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors duration-200 group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                  "w-6 h-6 mb-1 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
