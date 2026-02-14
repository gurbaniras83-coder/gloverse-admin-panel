'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, PlaySquare, IndianRupee, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/users', label: 'GloStars', icon: Users },
  { href: '/dashboard/content', label: 'Videos', icon: PlaySquare },
  { href: '/dashboard/payouts', label: 'Revenue', icon: IndianRupee },
  { href: '/dashboard/ads-manager', label: 'Ads', icon: Megaphone },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/20 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="grid h-16 items-center" style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)`}}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors w-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="size-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
