import { useAuth } from "../../auth/Auth-context";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <>
      <h2>Dashboard</h2>
      <p> Welcome, {user?.name}</p>
      <p>Role, {user?.role}</p>
    </>
  );
};

export default Dashboard;
