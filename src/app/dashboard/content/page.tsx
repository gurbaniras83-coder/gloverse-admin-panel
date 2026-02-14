'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, Star, Video as VideoIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Video = {
  id: string;
  title?: string;
  uploaderHandle?: string;
  viewCount?: number;
  thumbnailUrl?: string;
  public_id?: string;
  isFeatured?: boolean;
};

function VideoCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}

export default function ContentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const videosCol = collection(db, 'videos');
    const unsubscribe = onSnapshot(videosCol, (snapshot) => {
      const videosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Video));
      setVideos(videosData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching videos:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch videos.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDelete = async (video: Video) => {
    try {
      await deleteDoc(doc(db, 'videos', video.id));
      toast({
        title: 'Content Removed from GloVerse',
      });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete video.",
      });
    }
  };

  const handleFeature = async (video: Video) => {
    const videoRef = doc(db, 'videos', video.id);
    try {
      await updateDoc(videoRef, { isFeatured: !video.isFeatured });
      toast({
        title: "Success",
        description: `"${video.title}" has been ${!video.isFeatured ? 'featured' : 'unfeatured'}.`,
      });
    } catch (error) {
      console.error("Error updating video:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update video status.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Content Hub</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Video Moderation</CardTitle>
          <CardDescription>Review, feature, and manage all user-generated videos. {videos.length > 0 && `Found ${videos.length} videos.`}</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
                </div>
            ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <Card key={video.id} className="flex flex-col overflow-hidden">
                             <div className="relative aspect-video bg-muted">
                                {video.thumbnailUrl ? (
                                    <Image src={video.thumbnailUrl} alt={video.title || 'Video thumbnail'} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">No Thumbnail</div>
                                )}
                                {video.isFeatured && (
                                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                                        <Star className="h-3 w-3 mr-1" /> Featured
                                    </Badge>
                                )}
                            </div>
                            <CardHeader className="flex-grow p-4">
                                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">{video.title || 'Untitled Video'}</CardTitle>
                                <p className="text-sm text-muted-foreground">@{video.uploaderHandle || 'unknown_uploader'}</p>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Eye className="h-4 w-4 mr-2" />
                                    <span>{video.viewCount?.toLocaleString() ?? 0} views</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                                <Button variant={video.isFeatured ? "default" : "secondary"} size="sm" onClick={() => handleFeature(video)}>
                                    <Star className="h-4 w-4 mr-2" />
                                    {video.isFeatured ? 'Unfeature' : 'Feature'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the video "{video.title || 'Untitled Video'}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(video)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-4 p-16 text-center">
                    <VideoIcon className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">No videos found in the collection.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
