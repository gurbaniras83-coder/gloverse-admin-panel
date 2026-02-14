import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function AdsManagerPage() {
  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
      </div>
      <Card className="border border-primary bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>Manage ad campaigns, track performance, and optimize strategies.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16 text-center">
            <Megaphone className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Ad campaign manager will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
