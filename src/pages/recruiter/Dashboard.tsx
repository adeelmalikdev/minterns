import { useNavigate } from "react-router-dom";
import { Building2, Users, CheckCircle, Plus, FileText, TrendingUp, ClipboardCheck, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useRecruiterStats, useRecruiterOpportunities, useRecruiterApplicationTrends } from "@/hooks/useRecruiterData";
import { usePendingSubmissionsCount } from "@/hooks/useRecruiterSubmissions";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useRecruiterStats();
  const { data: opportunities, isLoading: oppsLoading } = useRecruiterOpportunities();
  const { data: chartData, isLoading: chartLoading } = useRecruiterApplicationTrends();
  const { data: pendingCount } = usePendingSubmissionsCount();

  const statsData = [
    { 
      title: "Active Postings", 
      value: statsLoading ? "..." : (stats?.activePostings || 0), 
      icon: Building2, 
      iconColor: "text-info" 
    },
    { 
      title: "Total Applicants", 
      value: statsLoading ? "..." : (stats?.totalApplicants || 0), 
      icon: Users, 
      iconColor: "text-secondary" 
    },
    { 
      title: "Total Opportunities", 
      value: statsLoading ? "..." : (stats?.totalOpportunities || 0), 
      icon: TrendingUp, 
      iconColor: "text-accent" 
    },
    { 
      title: "Pending Reviews", 
      value: pendingCount ?? 0, 
      icon: ClipboardCheck, 
      iconColor: "text-warning" 
    },
    { 
      title: "Completed Tasks", 
      value: statsLoading ? "..." : (stats?.completedTasks || 0), 
      icon: CheckCircle, 
      iconColor: "text-success" 
    },
  ];

  const activePostings = opportunities?.filter(o => o.status === "published") || [];
  
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="recruiter" />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome, {profile?.full_name || "Recruiter"}
            </h1>
            <p className="text-muted-foreground">Manage micro-internships for IIUI SE/IT/CS students</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/recruiter/post")}>
            <Plus className="h-4 w-4" />
            Post Opportunity
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat) => (
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
              {chartLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : chartData && chartData.length > 0 ? (
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
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No application data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Postings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Active Postings</CardTitle>
              {(pendingCount ?? 0) > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => navigate("/recruiter/submissions")}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {pendingCount} Pending Reviews
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {oppsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </>
              ) : activePostings.length > 0 ? (
                activePostings.slice(0, 3).map((posting) => (
                  <Card key={posting.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{posting.title}</h3>
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {posting.company_name}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => navigate(`/recruiter/opportunities/${posting.id}/applicants`)}
                      >
                        <FileText className="h-4 w-4" />
                        View Applicants
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active postings yet</p>
                  <Button onClick={() => navigate("/recruiter/post")}>
                    Create Your First Opportunity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
