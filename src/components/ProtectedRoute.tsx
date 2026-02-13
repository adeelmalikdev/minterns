import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "student" | "recruiter" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const dashboardPath = `/${role}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  // Redirect students to complete-profile if profile is not completed
  if (
    role === "student" &&
    profile &&
    !profile.profile_completed &&
    location.pathname !== "/student/complete-profile"
  ) {
    return <Navigate to="/student/complete-profile" replace />;
  }

  return <>{children}</>;
}
