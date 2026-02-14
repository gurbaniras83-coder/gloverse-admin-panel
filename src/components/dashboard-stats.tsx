'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getCountFromServer, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type StatCardProps = {
  title: string;
  count: number | null;
  icon: React.ElementType;
};

function StatCard({ title, count, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {count !== null ? (
          <div className="text-2xl font-bold">{count.toLocaleString()}</div>
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const usersCol = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCol);
        setUserCount(usersSnapshot.size);

        const videosCol = collection(db, 'videos');
        const videosSnapshot = await getCountFromServer(videosCol);
        setVideoCount(videosSnapshot.data().count);
      } catch (error) {
        console.error("Error fetching initial counts:", error);
        // Set to 0 or some error state if you prefer
        setUserCount(0);
        setVideoCount(0);
      }
    };
    
    fetchCounts();

    const usersUnsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUserCount(snapshot.size);
    }, (error) => {
        console.error("Error with users listener:", error);
    });

    const videosUnsubscribe = onSnapshot(query(collection(db, 'videos')), (snapshot) => {
      setVideoCount(snapshot.size);
    }, (error) => {
        console.error("Error with videos listener:", error);
    });

    return () => {
      usersUnsubscribe();
      videosUnsubscribe();
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard title="Total Users" count={userCount} icon={Users} />
      <StatCard title="Total Videos" count={videoCount} icon={Video} />
    </div>
  );
}
