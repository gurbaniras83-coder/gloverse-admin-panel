'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import AppSidebar from '@/components/app-sidebar';
import BottomNavBar from '@/components/bottom-nav-bar';
import MobileHeader from '@/components/mobile-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 pb-16 md:pb-0">
          <MobileHeader />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-6 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
