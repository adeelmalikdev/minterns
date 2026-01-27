import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import StudentOpportunities from "./pages/student/Opportunities";
import StudentOpportunityDetails from "./pages/student/OpportunityDetails";
import StudentApplications from "./pages/student/Applications";
import StudentPortfolio from "./pages/student/Portfolio";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterPostOpportunity from "./pages/recruiter/PostOpportunity";
import RecruiterManageApplicants from "./pages/recruiter/ManageApplicants";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "./pages/NotFound";

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
    
    {/* Admin Routes */}
    <Route 
      path="/admin/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } 
    />
    
    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
