'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

type StatCardProps = {
  title: string;
  count: number | null;
  icon: React.ElementType;
};

function StatCard({ title, count, icon: Icon }: StatCardProps) {
  return (
    <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const boostAppliedRef = useRef(false);

  useEffect(() => {
    if (db.app.options.projectId === 'gloverse-d94dc' && !toastShownRef.current) {
        toast({
            title: "Success",
            description: "Successfully connected to the 'gloverse-d94dc' database.",
        });
        toastShownRef.current = true;
    }

    // Founder's one-time boost script
    if (!boostAppliedRef.current) {
      const boostFounderChannel = async () => {
        const q = query(collection(db, "channels"), where("handle", "==", "gloverse"));
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const founderDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'channels', founderDoc.id), {
              watchHours: 1000
            });
            console.log("Founder Channel @gloverse boosted to 1000 hours");
          } else {
            console.log("Founder channel @gloverse not found for boosting.");
          }
        } catch (error) {
          console.error("Error boosting founder channel:", error);
        }
      };
      boostFounderChannel();
      boostAppliedRef.current = true;
    }

    const fetchUsers = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'channels'));
            setUserCount(snapshot.size);
            console.log('Found channels:', snapshot.docs.map(doc => doc.data()));
        } catch (error) {
            console.error("Error fetching channels:", error);
            setUserCount(0);
        }
    };

    fetchUsers();

    const videosUnsubscribe = onSnapshot(query(collection(db, 'videos')), (snapshot) => {
      setVideoCount(snapshot.size);
    }, (error) => {
        console.error("Error with videos listener:", error);
        setVideoCount(0);
    });

    return () => {
      videosUnsubscribe();
    };
  }, [toast]);

  const handleSyncSubscribers = async () => {
    setLoading(true);
    toast({
      title: "Syncing Subscribers...",
      description: "Calculating and updating subscriber count for @gloverse.",
    });

    try {
      // 1. Find @gloverse user's UID
      const gloverseQuery = query(collection(db, "channels"), where("handle", "==", "gloverse"));
      const gloverseSnapshot = await getDocs(gloverseQuery);

      if (gloverseSnapshot.empty) {
        throw new Error("@gloverse user not found in 'channels' collection.");
      }
      const gloverseId = gloverseSnapshot.docs[0].id; // This is the UID

      // 2. Count documents in the 'subscriptions' collection where channelId matches
      const subscriptionsQuery = query(collection(db, "subscriptions"), where("channelId", "==", gloverseId));
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      const subscriberCount = subscriptionsSnapshot.size;

      // 3. Update the 'subscribers' field in the @gloverse channel document
      const gloverseRef = doc(db, "channels", gloverseId);
      await updateDoc(gloverseRef, {
        subscribers: subscriberCount
      });
      
      // 4. Success message
      toast({
        title: "Sync Complete!",
        description: `Subscriber count for @gloverse has been synced to ${subscriberCount}.`,
      });

    } catch (error: any) {
      console.error("Error syncing subscriber count:", error);
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: error.message || "Could not complete the sync operation.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Users" count={userCount} icon={Users} />
        <StatCard title="Total Videos" count={videoCount} icon={Video} />
      </div>
      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Founder Tools</CardTitle>
          <CardDescription>ਗੁਪਤ ਐਕਸ਼ਨ, ਸਿਰਫ਼ ਫਾਊਂਡਰ ਲਈ।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sync Subscriber Count</h3>
              <p className="text-sm text-muted-foreground">Recalculate and update the subscriber count for the @gloverse channel.</p>
            </div>
            <Button onClick={handleSyncSubscribers} disabled={loading} variant="destructive">
              {loading ? 'Syncing...' : 'Sync Count'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
