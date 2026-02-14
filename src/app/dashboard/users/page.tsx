'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, type Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, Gavel, KeyRound } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  id: string;
  handle?: string;
  fullName?: string;
  profilePictureUrl?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  email?: string;
  createdAt?: Timestamp;
  manualPassword?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleVerify = async (user: User) => {
    const userRef = doc(db, 'users', user.id);
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
    const userRef = doc(db, 'users', user.id);
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

    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, { manualPassword: newPassword });
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

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    try {
        // Firestore Timestamps can be converted to JS Date objects
        return timestamp.toDate().toLocaleDateString();
    } catch (e) {
        // if it's already a string or something else.
        return 'N/A';
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Join Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="min-w-[280px]">Update Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-28" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{user.fullName || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">@{user.handle || 'N/A'}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatus(user)}</TableCell>
                      <TableCell>
                        <div className="flex justify-start gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleVerify(user)} title="Verify User">
                            <Check className={`h-4 w-4 ${user.isVerified ? 'text-verified' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleBan(user)} title="Ban User">
                            <Gavel className={`h-4 w-4 ${user.isBanned ? 'text-destructive' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="password" 
                                placeholder="New Password"
                                value={passwords[user.id] || ''}
                                onChange={(e) => handlePasswordInputChange(user.id, e.target.value)}
                            />
                            <Button size="sm" onClick={() => handleForceReset(user.id, user.handle)}>
                                Update Password
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found.
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
