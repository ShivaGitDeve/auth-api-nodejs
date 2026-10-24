import { useState } from "react";
import { FiCheckCircle, FiKey, FiLock, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AppShell from "../../components/AppShell";
import { Button, Card, Input, PasswordStrength } from "../../components/ui";

const tips = [
  "Use at least 12 characters",
  "Mix upper & lowercase letters",
  "Add numbers and symbols",
  "Never reuse passwords across sites",
];

const ChangePassword = () => {
  const [currentPassword, setcurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      setcurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-violet-300">Security</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Change password</h1>
        <p className="mt-2 text-slate-400">Keep your account safe with a strong, unique password.</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <Card className="p-8 animate-fade-up lg:col-span-3" style={{ animationDelay: "100ms" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Current password"
              icon={FiKey}
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setcurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <div className="h-px bg-white/5" />
            <div className="space-y-2.5">
              <Input
                label="New password"
                icon={FiLock}
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <PasswordStrength password={newPassword} />
            </div>
            <Input
              label="Confirm new password"
              icon={FiLock}
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={loading} loadingText="Updating..." className="w-full">
              Update password
            </Button>
          </form>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: "200ms" }}>
          <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-emerald-300">
            <FiShield className="size-6" />
          </div>
          <h3 className="font-display text-lg font-semibold">Password tips</h3>
          <ul className="mt-4 space-y-3">
            {tips.map((t, i) => (
              <li
                key={t}
                className="flex items-center gap-3 text-sm text-slate-400 animate-fade-up"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <FiCheckCircle className="size-4 shrink-0 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
};

export default ChangePassword;
