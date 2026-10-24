import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/Auth-context";
import AuthLayout from "../../components/AuthLayout";
import { Button, Input } from "../../components/ui";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      toast.success(`Welcome back, ${loggedIn.name}!`);
      navigate("/dashboard");
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard."
      footer={
        <>
          Don’t have an account?{" "}
          <Link to="/signup" className="font-semibold text-violet-300 transition hover:text-white">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          icon={FiMail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <div>
          <Input
            label="Password"
            icon={FiLock}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-slate-400 transition hover:text-violet-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} loadingText="Signing in..." className="w-full">
          Sign in <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
