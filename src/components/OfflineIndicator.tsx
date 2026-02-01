import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep showing for a moment to confirm reconnection
      setTimeout(() => setShowIndicator(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show if already offline on mount
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showIndicator ? "translate-y-0" : "-translate-y-full"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant={isOnline ? "default" : "destructive"}
        className="rounded-none border-x-0 border-t-0"
      >
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          {isOnline
            ? "You're back online!"
            : "You are offline. Some features may be unavailable."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
