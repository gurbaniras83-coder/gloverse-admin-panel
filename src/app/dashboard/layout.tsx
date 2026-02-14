import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between border-b p-4 sm:justify-end">
            <SidebarTrigger className="sm:hidden" />
            <span className="text-sm text-muted-foreground">Welcome, Founder</span>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
