import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GraduationCap, Building2, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type UserRole = "student" | "recruiter" | "admin";

const roleConfig = {
  student: {
    icon: GraduationCap,
    emailLabel: "IIUI Email",
    emailPlaceholder: "student@iiu.edu.pk",
    buttonText: "Sign In as Student",
    signupButtonText: "Sign Up as Student",
    signupText: "Don't have an account?",
    signupLink: "Sign up",
    dashboardPath: "/student/dashboard",
  },
  recruiter: {
    icon: Building2,
    emailLabel: "Company Email",
    emailPlaceholder: "hr@company.com",
    buttonText: "Sign In as Recruiter",
    signupButtonText: "Register as Recruiter",
    signupText: "New recruiter?",
    signupLink: "Register your company",
    dashboardPath: "/recruiter/dashboard",
  },
  admin: {
    icon: Shield,
    emailLabel: "Admin Email",
    emailPlaceholder: "admin@iiu.edu.pk",
    buttonText: "Sign In as Admin",
    signupButtonText: "Sign Up as Admin",
    signupText: "",
    signupLink: "",
    dashboardPath: "/admin/dashboard",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "student";
  const { signIn, signUp, role: userRole } = useAuth();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = roleConfig[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
          });
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message,
          });
        } else {
          // Wait a moment for auth state to update then navigate
          setTimeout(() => {
            navigate(config.dashboardPath);
          }, 100);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="container py-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Sign up for μ-intern" : "Sign in to your μ-intern account"}
            </CardDescription>
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
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-muted"
                  />
                </div>
              )}

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
                  minLength={6}
                  className="bg-muted"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (isSignUp ? "Creating account..." : "Signing in...") 
                  : (isSignUp ? config.signupButtonText : config.buttonText)}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? (
                <p>
                  Already have an account?{" "}
                  <button 
                    onClick={() => setIsSignUp(false)}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              ) : config.signupText ? (
                <p>
                  {config.signupText}{" "}
                  <button 
                    onClick={() => setIsSignUp(true)}
                    className="text-primary font-medium hover:underline"
                  >
                    {config.signupLink}
                  </button>
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
