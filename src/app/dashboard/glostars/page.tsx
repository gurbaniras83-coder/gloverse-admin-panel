import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function GloStarsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">GloStars</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View, edit, and manage user profiles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">User management interface will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
