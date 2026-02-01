import { useEffect } from "react";
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
import { initializeErrorTracking } from "@/lib/sentry";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import StudentOpportunities from "./pages/student/Opportunities";
import StudentOpportunityDetails from "./pages/student/OpportunityDetails";
import StudentApplications from "./pages/student/Applications";
import StudentPortfolio from "./pages/student/Portfolio";
import StudentTasks from "./pages/student/Tasks";
import StudentMessages from "./pages/student/Messages";
import StudentNotifications from "./pages/student/Notifications";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterPostOpportunity from "./pages/recruiter/PostOpportunity";
import RecruiterManageApplicants from "./pages/recruiter/ManageApplicants";
import RecruiterSubmissions from "./pages/recruiter/Submissions";
import RecruiterMessages from "./pages/recruiter/Messages";
import RecruiterNotifications from "./pages/recruiter/Notifications";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminActivities from "./pages/admin/Activities";
import AboutUs from "./pages/AboutUs";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Initialize error tracking on app load
initializeErrorTracking();

const queryClient = new QueryClient();

function AuthenticatedRedirect() {
  const { user, role, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user && role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  
  return <Landing />;
}

function LoginRedirect() {
  const { user, role, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user && role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  
  return <Login />;
}

const AppRoutes = () => (
  <>
    <SkipLink />
    <SessionTimeoutWarning />
    <Routes>
      <Route path="/" element={<AuthenticatedRedirect />} />
      <Route path="/login" element={<LoginRedirect />} />
    
    {/* Student Routes */}
    <Route 
      path="/student/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/opportunities" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentOpportunities />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/opportunities/:id" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentOpportunityDetails />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/applications" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentApplications />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/portfolio" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentPortfolio />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/tasks" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentTasks />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/messages" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentMessages />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/notifications" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentNotifications />
        </ProtectedRoute>
      } 
    />
    
    {/* Recruiter Routes */}
    <Route 
      path="/recruiter/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/recruiter/post" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterPostOpportunity />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/recruiter/opportunities/:id/applicants" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterManageApplicants />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/recruiter/submissions" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterSubmissions />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/recruiter/messages" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterMessages />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/recruiter/notifications" 
      element={
        <ProtectedRoute allowedRoles={["recruiter"]}>
          <RecruiterNotifications />
        </ProtectedRoute>
      } 
    />
    
    {/* Admin Routes */}
    <Route 
      path="/admin/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/activities" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminActivities />
        </ProtectedRoute>
      } 
    />
    
    {/* Public Pages */}
    <Route path="/about" element={<AboutUs />} />
    <Route path="/feedback" element={<Feedback />} />
    
    {/* Settings - Available to all authenticated users */}
    <Route 
      path="/settings" 
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } 
    />
    
    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  </>
);

const App = () => (
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
);

export default App;
