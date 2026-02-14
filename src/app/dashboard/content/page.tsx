import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Video Moderation</CardTitle>
          <CardDescription>View, flag, and manage user-generated videos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16 text-center">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Video moderation tools will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
