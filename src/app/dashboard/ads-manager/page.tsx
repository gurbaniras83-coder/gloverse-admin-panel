'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type AdCampaign = {
  id: string;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  placement?: 'For You Feed' | 'Header Banner' | 'User Profile';
  status?: 'Pending' | 'Active' | 'Rejected';
};

function CampaignCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );
}


export default function AdRequestsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const campaignsQuery = query(
      collection(db, 'ad_campaigns'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      const campaignsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as AdCampaign));
      setCampaigns(campaignsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching ad campaigns:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch pending ad requests.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleUpdateStatus = async (id: string, status: 'Active' | 'Rejected') => {
    const campaignRef = doc(db, 'ad_campaigns', id);
    try {
      await updateDoc(campaignRef, { status });
      toast({
        title: "Success",
        description: `Campaign has been ${status === 'Active' ? 'approved' : 'rejected'}.`,
      });
    } catch (error) {
      console.error(`Error updating campaign status to ${status}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update campaign status.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Ad Requests</h1>
        <p className="text-muted-foreground">Review and approve or reject pending ad campaigns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CampaignCardSkeleton key={i} />)
        ) : campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="border-primary/20 bg-card shadow-lg shadow-primary/5 flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{campaign.title || 'Untitled Campaign'}</CardTitle>
                {campaign.placement && (
                    <CardDescription>
                        Placement: <Badge variant="secondary">{campaign.placement}</Badge>
                    </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                    {campaign.videoUrl ? (
                        <video
                            key={campaign.id}
                            src={campaign.videoUrl}
                            poster={campaign.thumbnailUrl}
                            controls
                            className="w-full h-full object-cover"
                        />
                    ) : campaign.thumbnailUrl ? (
                        <Image
                            src={campaign.thumbnailUrl}
                            alt={`Thumbnail for ${campaign.title || 'Ad'}`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No Video Preview
                        </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleUpdateStatus(campaign.id, 'Rejected')}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => handleUpdateStatus(campaign.id, 'Active')}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-24">
            <p className="text-muted-foreground">No pending ad requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}
