import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../components/AuthLayout";
import { Button, Input, PasswordStrength } from "../../components/ui";

const SuccessCheck = () => (
  <svg viewBox="0 0 52 52" className="size-24">
    <circle cx="26" cy="26" r="24" fill="none" stroke="url(#g)" strokeWidth="2.5" />
    <path
      d="M15 27l7 7 15-16"
      fill="none"
      stroke="#fff"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="40"
      strokeDashoffset="40"
      className="animate-draw"
    />
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stopColor="#a78bfa" />
        <stop offset="1" stopColor="#34d399" />
      </linearGradient>
    </defs>
  </svg>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token,
        newPassword,
      });
      setDone(true);
      toast.success("Password reset successful");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.error?.[0] || data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-violet-300 transition hover:text-white">
      <FiArrowLeft /> Back to sign in
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="Invalid link" footer={backToLogin}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 grid size-20 place-items-center rounded-full bg-amber-500/15 text-amber-300 animate-scale-in">
            <FiAlertTriangle className="size-9" />
          </div>
          <p className="text-sm text-slate-400">
            This reset link is missing or broken. Please request a new one.
          </p>
          <Link to="/forgot-password" className="mt-8 w-full">
            <Button className="w-full">Request new link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="All set!" footer={backToLogin}>
        <div className="flex flex-col items-center text-center animate-scale-in">
          <SuccessCheck />
          <p className="mt-6 text-sm text-slate-400">
            Your password has been updated. Redirecting you to sign in...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password you haven’t used before."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <Input
            label="New password"
            icon={FiLock}
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
          <PasswordStrength password={newPassword} />
        </div>
        <Input
          label="Confirm password"
          icon={FiLock}
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Button type="submit" loading={loading} loadingText="Resetting..." className="w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
