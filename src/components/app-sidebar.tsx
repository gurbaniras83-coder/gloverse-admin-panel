'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Video, CircleDollarSign, Megaphone, LogOut } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { logout } from '@/app/actions';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/content', label: 'Content', icon: Video },
  { href: '/dashboard/payouts', label: 'Payouts', icon: CircleDollarSign },
  { href: '/dashboard/ads-manager', label: 'Ads Manager', icon: Megaphone },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-bold text-primary">GloVerse HQ</h1>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="gap-3 rounded-lg text-base"
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="size-5 text-primary" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <form action={logout}>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-base text-muted-foreground hover:bg-destructive/20 hover:text-primary">
            <LogOut className="size-5" />
            Logout
          </Button>
        </form>
      </SidebarFooter>
    </>
  );
}
