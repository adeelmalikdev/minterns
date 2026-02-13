import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GraduationCap, Building2, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrength, isPasswordValid } from "@/components/ui/password-strength";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rateLimit";
import { signInWithGoogle } from "@/lib/googleAuth";
import { LiveRegion } from "@/components/accessibility/LiveRegion";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { supabase } from "@/integrations/supabase/client";
import { checkLeakedPassword } from "@/lib/passwordCheck";

// reCAPTCHA v2 Checkbox - site key is defined in useReCaptcha.ts
import { RECAPTCHA_SITE_KEY } from "@/hooks/useReCaptcha";

type UserRole = "student" | "recruiter";

const roleConfig = {
  student: {
    icon: GraduationCap,
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    buttonText: "Sign In as Student",
    signupButtonText: "Sign Up as Student",
    signupText: "Don't have an account?",
    signupLink: "Sign up",
    dashboardPath: "/student/dashboard",
  },
  recruiter: {
    icon: Building2,
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    buttonText: "Sign In as Recruiter",
    signupButtonText: "Register as Recruiter",
    signupText: "New recruiter?",
    signupLink: "Register your company",
    dashboardPath: "/recruiter/dashboard",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "student";
  const { signIn, signUp, role: userRole } = useAuth();
  const { toast } = useToast();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);
  
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Callback when reCAPTCHA v2 checkbox is verified
  const onRecaptchaVerify = useCallback((token: string) => {
    setRecaptchaToken(token);
    setRecaptchaError(null);
  }, []);

  // Load reCAPTCHA script and render widget
  useEffect(() => {
    const renderRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current && recaptchaWidgetId.current === null) {
        try {
          recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            size: "normal", // Using visible reCAPTCHA v2 checkbox
            callback: onRecaptchaVerify,
            "expired-callback": () => {
              setRecaptchaToken(null);
            },
            "error-callback": () => {
              setRecaptchaToken(null);
              setRecaptchaError("reCAPTCHA verification failed. Please try again.");
            },
          });
          setRecaptchaLoaded(true);
          setRecaptchaError(null);
        } catch (e: any) {
          console.error("reCAPTCHA render error:", e);
          // Check for "Invalid key type" error
          if (e?.message?.includes("Invalid key type") || e?.toString?.()?.includes("Invalid key type")) {
            setRecaptchaError("reCAPTCHA configuration error. Please contact support.");
          } else {
            // Widget might already be rendered
            setRecaptchaLoaded(true);
          }
        }
      }
    };

    // Check if script is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(renderRecaptcha);
    } else {
      // Load the script with explicit render mode
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
        script.async = true;
        script.defer = true;
        
        (window as any).onRecaptchaLoad = () => {
          window.grecaptcha.ready(renderRecaptcha);
        };
        
        document.head.appendChild(script);
      } else {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval);
            window.grecaptcha.ready(renderRecaptcha);
          }
        }, 100);
        
        // Cleanup interval after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    }

    return () => {
      delete (window as any).onRecaptchaLoad;
    };
  }, [onRecaptchaVerify]);

  const config = roleConfig[role];

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    
    try {
      // Check rate limit for login
      const rateLimitResult = await checkRateLimit("login", "google-oauth");
      if (!rateLimitResult.allowed) {
        toast({
          variant: "destructive",
          title: "Too many attempts",
          description: getRateLimitMessage("login", rateLimitResult.retryAfter || 900),
        });
        return;
      }
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign-in failed",
          description: error.message,
        });
      }
      // If successful, the page will redirect
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Execute the actual form submission after reCAPTCHA verification
  const executeSubmit = useCallback(async (captchaToken: string) => {
    // Verify reCAPTCHA token with backend
    const captchaResult = await verifyRecaptcha(captchaToken);
    if (!captchaResult.verified) {
      setFormError("CAPTCHA verification failed. Please try again.");
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: captchaResult.error || "Please try again.",
      });
      // Reset reCAPTCHA
      if (recaptchaWidgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken(null);
      setIsLoading(false);
      return;
    }
    
    // Check rate limit
    const action = isSignUp ? "signup" : "login";
    const rateLimitResult = await checkRateLimit(action, email.toLowerCase());
    
    if (!rateLimitResult.allowed) {
      const message = getRateLimitMessage(action, rateLimitResult.retryAfter || 900);
      setFormError(message);
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: message,
      });
      setIsLoading(false);
      return;
    }
    
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
            description: "Please check your email to verify your account.",
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
          // Verify the user's role matches the selected role
          const { data: userData } = await supabase.auth.getUser();
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user?.id ?? "")
            .maybeSingle();

          const actualRole = roleData?.role;

          if (actualRole === "admin") {
            // Admin should use /admin login page
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Access denied",
              description: "Please use the admin login page.",
            });
          } else if (actualRole !== role) {
            // Role mismatch — sign out and show error
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Role mismatch",
              description: `This account is registered as a ${actualRole}. Please select the correct role tab.`,
            });
          } else {
            navigate(config.dashboardPath, { replace: true });
          }
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
      // Reset reCAPTCHA after submission
      if (recaptchaWidgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken(null);
    }
  }, [isSignUp, email, password, fullName, role, signUp, signIn, toast, navigate, config.dashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate password strength on signup
    if (isSignUp && !isPasswordValid(password)) {
      setFormError("Please meet all password requirements before signing up.");
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Please meet all password requirements before signing up.",
      });
      return;
    }

    // Check for leaked passwords on signup
    if (isSignUp) {
      setIsLoading(true);
      const { leaked, count } = await checkLeakedPassword(password);
      if (leaked) {
        setFormError(`This password has appeared in ${count.toLocaleString()} data breaches. Please choose a different password.`);
        toast({
          variant: "destructive",
          title: "Compromised password",
          description: "This password was found in known data breaches. Please choose a different one.",
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    // If reCAPTCHA is not loaded or has an error, skip verification in dev
    if (recaptchaError || !recaptchaLoaded) {
      console.warn("reCAPTCHA not available, proceeding without verification");
      setIsLoading(true);
      await executeSubmit("bypass-dev");
      return;
    }

    // For v2 checkbox, check if user has completed the challenge
    let token: string | null = recaptchaToken;
    
    if (!token && recaptchaWidgetId.current !== null && window.grecaptcha) {
      token = window.grecaptcha.getResponse(recaptchaWidgetId.current);
    }
    
    if (!token) {
      setFormError("Please complete the CAPTCHA verification.");
      toast({
        variant: "destructive",
        title: "CAPTCHA required",
        description: "Please check the 'I'm not a robot' box.",
      });
      return;
    }

    setIsLoading(true);
    await executeSubmit(token);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <SkipLink href="#login-form" />
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
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="student" className="gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Student</span>
                </TabsTrigger>
                <TabsTrigger value="recruiter" className="gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Recruiter</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
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
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isSignUp ? 8 : 6}
                  className="bg-muted"
                  aria-describedby={isSignUp ? "password-requirements" : undefined}
                />
                {isSignUp && (
                  <div id="password-requirements">
                    <PasswordStrength password={password} />
                  </div>
                )}
              </div>

              {/* reCAPTCHA Widget */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  ref={recaptchaRef} 
                  aria-label="reCAPTCHA verification"
                />
                {recaptchaError && (
                  <p className="text-sm text-destructive">{recaptchaError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isGoogleLoading || (!recaptchaToken && recaptchaLoaded && !recaptchaError)}
              >
                {isLoading 
                  ? (isSignUp ? "Creating account..." : "Signing in...") 
                  : (isSignUp ? config.signupButtonText : config.buttonText)}
              </Button>
              
              {/* Error announcements for screen readers */}
              <LiveRegion politeness="assertive">
                {formError && (
                  <span className="sr-only">{formError}</span>
                )}
              </LiveRegion>
            </form>

            {/* Google Sign-In */}
            <>
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            </>

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
