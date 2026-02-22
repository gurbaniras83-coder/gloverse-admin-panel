'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfMonth, isAfter, parseISO } from 'date-fns';
import { IndianRupee, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Types
type AdCampaign = {
  id: string;
  viewCount: number;
  createdAt: Timestamp;
};

type DailyRevenue = {
  date: string;
  revenue: number;
};

const PLATFORM_SHARE_PER_VIEW = 0.04; // 40% of ₹0.10

// Stat Card Component
function StatCard({ title, value, icon: Icon, loading }: { title: string; value: string; icon: React.ElementType; loading: boolean }) {
  return (
    <Card className="border-primary/50 bg-card shadow-lg shadow-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
export default function RevenueDashboardPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const campaignsQuery = query(collection(db, 'ad_campaigns'), where('status', '==', 'Active'));
    
    const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      const activeCampaigns = snapshot.docs
        .map(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate && typeof data.viewCount === 'number') {
                 return {
                    id: doc.id,
                    viewCount: data.viewCount,
                    createdAt: data.createdAt,
                 } as AdCampaign;
            }
            return null;
        })
        .filter((c): c is AdCampaign => c !== null);

      setCampaigns(activeCampaigns);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching ad campaigns:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });
  };

  const { today, last7Days, thisMonth, total, dailyRevenueData } = useMemo(() => {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const toIstDateString = (date: Date): string => {
        const istDate = new Date(date.getTime() + IST_OFFSET);
        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const nowInIst = new Date(now.getTime() + IST_OFFSET);
    
    const istTodayStart = new Date(Date.UTC(nowInIst.getUTCFullYear(), nowInIst.getUTCMonth(), nowInIst.getUTCDate()));
    const ist7DaysAgoStart = new Date(istTodayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const istMonthStart = new Date(Date.UTC(nowInIst.getUTCFullYear(), nowInIst.getUTCMonth(), 1));

    const istTodayStartTime = istTodayStart.getTime();
    const ist7DaysAgoStartTime = ist7DaysAgoStart.getTime();
    const istMonthStartTime = istMonthStart.getTime();

    let today = 0;
    let last7Days = 0;
    let thisMonth = 0;
    let total = 0;
    const dailyRevenueMap = new Map<string, number>();

    for (let i = 27; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = toIstDateString(date);
        dailyRevenueMap.set(dateStr, 0);
    }
    
    campaigns.forEach(campaign => {
      const revenue = (campaign.viewCount || 0) * PLATFORM_SHARE_PER_VIEW;
      total += revenue;
      
      const campaignTime = campaign.createdAt.toDate().getTime();
      const campaignTimeInIst = campaignTime + IST_OFFSET;
      
      if (campaignTimeInIst >= istTodayStartTime) {
          today += revenue;
      }
      if (campaignTimeInIst >= ist7DaysAgoStartTime) {
          last7Days += revenue;
      }
      if (campaignTimeInIst >= istMonthStartTime) {
          thisMonth += revenue;
      }

      const campaignDateStr = toIstDateString(campaign.createdAt.toDate());
      if (dailyRevenueMap.has(campaignDateStr)) {
          dailyRevenueMap.set(campaignDateStr, dailyRevenueMap.get(campaignDateStr)! + revenue);
      }
    });

    const dailyRevenueData: DailyRevenue[] = Array.from(dailyRevenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return { today, last7Days, thisMonth, total, dailyRevenueData };
  }, [campaigns]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Revenue</h1>
            <p className="text-muted-foreground">Platform earnings from ad views (40% share).</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 border-primary/50 text-primary">
            <Zap className="h-3 w-3 animate-pulse" />
            Live Sync
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Earnings (IST)" value={formatCurrency(today)} icon={TrendingUp} loading={loading} />
        <StatCard title="Last 7 Days (IST)" value={formatCurrency(last7Days)} icon={Calendar} loading={loading} />
        <StatCard title="This Month (IST)" value={formatCurrency(thisMonth)} icon={Calendar} loading={loading} />
        <StatCard title="Total Platform Revenue" value={formatCurrency(total)} icon={IndianRupee} loading={loading} />
      </div>

      <Card className="border-primary/50 bg-card shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle>Daily Revenue (Last 28 Days, IST)</CardTitle>
          <CardDescription>Revenue generated each day from active ad campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full p-2">
            {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${Number(value).toLocaleString()}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                            }}
                            labelFormatter={(label) => format(parseISO(label), 'PPP')}
                            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Revenue"
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
