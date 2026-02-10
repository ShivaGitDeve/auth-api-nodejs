import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./Auth-context";

const RoleProtectedRoute = (allowedRoles) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
