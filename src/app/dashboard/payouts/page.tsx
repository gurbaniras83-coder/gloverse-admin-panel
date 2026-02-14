
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CircleDollarSign, Wallet } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type PayoutRequest = {
  id: string;
  handle?: string;
  fullName?: string;
  profilePictureUrl?: string;
  walletBalance?: number;
  payoutRequestAmount?: number;
  upiId?: string;
  bankDetails?: any;
};

function StatCard({ title, value, icon: Icon, loading }: { title: string, value: number | null, icon: React.ElementType, loading: boolean }) {
    return (
        <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold">
                        {value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function PayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const requestsQuery = query(collection(db, 'users'), where('payoutRequested', '==', true));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as PayoutRequest));
      setRequests(requestsData);
      setLoadingRequests(false);
    }, (error) => {
      console.error("Error fetching payout requests:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch payout requests." });
      setLoadingRequests(false);
    });

    const analyticsQuery = query(collection(db, 'analytics'));
    const unsubscribeAnalytics = onSnapshot(analyticsQuery, (snapshot) => {
        let total = 0;
        snapshot.forEach((doc) => {
            total += doc.data().totalRevenue || 0;
        });
        setTotalRevenue(total);
        setLoadingRevenue(false);
    }, (error) => {
        console.error("Error fetching analytics:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch revenue data." });
        setLoadingRevenue(false);
    });

    return () => {
        unsubscribeRequests();
        unsubscribeAnalytics();
    };
  }, [toast]);

  const handleApprove = async (request: PayoutRequest) => {
    const userRef = doc(db, 'users', request.id);
    const amountToPay = request.payoutRequestAmount || 0;

    if ((request.walletBalance || 0) < amountToPay) {
        toast({ variant: "destructive", title: "Error", description: "Insufficient wallet balance to approve this payout." });
        return;
    }

    try {
      await updateDoc(userRef, {
        walletBalance: increment(-amountToPay),
        payoutStatus: 'Paid',
        payoutRequested: false,
      });
      toast({ title: "Success", description: `Payout of ${amountToPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} approved for @${request.handle}.` });
    } catch (error) {
      console.error("Error approving payout:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not approve payout." });
    }
  };

  const handleReject = async (request: PayoutRequest) => {
    const userRef = doc(db, 'users', request.id);
    try {
      await updateDoc(userRef, {
        payoutStatus: 'Rejected',
        payoutRequested: false,
      });
      toast({ title: "Success", description: `Payout request for @${request.handle} has been rejected.` });
    } catch (error) {
      console.error("Error rejecting payout:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not reject payout." });
    }
  };
  
  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Monetization & Payout Desk</h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Platform Revenue" value={totalRevenue} icon={CircleDollarSign} loading={loadingRevenue} />
      </div>

      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Pending Payout Requests</CardTitle>
          <CardDescription>Review and process payout requests from GloStars. {requests.length} pending.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Payment Details</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Wallet Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRequests ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex flex-col gap-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell text-right"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                    </TableRow>
                  ))
                ) : requests.length > 0 ? (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={request.profilePictureUrl} alt={request.fullName} />
                                <AvatarFallback>{getInitials(request.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{request.fullName || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">@{request.handle || 'N/A'}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {request.payoutRequestAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? '$0.00'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {request.upiId ? (
                            <Badge variant="secondary">{request.upiId}</Badge>
                        ) : (
                            <span className="text-muted-foreground text-xs">Bank Details</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                        {request.walletBalance?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? '$0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(request)} title="Approve Payout">
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(request)} title="Reject Payout">
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No pending payout requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

    
