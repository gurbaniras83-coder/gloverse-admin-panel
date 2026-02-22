'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, PlaySquare, IndianRupee, Megaphone, Briefcase, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/users', label: 'GloStars', icon: Users },
  { href: '/dashboard/content', label: 'Videos', icon: PlaySquare },
  { href: '/dashboard/monetization', label: 'Monetization', icon: CircleDollarSign },
  { href: '/dashboard/payouts', label: 'Revenue', icon: IndianRupee },
  { href: '/dashboard/ads-manager', label: 'Ads', icon: Megaphone },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/20 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
