'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, type Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, Gavel, KeyRound } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from '@/components/ui/label';

type User = {
  id: string;
  handle?: string;
  fullName?: string;
  profilePictureUrl?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  email?: string;
  createdAt?: Timestamp;
  password?: string;
  watchHours?: number;
};

function UserCardSkeleton() {
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
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState<{[key: string]: string}>({});
  const [watchHours, setWatchHours] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    const usersCol = collection(db, 'channels');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching channels:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch channels.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleVerify = async (user: User) => {
    const userRef = doc(db, 'channels', user.id);
    try {
        await updateDoc(userRef, { isVerified: !user.isVerified });
        toast({
        title: "Success",
        description: `${user.fullName} has been ${!user.isVerified ? 'verified' : 'unverified'}.`,
        });
    } catch (error) {
        console.error("Error updating user verification:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not update verification for ${user.fullName}.`
        });
    }
  };

  const handleBan = async (user: User) => {
    const userRef = doc(db, 'channels', user.id);
    try {
        await updateDoc(userRef, { isBanned: !user.isBanned });
        toast({
        title: "Success",
        description: `${user.fullName} has been ${!user.isBanned ? 'banned' : 'unbanned'}.`,
        });
    } catch (error) {
        console.error("Error updating user ban status:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Could not update ban status for ${user.fullName}.`
        });
    }
  };

  const handlePasswordInputChange = (userId: string, value: string) => {
    setPasswords(prev => ({...prev, [userId]: value}));
  }

  const handleWatchHoursInputChange = (userId: string, value: string) => {
    setWatchHours(prev => ({ ...prev, [userId]: value }));
  };

  const handleForceReset = async (userId: string, handle?: string) => {
    const newPassword = passwords[userId];
    if (!newPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password cannot be empty.',
      });
      return;
    }

    const userRef = doc(db, 'channels', userId);
    try {
      await updateDoc(userRef, { password: newPassword });
      toast({
        title: 'Success',
        description: `Password for @${handle} has been manually updated.`,
      });
      // Clear password input after reset
      setPasswords(prev => ({...prev, [userId]: ''}));
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not reset password.',
      });
    }
  };

  const handleSetWatchHours = async (userId: string, handle?: string) => {
    const hours = watchHours[userId];
    if (hours === undefined || hours.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a value for watch hours.',
      });
      return;
    }
    
    const hoursNumber = Number(hours);
    if (isNaN(hoursNumber) || hoursNumber < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a valid non-negative number for watch hours.',
      });
      return;
    }

    const userRef = doc(db, 'channels', userId);
    try {
      await updateDoc(userRef, { watchHours: hoursNumber });
      toast({
        title: 'Success',
        description: `Watch hours for @${handle} have been updated to ${hoursNumber}.`,
      });
      setWatchHours(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error("Error setting watch hours:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update watch hours.',
      });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    return users.filter(user =>
      user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const getStatus = (user: User) => {
    if (user.isBanned) return <Badge variant="destructive">Banned</Badge>;
    if (user.isVerified) return <Badge className="bg-verified text-verified-foreground hover:bg-verified/90">Verified</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };
  
  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  return (
    <div className="space-y-8">
       <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      </div>
      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View, edit, and manage user profiles. Found {filteredUsers.length} users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 pb-20">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <UserCardSkeleton key={i} />)
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Collapsible key={user.id} asChild>
                  <div className="rounded-lg border bg-card/50 p-3 text-sm transition-all hover:bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-foreground">{user.fullName || 'N/A'}</div>
                                <div className="text-primary">@{user.handle || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {getStatus(user)}
                            <Button variant="ghost" size="icon" onClick={() => handleVerify(user)} title="Verify">
                                <Check className={`h-4 w-4 ${user.isVerified ? 'text-verified' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleBan(user)} title="Ban">
                                <Gavel className={`h-4 w-4 ${user.isBanned ? 'text-destructive' : 'text-muted-foreground'}`} />
                            </Button>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" title="Reset Password">
                                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Force Password Reset</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input 
                                type="password" 
                                placeholder="New Password"
                                value={passwords[user.id] || ''}
                                onChange={(e) => handlePasswordInputChange(user.id, e.target.value)}
                                className="h-9"
                            />
                            <Button size="sm" onClick={() => handleForceReset(user.id, user.handle)}>
                                Update
                            </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Set Watch Hours</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            placeholder="Watch Hours"
                            value={watchHours[user.id] || ''}
                            onChange={(e) => handleWatchHoursInputChange(user.id, e.target.value)}
                            className="h-9"
                          />
                          <Button variant="secondary" size="sm" onClick={() => handleSetWatchHours(user.id, user.handle)}>
                            Set Hours
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            ) : (
              <div className="py-24 text-center text-muted-foreground">
                  No users found.
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
