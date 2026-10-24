import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./Auth-context";
import { FullPageLoader } from "../components/ui";

const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
