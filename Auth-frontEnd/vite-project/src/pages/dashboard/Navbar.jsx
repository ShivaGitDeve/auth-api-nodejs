import { Link } from "react-router-dom";
import { useAuth } from "../../auth/Auth-context";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
      <Link to="/dashboard">Dashboard</Link>

      {user?.role === "admin" && <Link to="/admin">Admin</Link>}

      <button onClick={logout}>Logout</button>
    </nav>
  );
};

export default Navbar