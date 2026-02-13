import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { CookieConsent } from "@/components/CookieConsent";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { A11yChecker } from "@/components/accessibility/A11yChecker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initializeErrorTracking } from "@/lib/sentry";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Student
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentOpportunities = lazy(() => import("./pages/student/Opportunities"));
const StudentOpportunityDetails = lazy(() => import("./pages/student/OpportunityDetails"));
const StudentApplications = lazy(() => import("./pages/student/Applications"));
const StudentPortfolio = lazy(() => import("./pages/student/Portfolio"));
const StudentTasks = lazy(() => import("./pages/student/Tasks"));
const StudentMessages = lazy(() => import("./pages/student/Messages"));
const StudentNotifications = lazy(() => import("./pages/student/Notifications"));

// Recruiter
const RecruiterDashboard = lazy(() => import("./pages/recruiter/Dashboard"));
const RecruiterPostOpportunity = lazy(() => import("./pages/recruiter/PostOpportunity"));
const RecruiterManageApplicants = lazy(() => import("./pages/recruiter/ManageApplicants"));
const RecruiterSubmissions = lazy(() => import("./pages/recruiter/Submissions"));
const RecruiterMessages = lazy(() => import("./pages/recruiter/Messages"));
const RecruiterNotifications = lazy(() => import("./pages/recruiter/Notifications"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminActivities = lazy(() => import("./pages/admin/Activities"));
const AdminUserManagement = lazy(() => import("./pages/admin/UserManagement"));

// Initialize error tracking on app load
initializeErrorTracking();

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function AuthenticatedRedirect() {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user && role) return <Navigate to={`/${role}/dashboard`} replace />;
  return <Landing />;
}

function LoginRedirect() {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user && role) return <Navigate to={`/${role}/dashboard`} replace />;
  return <Login />;
}

const AppRoutes = () => (
  <>
    <SkipLink />
    <SessionTimeoutWarning />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AuthenticatedRedirect />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/opportunities" element={<ProtectedRoute allowedRoles={["student"]}><StudentOpportunities /></ProtectedRoute>} />
        <Route path="/student/opportunities/:id" element={<ProtectedRoute allowedRoles={["student"]}><StudentOpportunityDetails /></ProtectedRoute>} />
        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><StudentApplications /></ProtectedRoute>} />
        <Route path="/student/portfolio" element={<ProtectedRoute allowedRoles={["student"]}><StudentPortfolio /></ProtectedRoute>} />
        <Route path="/student/tasks" element={<ProtectedRoute allowedRoles={["student"]}><StudentTasks /></ProtectedRoute>} />
        <Route path="/student/messages" element={<ProtectedRoute allowedRoles={["student"]}><StudentMessages /></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={["student"]}><StudentNotifications /></ProtectedRoute>} />

        {/* Recruiter Routes */}
        <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter/post" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterPostOpportunity /></ProtectedRoute>} />
        <Route path="/recruiter/opportunities/:id/applicants" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterManageApplicants /></ProtectedRoute>} />
        <Route path="/recruiter/submissions" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterSubmissions /></ProtectedRoute>} />
        <Route path="/recruiter/messages" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterMessages /></ProtectedRoute>} />
        <Route path="/recruiter/notifications" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterNotifications /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/activities" element={<ProtectedRoute allowedRoles={["admin"]}><AdminActivities /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUserManagement /></ProtectedRoute>} />

        {/* Public Pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* Settings */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {import.meta.env.DEV && <A11yChecker />}
            <OfflineIndicator />
            <AppRoutes />
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
