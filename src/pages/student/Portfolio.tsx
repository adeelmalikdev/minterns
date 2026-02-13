import { Navbar } from "@/components/Navbar";
import { useStudentPortfolio } from "@/hooks/useStudentPortfolio";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Briefcase, 
  Clock, 
  Download, 
  Star, 
  CheckCircle2,
  Trophy,
  Sparkles,
  GraduationCap,
  MapPin,
  Github,
  Linkedin,
  Globe,
  BookOpen,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
}

function ProfileHero({ profile, portfolio }: { profile: any; portfolio: any }) {
  const completedCount = portfolio?.internships?.length || 0;

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="bg-gradient-to-r from-primary/80 to-primary h-32 md:h-40" />
      <CardContent className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-md">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {profile?.full_name?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-2 md:pb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{profile?.full_name || "Student"}</h1>
            <p className="text-muted-foreground">{profile?.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {profile?.university && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {profile.university}
                </span>
              )}
              {profile?.department && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {profile.department}
                </span>
              )}
              {profile?.semester && (
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Semester {profile.semester}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {profile?.github_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            )}
            {profile?.linkedin_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            )}
            {profile?.portfolio_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        {profile?.bio && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}
        {completedCount > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Trophy className="h-5 w-5 text-warning" />
            <span className="font-medium text-sm">
              {completedCount} Internship{completedCount !== 1 ? "s" : ""} Completed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsGrid({ portfolio }: { portfolio: any }) {
  const stats = [
    { icon: Briefcase, label: "Completed Internships", value: portfolio?.internships?.length || 0, color: "text-primary" },
    { icon: Clock, label: "Total Hours", value: portfolio?.totalHours || 0, color: "text-primary" },
    { icon: Star, label: "Average Rating", value: portfolio?.averageRating?.toFixed(1) || "N/A", color: "text-warning" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="group hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EducationSection({ profile }: { profile: any }) {
  if (!profile?.university && !profile?.department && !profile?.semester && !profile?.registration_number) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
          Education
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            {profile.university && (
              <p className="font-semibold text-base">{profile.university}</p>
            )}
            {profile.department && (
              <p className="text-sm text-muted-foreground">{profile.department}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {profile.semester && (
                <Badge variant="secondary">Semester {profile.semester}</Badge>
              )}
              {profile.registration_number && (
                <Badge variant="outline">Reg # {profile.registration_number}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsSection({ profile, portfolio }: { profile: any; portfolio: any }) {
  const profileSkills = profile?.skills || [];
  const earnedSkills = portfolio?.allSkills || [];
  const allSkills = [...new Set([...profileSkills, ...earnedSkills])];

  if (allSkills.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Skills
        </CardTitle>
        <CardDescription>
          Profile skills and skills demonstrated in internships
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill) => {
            const isEarned = earnedSkills.includes(skill);
            return (
              <Badge
                key={skill}
                variant={isEarned ? "default" : "secondary"}
                className="py-1.5 px-3 text-sm"
              >
                {isEarned && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {skill}
              </Badge>
            );
          })}
        </div>
        {earnedSkills.length > 0 && profileSkills.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> = Demonstrated in an internship
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const handleDownloadCertificate = () => {
    const certificateContent = `
      <html><head><title>Certificate of Completion</title>
      <style>body{font-family:Georgia,serif;text-align:center;padding:60px}.border{border:3px double #333;padding:40px;margin:20px}h1{color:hsl(var(--primary));font-size:32px}h2{color:#2d3748;font-size:24px;margin:30px 0}p{color:#4a5568;font-size:16px;line-height:1.8}.verification{margin-top:40px;font-size:12px;color:#718096}</style>
      </head><body><div class="border"><h1>🎓 Certificate of Completion</h1><p>This is to certify successful completion of</p><h2>${internship.opportunityTitle}</h2><p>at <strong>${internship.companyName}</strong></p><p>Duration: ${internship.durationHours} hours</p><p>Completed on: ${format(new Date(internship.completedAt), "MMMM d, yyyy")}</p><div class="verification">Verification Code: ${internship.verificationCode || "N/A"}</div></div></body></html>`;
    const blob = new Blob([certificateContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${internship.companyName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{internship.opportunityTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Briefcase className="h-4 w-4" />
              {internship.companyName}
            </CardDescription>
          </div>
          {internship.rating && (
            <div className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold text-warning">{internship.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {internship.durationHours} hours
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Completed {format(new Date(internship.completedAt), "MMM yyyy")}
          </div>
        </div>
        {internship.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {internship.skills.map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
          </div>
        )}
        {internship.feedback && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium mb-1">Recruiter Feedback</p>
            <p className="text-sm text-muted-foreground italic">"{internship.feedback}"</p>
          </div>
        )}
        {internship.certificateId && (
          <Button variant="outline" className="w-full gap-2" onClick={handleDownloadCertificate}>
            <Download className="h-4 w-4" />
            Download Certificate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentPortfolio() {
  const { profile, role } = useAuth();
  const { data: portfolio, isLoading, error } = useStudentPortfolio();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userRole={role} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {isLoading ? (
          <PortfolioSkeleton />
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">Failed to load portfolio. Please try again.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <ProfileHero profile={profile} portfolio={portfolio} />
            <StatsGrid portfolio={portfolio} />

            <div className="grid gap-6 md:grid-cols-2">
              <EducationSection profile={profile} />
              <SkillsSection profile={profile} portfolio={portfolio} />
            </div>

            {/* Internships */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Completed Internships
              </h2>
              {portfolio?.internships && portfolio.internships.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {portfolio.internships.map((internship) => (
                    <InternshipCard key={internship.id} internship={internship} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">No Completed Internships Yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Complete your first micro-internship to build your portfolio!
                      </p>
                    </div>
                    <Button asChild>
                      <Link to="/student/opportunities">Browse Opportunities</Link>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
