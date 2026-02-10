import { Link } from "react-router-dom";
import { useAuth } from "../../auth/Auth-context";
import Navbar from "./Navbar";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <h2>Dashboard</h2>
      <p>Welcome, {user?.name}</p>
      <p>Role: {user?.role}</p>

      {user?.role === "admin" && <Link to="/admin">Go to Admin</Link>}
    </>
  );
};

export default Dashboard;
