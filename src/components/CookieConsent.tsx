import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

type ConsentStatus = "pending" | "accepted" | "rejected";

const COOKIE_CONSENT_KEY = "cookieConsent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (status: ConsentStatus) => {
    setIsClosing(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
    
    // Allow animation to complete before hiding
    setTimeout(() => {
      setShowBanner(false);
      setIsClosing(false);
      
      if (status === "accepted") {
        // Initialize analytics/tracking only after consent
        initializeAnalytics();
      }
    }, 300);
  };

  const initializeAnalytics = () => {
    // This is where analytics scripts would be initialized
    // e.g., Google Analytics, Sentry user tracking, etc.
    console.log("Analytics initialized with user consent");
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent("cookieConsentAccepted"));
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-300 ${
        isClosing ? "translate-y-full" : "translate-y-0"
      }`}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <Card className="mx-auto max-w-4xl border-border bg-card shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h2 id="cookie-consent-title" className="font-semibold text-foreground">
                  We value your privacy
                </h2>
                <p id="cookie-consent-description" className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.{" "}
                  <Link 
                    to="/about" 
                    className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Learn more about our privacy policy
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConsent("rejected")}
                className="w-full sm:w-auto"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={() => handleConsent("accepted")}
                className="w-full sm:w-auto"
              >
                Accept All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility function to check consent status
export function getCookieConsent(): ConsentStatus | null {
  return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus | null;
}

// Utility function to check if analytics can be used
export function canUseAnalytics(): boolean {
  return getCookieConsent() === "accepted";
}
