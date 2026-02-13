import { useNavigate } from "react-router-dom";
import { Users, Building2, TrendingUp, AlertTriangle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats, usePlatformGrowth, useRecentActivity } from "@/hooks/useAdminData";
import { useApplicationTrends, useSkillTrends, useCompletionRates } from "@/hooks/useAdminAnalytics";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: chartData, isLoading: chartLoading } = usePlatformGrowth();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();
  const { data: appTrends, isLoading: trendsLoading } = useApplicationTrends();
  const { data: skillTrends, isLoading: skillsLoading } = useSkillTrends();
  const { data: completionRates, isLoading: completionLoading } = useCompletionRates();

  const statsData = [
    { title: "Total Students", value: statsLoading ? "..." : stats?.totalStudents.toLocaleString() || "0", icon: Users, iconColor: "text-info" },
    { title: "Active Recruiters", value: statsLoading ? "..." : stats?.totalRecruiters.toLocaleString() || "0", icon: Building2, iconColor: "text-primary" },
    { title: "Total Opportunities", value: statsLoading ? "..." : stats?.totalOpportunities.toLocaleString() || "0", icon: TrendingUp, iconColor: "text-success" },
    { title: "Pending Reviews", value: statsLoading ? "..." : stats?.pendingReviews.toLocaleString() || "0", icon: AlertTriangle, iconColor: "text-warning" },
  ];

  const COLORS = ["hsl(var(--success))", "hsl(var(--info))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="admin" />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || "Admin"} — Platform Overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat) => (<StatCard key={stat.title} {...stat} />))}
        </div>

        <div className="flex gap-3 mb-8">
          <Button variant="outline" onClick={() => navigate("/admin/users")} className="gap-2"><Users className="h-4 w-4" />Manage Users</Button>
          <Button variant="outline" onClick={() => navigate("/admin/activities")} className="gap-2">View Activities</Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Growth */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold">Platform Growth</CardTitle></CardHeader>
            <CardContent>
              {chartLoading ? <Skeleton className="h-64 w-full" /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Trends */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" />Application Trends</CardTitle></CardHeader>
            <CardContent>
              {trendsLoading ? <Skeleton className="h-64 w-full" /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="accepted" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Accepted" />
                      <Bar dataKey="completed" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Completion Rates Pie Chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Application Status</CardTitle></CardHeader>
            <CardContent>
              {completionLoading ? <Skeleton className="h-64 w-full" /> : completionRates && completionRates.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={completionRates} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {completionRates.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold">Top Skills in Demand</CardTitle></CardHeader>
            <CardContent>
              {skillsLoading ? <Skeleton className="h-64 w-full" /> : skillTrends && skillTrends.length > 0 ? (
                <div className="space-y-3">
                  {skillTrends.map((s, i) => (
                    <div key={s.skill} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-foreground">{s.skill}</span>
                          <span className="text-muted-foreground">{s.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.count / (skillTrends[0]?.count || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/activities")}>See all</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLoading ? (
                <>{[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}</>
              ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">No recent activity</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
