import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

export default function PayoutsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
      <Card className="border-primary/20 bg-card shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
          <CardDescription>Manage creator payouts, track earnings, and process payments.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-16 text-center">
            <CircleDollarSign className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Payout management interface will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
