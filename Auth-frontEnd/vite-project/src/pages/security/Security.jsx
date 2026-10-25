import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiKey,
  FiLock,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiSlash,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/Auth-context";
import AppShell from "../../components/AppShell";
import { Button, Card } from "../../components/ui";

// JWT payload decode karta hai (sirf display ke liye, verification backend karta hai)
const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const formatRemaining = (ms) => {
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Google Chrome";
  if (ua.includes("Firefox/")) return "Mozilla Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Web browser";
};

const getOS = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown OS";
};

const protections = [
  {
    icon: FiLock,
    title: "Password hashing",
    desc: "Your password is hashed with bcrypt (10 salt rounds). Nobody — not even admins — can see it.",
  },
  {
    icon: FiRefreshCw,
    title: "Refresh token rotation",
    desc: "Every refresh issues a new token. If an old token is reused, all your sessions are revoked.",
  },
  {
    icon: FiSlash,
    title: "Login rate limiting",
    desc: "Max 5 login attempts per 15 minutes to block brute-force attacks.",
  },
  {
    icon: FiMail,
    title: "Secure recovery",
    desc: "Reset links are single-use, stored hashed, and expire after 15 minutes. Max 5 requests per hour.",
  },
];

const tips = [
  "Use a unique password of 12+ characters",
  "Mix upper & lowercase, numbers and symbols",
  "Never share your password or reset links",
  "Sign out on shared or public devices",
  "Change your password if you suspect misuse",
];

const TokenTimer = ({ icon: Icon, label, token, accent }) => {
  const payload = token ? decodeToken(token) : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!payload?.exp) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-400">Not available</p>
      </div>
    );
  }

  const total = (payload.exp - payload.iat) * 1000;
  const remaining = payload.exp * 1000 - now;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Icon className="size-3.5" /> {label}
        </p>
        <p className={`font-mono text-sm font-semibold ${remaining > 0 ? "text-white" : "text-amber-300"}`}>
          {formatRemaining(remaining)}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ${accent}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Expires {new Date(payload.exp * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
};

const Security = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const accessToken = sessionStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const loginAt = decodeToken(refreshToken || "")?.iat;

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out from this device");
    navigate("/login");
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm font-medium text-emerald-300">Security center</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Account security</h1>
          <p className="mt-2 text-slate-400">Your session details and how your account is protected.</p>
        </div>
        <Link to="/change-password">
          <Button>
            <FiKey /> Change password
          </Button>
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* current session */}
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-cyan-300">
                <FiMonitor className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Current session</h3>
                <p className="text-sm text-slate-400">
                  {getBrowser()} on {getOS()}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-400 animate-ping-slow" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Active now
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TokenTimer icon={FiClock} label="Access token" token={accessToken} accent="from-violet-500 to-fuchsia-500" />
            <TokenTimer icon={FiRefreshCw} label="Session (refresh token)" token={refreshToken} accent="from-cyan-400 to-blue-500" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-5">
            <p className="text-sm text-slate-400">
              {loginAt
                ? `Signed in ${new Date(loginAt * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                : "Signed in on this device"}
              <span className="block text-xs text-slate-500">Access token renews automatically while your session is valid.</span>
            </p>
            <Button variant="danger" onClick={handleLogout}>
              <FiLogOut /> Sign out this device
            </Button>
          </div>
        </Card>

        {/* tips */}
        <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-300">
            <FiAlertTriangle className="size-5" />
          </div>
          <h3 className="font-display text-lg font-semibold">Security tips</h3>
          <ul className="mt-4 space-y-3">
            {tips.map((t, i) => (
              <li
                key={t}
                className="flex items-start gap-3 text-sm text-slate-400 animate-fade-up"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <FiCheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* protections */}
      <h2 className="mt-12 font-display text-xl font-semibold animate-fade-up" style={{ animationDelay: "300ms" }}>
        How your account is protected
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {protections.map(({ icon: Icon, title, desc }, i) => (
          <Card
            key={title}
            className="group flex gap-4 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-emerald-400/30 animate-fade-up"
            style={{ animationDelay: `${350 + i * 80}ms` }}
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300 transition-transform duration-500 group-hover:scale-110">
              <Icon className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <Link
        to="/change-password"
        className="mt-6 flex items-center justify-between rounded-3xl border border-violet-400/20 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/10 p-6 transition-all duration-500 hover:border-violet-400/40 animate-fade-up"
        style={{ animationDelay: "700ms" }}
      >
        <div className="flex items-center gap-4">
          <FiShield className="size-6 text-violet-300" />
          <div>
            <p className="font-semibold">Haven’t changed your password in a while?</p>
            <p className="text-sm text-slate-400">Updating it regularly keeps your account safer.</p>
          </div>
        </div>
        <FiArrowUpRight className="size-5 shrink-0 text-slate-400" />
      </Link>
    </AppShell>
  );
};

export default Security;
