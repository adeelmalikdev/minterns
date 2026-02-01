import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // Show warning 5 minutes before

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  timeRemaining: number;
  extendSession: () => void;
  dismissWarning: () => void;
}

export function useSessionTimeout(): UseSessionTimeoutReturn {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARNING_BEFORE_TIMEOUT);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setShowWarning(false);
    setTimeRemaining(WARNING_BEFORE_TIMEOUT);

    if (!user) return;

    // Set warning timer (5 minutes before timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(WARNING_BEFORE_TIMEOUT);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT);
  }, [user, signOut]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  // Reset on user activity
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimers();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, showWarning, resetTimers]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    dismissWarning,
  };
}

export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
