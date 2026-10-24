import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiSend } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../components/AuthLayout";
import { Button, Input } from "../../components/ui";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-violet-300 transition hover:text-white">
      <FiArrowLeft /> Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" footer={backToLogin}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 grid size-24 place-items-center animate-scale-in">
            <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping-slow" />
            <span className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-600/40">
              <FiMail className="size-10 text-white animate-float" />
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            If an account exists for <span className="font-medium text-white">{email}</span>, you’ll
            receive a password reset link shortly. The link expires in{" "}
            <span className="text-violet-300">15 minutes</span>.
          </p>
          <Button variant="ghost" className="mt-8 w-full" loading={loading} loadingText="Resending..." onClick={handleSubmit}>
            Didn’t get it? Resend
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="No worries — enter your email and we’ll send you a reset link."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
        <Button type="submit" loading={loading} loadingText="Sending..." className="w-full">
          Send reset link <FiSend className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1" />
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
