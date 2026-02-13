import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rateLimit";
import { LiveRegion } from "@/components/accessibility/LiveRegion";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { RECAPTCHA_SITE_KEY } from "@/hooks/useReCaptcha";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  const onRecaptchaVerify = useCallback((token: string) => {
    setRecaptchaToken(token);
    setRecaptchaError(null);
  }, []);

  useEffect(() => {
    const renderRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current && recaptchaWidgetId.current === null) {
        try {
          recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            size: "normal",
            callback: onRecaptchaVerify,
            "expired-callback": () => setRecaptchaToken(null),
            "error-callback": () => {
              setRecaptchaToken(null);
              setRecaptchaError("reCAPTCHA verification failed. Please try again.");
            },
          });
          setRecaptchaLoaded(true);
          setRecaptchaError(null);
        } catch (e: any) {
          console.error("reCAPTCHA render error:", e);
          if (e?.message?.includes("Invalid key type") || e?.toString?.()?.includes("Invalid key type")) {
            setRecaptchaError("reCAPTCHA configuration error. Please contact support.");
          } else {
            setRecaptchaLoaded(true);
          }
        }
      }
    };

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderRecaptcha);
    } else {
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
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval);
            window.grecaptcha.ready(renderRecaptcha);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    }

    return () => {
      delete (window as any).onRecaptchaLoad;
    };
  }, [onRecaptchaVerify]);

  const executeSubmit = useCallback(async (captchaToken: string) => {
    const captchaResult = await verifyRecaptcha(captchaToken);
    if (!captchaResult.verified) {
      setFormError("CAPTCHA verification failed. Please try again.");
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: captchaResult.error || "Please try again.",
      });
      if (recaptchaWidgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken(null);
      setIsLoading(false);
      return;
    }

    const rateLimitResult = await checkRateLimit("login", email.toLowerCase());
    if (!rateLimitResult.allowed) {
      const message = getRateLimitMessage("login", rateLimitResult.retryAfter || 900);
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
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      } else {
        // Verify the user actually has the admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
          .eq("role", "admin")
          .maybeSingle();

        if (roleError || !roleData) {
          // Not an admin — sign them out immediately
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "This account does not have administrator privileges.",
          });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
      if (recaptchaWidgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken(null);
    }
  }, [email, password, signIn, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (recaptchaError || !recaptchaLoaded) {
      console.warn("reCAPTCHA not available, proceeding without verification");
      setIsLoading(true);
      await executeSubmit("bypass-dev");
      return;
    }

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
      <SkipLink href="#admin-login-form" />
      <div className="container py-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              Sign in with your administrator credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" id="admin-login-form">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
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
                  minLength={6}
                  className="bg-muted"
                />
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
                disabled={isLoading || (!recaptchaToken && recaptchaLoaded && !recaptchaError)}
              >
                {isLoading ? "Signing in..." : "Sign In as Admin"}
              </Button>

              <LiveRegion politeness="assertive">
                {formError && (
                  <span className="sr-only">{formError}</span>
                )}
              </LiveRegion>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              This area is restricted to authorized administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
