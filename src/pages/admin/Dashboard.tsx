import { Users, Building2, TrendingUp, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats, usePlatformGrowth, useRecentActivity } from "@/hooks/useAdminData";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: chartData, isLoading: chartLoading } = usePlatformGrowth();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  const statsData = [
    { 
      title: "Total Students", 
      value: statsLoading ? "..." : stats?.totalStudents.toLocaleString() || "0", 
      icon: Users, 
      iconColor: "text-info",
      trend: { value: "+12%", positive: true }
    },
    { 
      title: "Active Recruiters", 
      value: statsLoading ? "..." : stats?.totalRecruiters.toLocaleString() || "0", 
      icon: Building2, 
      iconColor: "text-primary",
      trend: { value: "+8%", positive: true }
    },
    { 
      title: "Total Opportunities", 
      value: statsLoading ? "..." : stats?.totalOpportunities.toLocaleString() || "0", 
      icon: TrendingUp, 
      iconColor: "text-success",
      trend: { value: "+15%", positive: true }
    },
    { 
      title: "Pending Reviews", 
      value: statsLoading ? "..." : stats?.pendingReviews.toLocaleString() || "0", 
      icon: AlertTriangle, 
      iconColor: "text-warning",
      trend: { value: "-5%", positive: false }
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="admin" />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name || "Admin"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Platform Growth</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </>
              ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
