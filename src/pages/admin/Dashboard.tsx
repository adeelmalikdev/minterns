import { Users, Building2, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  { title: "Total Students", value: "2,547", icon: Users, iconColor: "text-info", trend: { value: "+12%", positive: true } },
  { title: "Active Recruiters", value: "156", icon: Building2, iconColor: "text-primary", trend: { value: "+8%", positive: true } },
  { title: "Total Opportunities", value: "423", icon: TrendingUp, iconColor: "text-success", trend: { value: "+15%", positive: true } },
  { title: "Pending Reviews", value: "23", icon: AlertTriangle, iconColor: "text-warning", trend: { value: "-5%", positive: false } },
];

const chartData = [
  { name: "Aug", users: 100 },
  { name: "Sep", users: 650 },
  { name: "Oct", users: 1300 },
  { name: "Nov", users: 1950 },
  { name: "Dec", users: 2400 },
  { name: "Jan", users: 2547 },
];

const recentActivity = [
  { event: "New student registered", time: "5 min ago" },
  { event: "Opportunity published", time: "1 hour ago" },
  { event: "Recruiter approved", time: "3 hours ago" },
];

const pendingRecruiters = [
  { company: "TechVista Solutions", email: "hr@techvista.com", date: "2026-01-18" },
  { company: "DataMetrics Inc", email: "recruit@datametrics.com", date: "2026-01-17" },
];

const pendingOpportunities = [
  { title: "Full Stack Developer Intern", company: "CloudSync", date: "2026-01-18" },
  { title: "ML Engineer Task", company: "AI Labs", date: "2026-01-17" },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  
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
          {stats.map((stat) => (
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
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
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
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recruiters">
              <TabsList>
                <TabsTrigger value="recruiters">
                  Pending Recruiters ({pendingRecruiters.length})
                </TabsTrigger>
                <TabsTrigger value="opportunities">
                  Pending Opportunities ({pendingOpportunities.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="recruiters" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRecruiters.map((recruiter, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{recruiter.company}</TableCell>
                        <TableCell className="text-muted-foreground">{recruiter.email}</TableCell>
                        <TableCell className="text-muted-foreground">{recruiter.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm" className="gap-1">
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="opportunities" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOpportunities.map((opp, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{opp.title}</TableCell>
                        <TableCell className="text-muted-foreground">{opp.company}</TableCell>
                        <TableCell className="text-muted-foreground">{opp.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm" className="gap-1">
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
