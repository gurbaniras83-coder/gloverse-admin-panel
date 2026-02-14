'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
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

  useEffect(() => {
    if (db.app.options.projectId === 'gloverse-d94dc' && !toastShownRef.current) {
        toast({
            title: "Success",
            description: "Successfully connected to the 'gloverse-d94dc' database.",
        });
        toastShownRef.current = true;
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

  const handleForceFollow = async () => {
    setLoading(true);
    toast({
      title: "ਕਾਰਵਾਈ ਚੱਲ ਰਹੀ ਹੈ...",
      description: "ਸਾਰੇ ਯੂਜ਼ਰਸ ਨੂੰ @gloverse ਦਾ ਸਬਸਕ੍ਰਾਈਬਰ ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ।",
    });

    try {
      // 1. Find @gloverse user
      const gloverseQuery = query(collection(db, "channels"), where("handle", "==", "gloverse"));
      const gloverseSnapshot = await getDocs(gloverseQuery);

      if (gloverseSnapshot.empty) {
        throw new Error("@gloverse ਯੂਜ਼ਰ 'channels' ਕਲੈਕਸ਼ਨ ਵਿੱਚ ਨਹੀਂ ਮਿਲਿਆ।");
      }
      const gloverseId = gloverseSnapshot.docs[0].id;
      
      // 2. Get all users
      const allUsersSnapshot = await getDocs(collection(db, "channels"));
      
      // 3. Update each user
      const updatePromises = allUsersSnapshot.docs.map(userDoc => {
        if (userDoc.id === gloverseId) {
          return Promise.resolve();
        }
        const userRef = doc(db, "channels", userDoc.id);
        return updateDoc(userRef, {
          subscriptions: arrayUnion(gloverseId)
        });
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "ਸਫ਼ਲਤਾਪੂਰਵਕ ਹੋ ਗਿਆ!",
        description: `ਸਾਰੇ ${allUsersSnapshot.size - 1} ਯੂਜ਼ਰਸ ਹੁਣ @gloverse ਨੂੰ ਫਾਲੋ ਕਰਦੇ ਹਨ।`,
      });

    } catch (error: any) {
      console.error("Force follow ਵਿੱਚ ਗਲਤੀ:", error);
      toast({
        variant: "destructive",
        title: "ਇੱਕ ਗਲਤੀ ਆਈ ਹੈ।",
        description: error.message || "ਇਹ ਕਾਰਵਾਈ ਪੂਰੀ ਨਹੀਂ ਹੋ ਸਕੀ।",
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
              <h3 className="font-semibold">Force Follow Official</h3>
              <p className="text-sm text-muted-foreground">ਸਾਰੇ ਯੂਜ਼ਰਸ ਨੂੰ @gloverse ਚੈਨਲ ਦਾ ਸਬਸਕ੍ਰਾਈਬਰ ਬਣਾਓ।</p>
            </div>
            <Button onClick={handleForceFollow} disabled={loading} variant="destructive">
              {loading ? 'ਪ੍ਰੋਸੈਸਿੰਗ...' : 'Force Follow'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
