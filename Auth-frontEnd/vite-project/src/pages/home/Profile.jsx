import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiCopy, FiEdit3, FiHash, FiMail, FiShield, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AppShell from "../../components/AppShell";
import { Avatar, Button, Card, RoleBadge } from "../../components/ui";

const Row = ({ icon: Icon, label, children, delay }) => (
  <div
    className="flex items-center gap-4 border-b border-white/5 py-4 last:border-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-violet-300">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 truncate text-sm font-medium text-white">{children}</div>
    </div>
  </div>
);

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load profile");
      }
    };
    fetchUser();
  }, []);

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    toast.success("User ID copied");
  };

  if (!user) {
    return (
      <AppShell>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 rounded-3xl" />
          <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center p-8 text-center animate-fade-up">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-[conic-gradient(from_0deg,#a78bfa,#f0abfc,#67e8f9,#a78bfa)] opacity-80 blur-sm animate-spin-slow" />
            <div className="relative rounded-full bg-[#0b0b18] p-1.5">
              <Avatar name={user.name} className="size-28 text-3xl" />
            </div>
            <span className="absolute bottom-2 right-2 size-5 rounded-full border-4 border-[#0b0b18] bg-emerald-400" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold">{user.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
          <div className="mt-4">
            <RoleBadge role={user.role} />
          </div>
          <Link to="/change-password" className="mt-8 w-full">
            <Button variant="ghost" className="w-full">
              <FiEdit3 /> Change password
            </Button>
          </Link>
        </Card>

        <Card className="p-8 animate-fade-up lg:col-span-2" style={{ animationDelay: "100ms" }}>
          <h3 className="font-display text-xl font-semibold">Account details</h3>
          <p className="mt-1 text-sm text-slate-400">Information associated with your account.</p>
          <div className="mt-6">
            <Row icon={FiUser} label="Full name" delay={150}>
              {user.name}
            </Row>
            <Row icon={FiMail} label="Email address" delay={220}>
              {user.email}
            </Row>
            <Row icon={FiShield} label="Role" delay={290}>
              <span className="capitalize">{user.role}</span>
            </Row>
            <Row icon={FiCalendar} label="Joined" delay={360}>
              {new Date(user.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </Row>
            <Row icon={FiHash} label="User ID" delay={430}>
              <button onClick={copyId} className="group inline-flex max-w-full items-center gap-2 font-mono text-xs text-slate-300 hover:text-white">
                <span className="truncate">{user.id}</span>
                <FiCopy className="size-3.5 shrink-0 text-slate-500 group-hover:text-violet-300" />
              </button>
            </Row>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default Profile;
