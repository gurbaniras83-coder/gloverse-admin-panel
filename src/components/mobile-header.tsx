'use client';

import { Button } from '@/components/ui/button';
import { logout } from '@/app/actions';
import { LogOut } from 'lucide-react';

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/20 bg-background/80 p-4 backdrop-blur-sm md:hidden">
      <h1 className="text-xl font-bold text-primary">GloVerse Control</h1>
      <form action={logout}>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <LogOut className="size-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </form>
    </header>
  );
}
