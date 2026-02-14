'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

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

export default function DashboardPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (db.app.options.projectId === 'gloverse-d94dc' && !toastShownRef.current) {
        toast({
            title: "Success",
            description: "Successfully connected to the 'gloverse-d94dc' database.",
        });
        toastShownRef.current = true;
    }

    const usersUnsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUserCount(snapshot.size);
    }, (error) => {
        console.error("Error with users listener:", error);
        setUserCount(0);
    });

    const videosUnsubscribe = onSnapshot(query(collection(db, 'videos')), (snapshot) => {
      setVideoCount(snapshot.size);
    }, (error) => {
        console.error("Error with videos listener:", error);
        setVideoCount(0);
    });

    return () => {
      usersUnsubscribe();
      videosUnsubscribe();
    };
  }, [toast]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total Users" count={userCount} icon={Users} />
        <StatCard title="Total Videos" count={videoCount} icon={Video} />
      </div>
    </div>
  );
}
