'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, PlusCircle, IndianRupee } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Advertiser = {
  id: string;
  businessName?: string;
  email?: string;
  profilePictureUrl?: string;
  walletBalance?: number;
};

function AdvertiserCardSkeleton() {
    return (
        <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    )
}

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bonusAmounts, setBonusAmounts] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  useEffect(() => {
    const advertisersCol = collection(db, 'advertisers_data');
    const unsubscribe = onSnapshot(advertisersCol, (snapshot) => {
      const advertisersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Advertiser));
      setAdvertisers(advertisersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching advertisers:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch advertisers.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleBonusAmountChange = (advertiserId: string, value: string) => {
    setBonusAmounts(prev => ({...prev, [advertiserId]: value}));
  }

  const handleAddBonus = async (advertiser: Advertiser) => {
    const bonusAmountStr = bonusAmounts[advertiser.id];
    const bonusAmount = parseFloat(bonusAmountStr);

    if (!bonusAmountStr || isNaN(bonusAmount) || bonusAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the bonus.',
      });
      return;
    }

    const advertiserRef = doc(db, 'advertisers_data', advertiser.id);
    try {
      await updateDoc(advertiserRef, { 
        walletBalance: increment(bonusAmount)
      });
      toast({
        title: 'Bonus Added!',
        description: `${bonusAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} has been added to ${advertiser.businessName}'s wallet.`,
      });
      // Clear input after adding bonus
      setBonusAmounts(prev => ({...prev, [advertiser.id]: ''}));
    } catch (error) {
      console.error("Error adding bonus:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add bonus to wallet.',
      });
    }
  };

  const filteredAdvertisers = useMemo(() => {
    if (!searchQuery) {
      return advertisers;
    }
    return advertisers.filter(advertiser =>
      advertiser.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advertiser.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [advertisers, searchQuery]);

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  }

  return (
    <div className="space-y-8">
       <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Advertiser Management</h1>
      </div>
      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>All Advertisers</CardTitle>
          <CardDescription>Manage advertiser profiles and wallet balances. Found {filteredAdvertisers.length} advertisers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by Business Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 pb-20">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <AdvertiserCardSkeleton key={i} />)
            ) : filteredAdvertisers.length > 0 ? (
              filteredAdvertisers.map((advertiser) => (
                <Collapsible key={advertiser.id} asChild>
                  <div className="rounded-lg border bg-card/50 p-3 text-sm transition-all hover:bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={advertiser.profilePictureUrl} alt={advertiser.businessName} />
                                <AvatarFallback>{getInitials(advertiser.businessName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-foreground">{advertiser.businessName || 'N/A'}</div>
                                <div className="text-muted-foreground">{advertiser.email || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {advertiser.walletBalance?.toLocaleString('en-IN') ?? '0'}
                            </Badge>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" title="Add Bonus">
                                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                    <CollapsibleContent className="mt-4">
                        <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                placeholder="Bonus Amount (INR)"
                                value={bonusAmounts[advertiser.id] || ''}
                                onChange={(e) => handleBonusAmountChange(advertiser.id, e.target.value)}
                                className="h-9"
                            />
                            <Button size="sm" onClick={() => handleAddBonus(advertiser)}>
                                Add Bonus
                            </Button>
                        </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            ) : (
              <div className="py-24 text-center text-muted-foreground">
                  No advertisers found.
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
