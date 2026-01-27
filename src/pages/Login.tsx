import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, Building2, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserRole = "student" | "recruiter" | "admin";

const roleConfig = {
  student: {
    icon: GraduationCap,
    emailLabel: "IIUI Email",
    emailPlaceholder: "student@iiu.edu.pk",
    buttonText: "Sign In as Student",
    signupText: "Don't have an account?",
    signupLink: "Sign up",
    dashboardPath: "/student/dashboard",
  },
  recruiter: {
    icon: Building2,
    emailLabel: "Company Email",
    emailPlaceholder: "hr@company.com",
    buttonText: "Sign In as Recruiter",
    signupText: "New recruiter?",
    signupLink: "Register your company",
    dashboardPath: "/recruiter/dashboard",
  },
  admin: {
    icon: Shield,
    emailLabel: "Admin Email",
    emailPlaceholder: "admin@iiu.edu.pk",
    buttonText: "Sign In as Admin",
    signupText: "",
    signupLink: "",
    dashboardPath: "/admin/dashboard",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "student";
  
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = roleConfig[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - in production, this would call an auth API
    setTimeout(() => {
      setIsLoading(false);
      navigate(config.dashboardPath);
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="container py-6">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your μ-intern account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="student" className="gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Student</span>
                </TabsTrigger>
                <TabsTrigger value="recruiter" className="gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Recruiter</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{config.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={config.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : config.buttonText}
              </Button>
            </form>

            {config.signupText && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                {config.signupText}{" "}
                <a href="#" className="text-primary font-medium hover:underline">
                  {config.signupLink}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
