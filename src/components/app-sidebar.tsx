'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, PlaySquare, IndianRupee, Megaphone, LogOut, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/actions';
import { Button } from './ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/users', label: 'GloStars', icon: Users },
  { href: '/dashboard/content', label: 'Videos', icon: PlaySquare },
  { href: '/dashboard/payouts', label: 'Revenue', icon: IndianRupee },
  { href: '/dashboard/ads-manager', label: 'Ad Requests', icon: Megaphone },
  { href: '/dashboard/advertisers', label: 'Advertisers', icon: Briefcase },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-primary/20 bg-background text-foreground h-screen sticky top-0">
        <div className="p-4 border-b border-primary/20">
            <h1 className="text-2xl font-bold text-primary">GloVerse HQ</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors',
                isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <item.icon className="size-5" />
                <span>{item.label}</span>
            </Link>
            );
        })}
        </nav>
        <div className="p-4 mt-auto border-t border-primary/20">
            <form action={logout}>
            <Button variant="ghost" className="w-full justify-start gap-3 text-base text-muted-foreground hover:bg-destructive/20 hover:text-primary">
                <LogOut className="size-5" />
                Logout
            </Button>
            </form>
        </div>
    </aside>
  );
}
