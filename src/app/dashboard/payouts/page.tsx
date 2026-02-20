'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, increment, getDocs, documentId, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type PaymentRequest = {
  id: string; // Document ID from payment_requests
  advertiserId: string;
  advertiserHandle?: string;
  amount: number;
  transactionId: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  businessName?: string;
  profilePictureUrl?: string;
};

export default function PayoutsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const paymentsQuery = query(collection(db, 'payment_requests'), where('status', '==', 'Pending'));
    
    const unsubscribe = onSnapshot(paymentsQuery, async (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
      setPaymentRequests(paymentsData);
      setLoadingPayments(false);
    }, (error) => {
        console.error("Error fetching payment requests:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch payment requests." });
        setLoadingPayments(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleApprovePayment = async (payment: PaymentRequest) => {
    if (!payment.advertiserId) {
      toast({
        variant: "destructive",
        title: "Invalid Request",
        description: "Cannot approve: Missing Advertiser ID. Please delete this request.",
      });
      return;
    }

    const advertiserRef = doc(db, 'advertisers_accounts', payment.advertiserId);
    const paymentRequestRef = doc(db, 'payment_requests', payment.id);
    
    try {
      await updateDoc(advertiserRef, {
        walletBalance: increment(payment.amount)
      });
      await updateDoc(paymentRequestRef, {
        status: 'Approved'
      });
      toast({ title: "Payment Approved! Wallet Updated.", description: `${payment.businessName || payment.advertiserId} has been credited.` });
    } catch (error) {
       console.error("Error approving payment:", error);
       toast({ 
         variant: "destructive", 
         title: "Error Approving Payment", 
         description: "Could not approve payment. The advertiser might not exist or another error occurred." 
        });
    }
  };

  const handleDeleteRequest = async (payment: PaymentRequest) => {
    const paymentRequestRef = doc(db, 'payment_requests', payment.id);
    try {
      await deleteDoc(paymentRequestRef);
      toast({ title: "Request Deleted", description: `The payment request has been removed.` });
    } catch (error) {
        console.error("Error deleting payment request:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the payment request." });
    }
  };
  
  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">Verify advertiser payments to credit their wallets.</p>
      </div>

      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>
            {loadingPayments ? 'Loading pending requests...' : `Found ${paymentRequests.length} pending requests to verify.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {loadingPayments ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex flex-col gap-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><div className="flex justify-center gap-2"><Skeleton className="h-10 w-28 rounded-md" /><Skeleton className="h-10 w-28 rounded-md" /></div></TableCell>
                    </TableRow>
                  ))
                ) : paymentRequests.length > 0 ? (
                  paymentRequests.map((req) => (
                    <TableRow key={req.id}>
                       <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={req.profilePictureUrl} alt={req.businessName} />
                                <AvatarFallback>{getInitials(req.businessName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{req.businessName || 'Unknown Business'}</div>
                                <div className="text-sm text-primary">@{req.advertiserHandle || req.advertiserId}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{req.transactionId}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(req.amount ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </TableCell>
                       <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button onClick={() => handleApprovePayment(req)} size="default" className="bg-green-600 hover:bg-green-700 text-white font-bold">
                              <Check className="mr-2 h-5 w-5" /> ACCEPT
                          </Button>
                          <Button onClick={() => handleDeleteRequest(req)} size="default" variant="destructive" className="font-bold">
                              <X className="mr-2 h-5 w-5" /> DELETE
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No pending payment requests to verify.
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
}
