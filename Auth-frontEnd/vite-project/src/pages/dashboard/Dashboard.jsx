import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../auth/Auth-context";
import api from "../../api/axios";
import AppShell from "../../components/AppShell";
import { Card } from "../../components/ui";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const StatCard = ({ icon: Icon, label, value, accent, delay }) => (
  <Card
    className="group overflow-hidden p-5 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-50 ${accent}`} />
    <div className={`mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg ${accent}`}>
      <Icon className="size-5" />
    </div>
    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 font-display text-xl font-semibold capitalize text-white">{value}</p>
  </Card>
);

const ActionCard = ({ to, icon: Icon, title, desc, delay }) => (
  <Link to={to} className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
    <Card className="group h-full p-6 transition-all duration-500 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-violet-900/30">
      <div className="flex items-start justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-white/[0.06] text-violet-300 transition-all duration-500 group-hover:scale-110 group-hover:bg-violet-500/20">
          <Icon className="size-5" />
        </div>
        <FiArrowUpRight className="size-5 text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </Card>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [me, setMe] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setMe(res.data.user))
      .catch(() => {});
  }, []);

  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const checks = [
    { label: "Account created", ok: true },
    { label: "Password protected with bcrypt", ok: true },
    { label: "Session secured with JWT", ok: true },
    { label: "Account active", ok: me?.isActive !== false },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-500/10 p-8 animate-fade-up sm:p-10">
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-violet-500/30 blur-3xl animate-blob" />
        <p className="relative text-sm font-medium text-violet-200">{greeting()} 👋</p>
        <h1 className="relative mt-2 font-display text-3xl font-bold sm:text-5xl">
          Welcome, <span className="text-gradient">{user?.name}</span>
        </h1>
        <p className="relative mt-3 max-w-xl text-slate-300">
          Your account is secure and ready. Here’s a quick overview of your profile and security.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FiUser} label="Role" value={user?.role} accent="from-violet-500 to-fuchsia-500" delay={100} />
        <StatCard
          icon={FiActivity}
          label="Status"
          value={me?.isActive === false ? "Inactive" : "Active"}
          accent="from-emerald-400 to-teal-600"
          delay={180}
        />
        <StatCard icon={FiCalendar} label="Member since" value={memberSince} accent="from-amber-400 to-orange-500" delay={260} />
        <StatCard icon={FiShield} label="Session" value="Secured" accent="from-cyan-400 to-blue-600" delay={340} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <ActionCard to="/profile" icon={FiUser} title="View profile" desc="See your account details." delay={400} />
          <ActionCard to="/change-password" icon={FiLock} title="Change password" desc="Update your credentials." delay={480} />
          {user?.role === "admin" ? (
            <ActionCard to="/admin" icon={FiUsers} title="Manage users" desc="Roles, access and accounts." delay={560} />
          ) : (
            <ActionCard to="/forgot-password" icon={FiKey} title="Recovery" desc="Reset via email if you forget." delay={560} />
          )}
          <ActionCard to="/security" icon={FiShield} title="Security center" desc="Session details, protections and tips." delay={640} />
        </div>

        <Card className="animate-fade-up" style={{ animationDelay: "500ms" }}>
          <h3 className="font-display text-lg font-semibold">Security score</h3>
          <div className="relative mx-auto my-6 size-36">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ffffff10" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#score)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - score / 100)}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="score" x1="0" x2="1">
                  <stop offset="0" stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-3xl font-bold">{score}%</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-sm text-slate-400">
                <FiCheckCircle className={`size-4 ${c.ok ? "text-emerald-400" : "text-slate-600"}`} />
                {c.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
};

export default Dashboard;
