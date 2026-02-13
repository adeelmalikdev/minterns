import { Navbar } from "@/components/Navbar";
import { useStudentPortfolio } from "@/hooks/useStudentPortfolio";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Github,
  Linkedin,
  Globe,
  MapPin,
  BookOpen,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function HeroSection({ profile, portfolio }: { profile: any; portfolio: any }) {
  const internshipCount = portfolio?.internships?.length || 0;
  const totalHours = portfolio?.totalHours || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-8 md:p-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
        <div className="relative shrink-0">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-white/30 ring-offset-4 ring-offset-primary">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-3xl font-bold bg-white/20 text-white">
              {profile?.full_name?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          {internshipCount > 0 && (
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-lg">
              <Trophy className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold md:text-4xl text-white">{profile?.full_name || "Student"}</h1>
          {profile?.email && (
            <p className="mt-1 text-white/80">{profile.email}</p>
          )}
          
          {(profile?.department || profile?.university) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {profile?.department && (
                <span className="flex items-center gap-1.5 text-sm text-white/90">
                  <BookOpen className="h-4 w-4" />
                  {profile.department}
                </span>
              )}
              {profile?.university && (
                <span className="flex items-center gap-1.5 text-sm text-white/90">
                  <GraduationCap className="h-4 w-4" />
                  {profile.university}
                </span>
              )}
              {profile?.semester && (
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
                  Semester {profile.semester}
                </Badge>
              )}
            </div>
          )}

          {profile?.bio && (
            <p className="mt-4 max-w-xl text-sm text-white/90 leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {profile?.github_url && (
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 gap-1.5" asChild>
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </Button>
            )}
            {profile?.linkedin_url && (
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 gap-1.5" asChild>
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </Button>
            )}
            {profile?.portfolio_url && (
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 gap-1.5" asChild>
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" /> Portfolio
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="hidden md:flex flex-col gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
            <p className="text-3xl font-bold text-white">{internshipCount}</p>
            <p className="text-xs text-white/80">Internships</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
            <p className="text-3xl font-bold text-white">{totalHours}</p>
            <p className="text-xs text-white/80">Hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ portfolio }: { portfolio: any }) {
  const stats = [
    { icon: Briefcase, label: "Internships", value: portfolio?.internships?.length || 0, color: "text-primary" },
    { icon: Clock, label: "Total Hours", value: portfolio?.totalHours || 0, color: "text-primary" },
    { icon: Star, label: "Avg Rating", value: portfolio?.averageRating?.toFixed(1) || "N/A", color: "text-warning" },
    { icon: Sparkles, label: "Skills Earned", value: portfolio?.allSkills?.length || 0, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkillsSection({ profileSkills, earnedSkills }: { profileSkills: string[]; earnedSkills: string[] }) {
  const allSkills = [...new Set([...profileSkills, ...earnedSkills])];
  
  if (allSkills.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Skills & Expertise
        </CardTitle>
        <CardDescription>
          Skills from your profile and completed internships
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill) => {
            const isEarned = earnedSkills.includes(skill);
            const isProfile = profileSkills.includes(skill);
            return (
              <Badge 
                key={skill} 
                variant={isEarned ? "default" : "skill"}
                className={`py-1.5 px-3 text-sm ${isEarned ? "gap-1.5" : ""}`}
              >
                {isEarned && <CheckCircle2 className="h-3 w-3" />}
                {skill}
              </Badge>
            );
          })}
        </div>
        {earnedSkills.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            Skills with a checkmark were demonstrated in completed internships
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EducationSection({ profile }: { profile: any }) {
  if (!profile?.university && !profile?.department) return null;

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            {profile?.university && (
              <h3 className="font-semibold text-base">{profile.university}</h3>
            )}
            {profile?.department && (
              <p className="text-sm text-muted-foreground">{profile.department}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              {profile?.semester && (
                <Badge variant="secondary" className="text-xs">
                  Semester {profile.semester}
                </Badge>
              )}
              {profile?.registration_number && (
                <span className="text-xs text-muted-foreground">
                  ID: {profile.registration_number}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const handleDownloadCertificate = () => {
    const certificateContent = `
      <html>
        <head><title>Certificate of Completion</title>
          <style>
            body { font-family: Georgia, serif; text-align: center; padding: 60px; }
            .border { border: 3px double #333; padding: 40px; margin: 20px; }
            h1 { color: #1a365d; font-size: 32px; }
            h2 { color: #2d3748; font-size: 24px; margin: 30px 0; }
            p { color: #4a5568; font-size: 16px; line-height: 1.8; }
            .verification { margin-top: 40px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="border">
            <h1>🎓 Certificate of Completion</h1>
            <p>This is to certify that</p>
            <h2>has successfully completed</h2>
            <h2>${internship.opportunityTitle}</h2>
            <p>at <strong>${internship.companyName}</strong></p>
            <p>Duration: ${internship.durationHours} hours</p>
            <p>Completed on: ${format(new Date(internship.completedAt), "MMMM d, yyyy")}</p>
            <div class="verification">Verification Code: ${internship.verificationCode || "N/A"}</div>
          </div>
        </body>
      </html>
    `;
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
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {internship.opportunityTitle}
            </CardTitle>
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
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {internship.durationHours} hours
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {format(new Date(internship.completedAt), "MMM yyyy")}
          </span>
        </div>

        {internship.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {internship.skills.map((skill: string) => (
              <Badge key={skill} variant="skill" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {internship.feedback && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium mb-1">Recruiter Feedback</p>
            <p className="text-xs text-muted-foreground italic">"{internship.feedback}"</p>
          </div>
        )}

        {internship.certificateId && (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleDownloadCertificate}>
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

  const profileSkills = profile?.skills || [];
  const earnedSkills = portfolio?.allSkills || [];

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
            <HeroSection profile={profile} portfolio={portfolio} />
            <StatsGrid portfolio={portfolio} />

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="internships">
                  Internships ({portfolio?.internships?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <EducationSection profile={profile} />
                  <SkillsSection profileSkills={profileSkills} earnedSkills={earnedSkills} />
                </div>

                {/* Recent Internships Preview */}
                {portfolio?.internships && portfolio.internships.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recent Internships
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {portfolio.internships.slice(0, 2).map((internship) => (
                        <InternshipCard key={internship.id} internship={internship} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="internships" className="mt-4">
                {portfolio?.internships && portfolio.internships.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {portfolio.internships.map((internship) => (
                      <InternshipCard key={internship.id} internship={internship} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-10 text-center">
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
                        <a href="/student/opportunities">Browse Opportunities</a>
                      </Button>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
