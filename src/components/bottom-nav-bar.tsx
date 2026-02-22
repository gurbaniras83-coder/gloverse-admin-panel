'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  PlaySquare,
  CircleDollarSign,
  IndianRupee,
  Megaphone,
  Briefcase,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/users', label: 'GloStars', icon: Users },
  { href: '/dashboard/content', label: 'Videos', icon: PlaySquare },
  { href: '/dashboard/monetization', label: 'Monetization', icon: CircleDollarSign },
];

const moreNavItems = [
  { href: '/dashboard/payouts', label: 'Revenue', icon: IndianRupee },
  { href: '/dashboard/ads-manager', label: 'Ad Requests', icon: Megaphone },
  { href: '/dashboard/advertisers', label: 'Advertisers', icon: Briefcase },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/20 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
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
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                moreNavItems.some(item => pathname.startsWith(item.href)) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ChevronUp className="size-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-t-2 border-primary bg-black/80 p-0 text-foreground backdrop-blur-xl">
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/50" />
            <div className="grid grid-cols-3 gap-y-4 p-4 pb-6">
              {moreNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl",
                      isActive ? 'bg-primary/10' : 'bg-muted/50'
                    )}>
                      <item.icon className="size-7" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
