import { Navigate } from "react-router-dom";
import { useAuth } from "./Auth-context";
import { FullPageLoader } from "../components/ui";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <FullPageLoader />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
