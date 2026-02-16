import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/Auth-context";

const HomePage = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Secure Authentication System
        </h1>

        <p className="text-lg md:text-xl opacity-90 mb-8">
          Production-ready JWT authentication with refresh tokens, role-based
          access control and secure password recovery.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            Login
          </a>

          <a
            href="/signup"
            className="bg-indigo-900 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-indigo-800 transition"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
