import { DashboardStats } from '@/components/dashboard-stats';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
