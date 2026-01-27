import { Building2, Users, Eye, CheckCircle, Plus, FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const stats = [
  { title: "Active Postings", value: 5, icon: Building2, iconColor: "text-info" },
  { title: "Total Applicants", value: 48, icon: Users, iconColor: "text-secondary" },
  { title: "Profile Views", value: 156, icon: Eye, iconColor: "text-accent" },
  { title: "Completed Tasks", value: 23, icon: CheckCircle, iconColor: "text-success" },
];

const chartData = [
  { name: "Dec", applications: 12 },
  { name: "Jan", applications: 19 },
];

const activePostings = [
  {
    title: "Frontend Development",
    applicants: 12,
    views: 45,
    status: "Active",
  },
  {
    title: "Backend API Development",
    applicants: 15,
    views: 52,
    status: "Active",
  },
  {
    title: "UI/UX Design Task",
    applicants: 8,
    views: 38,
    status: "Active",
  },
];

export default function RecruiterDashboard() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="recruiter" />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Recruiter Dashboard</h1>
            <p className="text-muted-foreground">Manage your micro-internship postings</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Post Opportunity
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Applications Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Applications Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
                    <Bar 
                      dataKey="applications" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Active Postings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Active Postings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePostings.map((posting, index) => (
                <Card key={index} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{posting.title}</h3>
                      <Badge variant="success" className="bg-success/10 text-success">
                        {posting.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {posting.applicants} applicants • {posting.views} views
                    </p>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      View Applicants
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
