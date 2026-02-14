'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, Gavel, KeyRound } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  id: string;
  handle?: string;
  fullName?: string;
  profilePictureUrl?: string;
  followers?: number;
  isVerified?: boolean;
  isBanned?: boolean;
  email?: string;
};

export default function GloStarsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
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
    await updateDoc(userRef, { isVerified: !user.isVerified });
    toast({
      title: "Success",
      description: `${user.fullName} has been ${!user.isVerified ? 'verified' : 'unverified'}.`,
    });
  };

  const handleBan = async (user: User) => {
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { isBanned: !user.isBanned });
    toast({
      title: "Success",
      description: `${user.fullName} has been ${!user.isBanned ? 'banned' : 'unbanned'}.`,
    });
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
    setNewPassword('');
  };

  const handleResetPassword = () => {
    if (!newPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password cannot be empty.',
      });
      return;
    }
    // Admin password reset requires a backend with Admin SDK.
    // This is a placeholder for the UI.
    console.log(`Resetting password for ${selectedUser?.fullName} to ${newPassword}`);
    toast({
      title: 'Action Required',
      description: 'Password reset functionality requires a backend implementation with Firebase Admin SDK.',
    });
    setIsPasswordDialogOpen(false);
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
      <h1 className="text-3xl font-bold tracking-tight">GloStars Management</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
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
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Followers</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.fullName || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">@{user.handle || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.followers?.toLocaleString() ?? '0'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatus(user)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleVerify(user)} title="Verify User">
                            <Check className={`h-4 w-4 ${user.isVerified ? 'text-verified' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleBan(user)} title="Ban User">
                            <Gavel className={`h-4 w-4 ${user.isBanned ? 'text-destructive' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)} title="Reset Password">
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found for your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.fullName}</DialogTitle>
            <DialogDescription>
              Enter a new password for @{selectedUser?.handle}. This action should be used with caution. The user will not be notified of this change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword}>Set Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
