import { FileText, Clock, CheckCircle, Star, ArrowRight, Building2, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { OpportunityCard } from "@/components/OpportunityCard";
import { TaskCard } from "@/components/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  { title: "Applications", value: 12, icon: FileText, iconColor: "text-info" },
  { title: "Active Tasks", value: 3, icon: Clock, iconColor: "text-warning" },
  { title: "Completed", value: 8, icon: CheckCircle, iconColor: "text-success" },
  { title: "Feedback Score", value: "4.8", icon: Star, iconColor: "text-warning" },
];

const opportunities = [
  {
    title: "Frontend Development Micro-Internship",
    company: "TechVista Solutions",
    skills: ["React", "TypeScript", "Tailwind CSS"],
    duration: "2 weeks",
    level: "Intermediate" as const,
  },
  {
    title: "Data Analysis Task",
    company: "DataMetrics Inc",
    skills: ["Python", "Pandas", "Data Visualization"],
    duration: "1 week",
    level: "Beginner" as const,
  },
  {
    title: "Mobile App UI Design",
    company: "PixelCraft Design",
    skills: ["Figma", "UI/UX", "Mobile Design"],
    duration: "3 weeks",
    level: "Intermediate" as const,
  },
];

const tasks = [
  {
    title: "Build Responsive Dashboard Component",
    company: "CodeCraft Labs",
    progress: 65,
    dueDate: "25/01/2026",
    status: "In Progress" as const,
  },
  {
    title: "API Integration & Testing",
    company: "CloudSync Systems",
    progress: 30,
    dueDate: "28/01/2026",
    status: "In Progress" as const,
  },
  {
    title: "Database Schema Design",
    company: "DataFlow Solutions",
    progress: 80,
    dueDate: "22/01/2026",
    status: "Under Review" as const,
  },
];

const deadlines = [
  { title: "Submit Database Schema", date: "2026-01-22", urgent: true },
  { title: "Complete Dashboard Component", date: "2026-01-25", urgent: false },
  { title: "API Integration Testing", date: "2026-01-28", urgent: false },
];

const performance = [
  { label: "Completion Rate", value: 92 },
  { label: "Average Rating", value: 96, suffix: "4.8 ⭐" },
  { label: "On-Time Delivery", value: 88 },
];

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="student" />

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Ahmed! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your micro-internships today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended Opportunities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">Recommended Micro-Internships</CardTitle>
                  <p className="text-sm text-muted-foreground">Based on your skills and interests</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunities.map((opp, index) => (
                  <OpportunityCard key={index} {...opp} />
                ))}
              </CardContent>
            </Card>

            {/* Ongoing Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Ongoing Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">Track your active micro-internship tasks</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task, index) => (
                  <TaskCard key={index} {...task} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deadlines.map((deadline, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full ${
                      deadline.urgent ? "bg-destructive" : "bg-success"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">{deadline.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2 h-10">
                  <Building2 className="h-4 w-4" />
                  Browse Opportunities
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 h-10">
                  <FileText className="h-4 w-4" />
                  My Applications
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 h-10">
                  <Star className="h-4 w-4" />
                  Update Portfolio
                </Button>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  📈 Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performance.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">
                        {item.suffix || `${item.value}%`}
                      </span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
