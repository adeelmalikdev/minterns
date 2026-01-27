import { Navbar } from "@/components/Navbar";
import { useRecentActivity } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, FileText, Briefcase, CheckCircle, XCircle, Activity } from "lucide-react";

const activityIcons = {
  registration: UserPlus,
  application: FileText,
  opportunity: Briefcase,
  status_change: Activity,
};

const activityColors = {
  registration: "bg-info/10 text-info",
  application: "bg-warning/10 text-warning",
  opportunity: "bg-success/10 text-success",
  status_change: "bg-secondary/10 text-secondary",
};

export default function AdminActivities() {
  const { data: activities, isLoading } = useRecentActivity();

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="admin" />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Platform Activities</h1>
          <p className="text-muted-foreground">Monitor all platform activities in real-time</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Recent registrations, applications, and opportunity updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right w-[150px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const Icon = activityIcons[activity.type] || Activity;
                    const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";
                    
                    // Determine badge label
                    let typeLabel = activity.type.replace("_", " ");
                    if (activity.event.includes("accepted")) {
                      typeLabel = "accepted";
                    } else if (activity.event.includes("rejected")) {
                      typeLabel = "rejected";
                    } else if (activity.event.includes("completed")) {
                      typeLabel = "completed";
                    }

                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 capitalize ${colorClass}`}>
                            <Icon className="h-3 w-3" />
                            {typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{activity.event}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {activity.time}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activities recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
