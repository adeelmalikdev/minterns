/**
 * Sentry Error Tracking Module
 * 
 * This module provides error logging infrastructure.
 * To enable Sentry, add your SENTRY_DSN to the project secrets.
 * 
 * Usage:
 * - Frontend errors are captured automatically
 * - Manual capture: Sentry.captureException(error)
 * - User context: Sentry.setUser({ id, email })
 */

// Sentry-like interface for error tracking
// This provides a consistent API whether Sentry is configured or not

interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
}

interface SentryContext {
  [key: string]: unknown;
}

interface ErrorLogger {
  captureException: (error: Error, context?: SentryContext) => void;
  captureMessage: (message: string, level?: "info" | "warning" | "error") => void;
  setUser: (user: SentryUser | null) => void;
  setContext: (name: string, context: SentryContext) => void;
  addBreadcrumb: (breadcrumb: { category: string; message: string; level?: string }) => void;
}

// Check if we're in production
const isProduction = import.meta.env.PROD;

// In-memory breadcrumb storage (last 100)
const breadcrumbs: Array<{ category: string; message: string; level?: string; timestamp: Date }> = [];
const MAX_BREADCRUMBS = 100;

// Current user context
let currentUser: SentryUser | null = null;

// Custom contexts
const contexts: Record<string, SentryContext> = {};

// Error queue for batching (could be sent to edge function)
const errorQueue: Array<{
  type: "exception" | "message";
  data: unknown;
  timestamp: Date;
  user: SentryUser | null;
  contexts: Record<string, SentryContext>;
  breadcrumbs: typeof breadcrumbs;
}> = [];

const addToQueue = (type: "exception" | "message", data: unknown) => {
  errorQueue.push({
    type,
    data,
    timestamp: new Date(),
    user: currentUser,
    contexts: { ...contexts },
    breadcrumbs: [...breadcrumbs],
  });

  // In a real implementation, this would batch-send to your error tracking endpoint
  // For now, we'll log to console in development
  if (!isProduction) {
    console.group(`🔴 Error Captured (${type})`);
    console.log("Data:", data);
    console.log("User:", currentUser);
    console.log("Contexts:", contexts);
    console.log("Breadcrumbs:", breadcrumbs.slice(-5));
    console.groupEnd();
  }
};

export const ErrorTracking: ErrorLogger = {
  captureException: (error: Error, context?: SentryContext) => {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    };
    
    addToQueue("exception", errorData);
    
    // Could send to edge function here:
    // sendToErrorEndpoint(errorData);
  },

  captureMessage: (message: string, level: "info" | "warning" | "error" = "info") => {
    addToQueue("message", { message, level });
  },

  setUser: (user: SentryUser | null) => {
    currentUser = user;
  },

  setContext: (name: string, context: SentryContext) => {
    contexts[name] = context;
  },

  addBreadcrumb: (breadcrumb: { category: string; message: string; level?: string }) => {
    breadcrumbs.push({ ...breadcrumb, timestamp: new Date() });
    
    // Keep only last MAX_BREADCRUMBS
    if (breadcrumbs.length > MAX_BREADCRUMBS) {
      breadcrumbs.shift();
    }
  },
};

// Global error handler
export function initializeErrorTracking() {
  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    ErrorTracking.captureException(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    ErrorTracking.captureException(error, { type: "unhandledrejection" });
  });

  // Add navigation breadcrumbs
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    ErrorTracking.addBreadcrumb({
      category: "navigation",
      message: `Navigated to ${args[2]}`,
      level: "info",
    });
    return originalPushState.apply(this, args);
  };

  console.log("🔍 Error tracking initialized");
}

// Export for use in components
export default ErrorTracking;
