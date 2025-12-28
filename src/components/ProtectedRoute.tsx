import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "@/lib/api";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    // Not logged in, redirect to auth page
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Logged in but wrong role, redirect to their own dashboard
    const dashboardPath = currentUser.role === "jobseeker" ? "/seeker/dashboard" : "/company/dashboard";
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;