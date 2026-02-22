'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CircleDollarSign, Send, IndianRupee } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// --- TYPE DEFINITIONS ---
type Creator = {
  id: string;
  handle?: string;
  fullName?: string;
  profilePictureUrl?: string;
  isMonetized?: boolean;
  monetizationStatus?: 'pending' | 'approved' | 'rejected';
  walletBalance?: number;
  upiId?: string;
};


// --- MONETIZATION REQUESTS COMPONENT ---
function MonetizationRequests() {
  const [requests, setRequests] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'channels'), where('monetizationStatus', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching monetization requests:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch monetization requests." });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleRequest = async (creatorId: string, newStatus: 'approved' | 'rejected') => {
    const creatorRef = doc(db, 'channels', creatorId);
    try {
      await updateDoc(creatorRef, {
        monetizationStatus: newStatus,
        isMonetized: newStatus === 'approved',
      });
      toast({
        title: "Success",
        description: `Creator has been ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating creator status:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update creator status." });
    }
  };
  
  const getInitials = (name?: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';


  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
           <Card key={i}><CardHeader className="flex-row items-center gap-4 space-y-0"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></CardHeader></Card>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CircleDollarSign className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">No Pending Requests</h3>
        <p className="mt-1 text-sm">Looks like all monetization applications are processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(creator => (
        <Card key={creator.id}>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.profilePictureUrl} alt={creator.fullName} />
                    <AvatarFallback>{getInitials(creator.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{creator.fullName}</CardTitle>
                  <CardDescription>@{creator.handle} &bull; UPI: {creator.upiId || 'Not Provided'}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="destructive" size="sm" onClick={() => handleRequest(creator.id, 'rejected')}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRequest(creator.id, 'approved')}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// --- CREATOR PAYOUTS COMPONENT ---
function CreatorPayouts() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'channels'), where('isMonetized', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const creatorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
            setCreators(creatorsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching creators:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch creators." });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);
    
    const handlePayNow = (creator: Creator) => {
        if (!creator.upiId || !creator.fullName || !creator.walletBalance) {
            toast({ variant: 'destructive', title: 'Missing Details', description: 'UPI ID, name, or balance is missing for this creator.' });
            return;
        }
        const upiLink = `upi://pay?pa=${creator.upiId}&pn=${encodeURIComponent(creator.fullName)}&am=${creator.walletBalance.toFixed(2)}&cu=INR`;
        window.open(upiLink, '_blank');
        toast({ title: "Redirecting to UPI App", description: `Preparing payment for ${creator.fullName}.` });
    };

    const handleMarkAsPaid = async (creatorId: string) => {
        const creatorRef = doc(db, 'channels', creatorId);
        try {
            await updateDoc(creatorRef, {
                walletBalance: 0
            });
            toast({ title: "Payment Recorded", description: "Creator's balance has been reset to zero." });
        } catch (error) {
            console.error("Error resetting balance:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not reset creator's balance." });
        }
    };
    
    const getInitials = (name?: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Creator Payouts</CardTitle>
                <CardDescription>Monitor and process payouts for monetized creators.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Creator</TableHead>
                                <TableHead>UPI ID</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-10 w-24 rounded-md" /></TableCell>
                                    </TableRow>
                                ))
                            ) : creators.length > 0 ? (
                                creators.map((creator) => (
                                    <TableRow key={creator.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={creator.profilePictureUrl} alt={creator.fullName} />
                                                    <AvatarFallback>{getInitials(creator.fullName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{creator.fullName}</div>
                                                    <div className="text-sm text-primary">@{creator.handle}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{creator.upiId || 'N/A'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {(creator.walletBalance ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </TableCell>
                                        <TableCell className="flex justify-center items-center gap-2">
                                            {(creator.walletBalance ?? 0) >= 10000 && (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 animate-pulse" onClick={() => handlePayNow(creator)}>
                                                    <Send className="mr-2 h-4 w-4" /> PAY NOW
                                                </Button>
                                            )}
                                            {(creator.walletBalance ?? 0) > 0 && (
                                                <Button variant="secondary" size="sm" onClick={() => handleMarkAsPaid(creator.id)}>
                                                    Mark as Paid
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No monetized creators found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function MonetizationPage() {
  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Monetization</h1>
        <p className="text-muted-foreground">Manage creator monetization requests and process payouts.</p>
      </div>
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Monetization Requests</TabsTrigger>
          <TabsTrigger value="payouts">Creator Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Review and approve or reject creators who have applied for monetization.</CardDescription>
            </CardHeader>
            <CardContent>
                <MonetizationRequests />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts">
            <CreatorPayouts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
