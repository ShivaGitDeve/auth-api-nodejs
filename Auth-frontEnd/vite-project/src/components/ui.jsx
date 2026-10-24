import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiShield } from "react-icons/fi";

// Animated background - gradient blobs, grid aur mouse ke saath chalne wala glow
export const Background = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06060f]">
      <div className="absolute -left-[10%] -top-[20%] size-[45rem] rounded-full bg-violet-700/30 blur-[120px] animate-blob" />
      <div
        className="absolute -right-[15%] top-[20%] size-[40rem] rounded-full bg-fuchsia-600/20 blur-[120px] animate-blob"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute -bottom-[25%] left-[20%] size-[42rem] rounded-full bg-cyan-500/15 blur-[120px] animate-blob"
        style={{ animationDelay: "-14s" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_40%,transparent_100%)]" />
      <div
        ref={glowRef}
        className="absolute left-0 top-0 size-[600px] rounded-full bg-violet-500/10 blur-[100px] transition-transform duration-300 ease-out"
      />
    </div>
  );
};

export const Logo = ({ to = "/" }) => (
  <Link to={to} className="group inline-flex items-center gap-2.5">
    <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-600/30 transition-transform duration-500 group-hover:rotate-[360deg]">
      <FiShield className="size-[18px] text-white" />
    </span>
    <span className="font-display text-xl font-bold tracking-tight text-white">
      Auth<span className="text-gradient">UI</span>
    </span>
  </Link>
);

export const Spinner = ({ className = "size-4" }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Button = ({
  children,
  loading,
  loadingText = "Please wait...",
  variant = "primary",
  className = "",
  ...props
}) => {
  const styles = {
    primary:
      "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] hover:bg-right text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-500/50",
    ghost:
      "border border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/25 hover:bg-white/[0.08]",
    light:
      "bg-white text-violet-900 shadow-lg shadow-white/20 hover:shadow-white/40 hover:bg-violet-50",
    danger:
      "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
  };
  return (
    <button
      disabled={loading || props.disabled}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <>
            <Spinner /> {loadingText}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

export const Input = ({ icon: Icon, label, type = "text", hint, ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="group block">
      {label && (
        <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-400">
          {label}
          {hint && <span className="text-slate-500">{hint}</span>}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-violet-400" />
        )}
        <input
          type={isPassword && show ? "text" : type}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-violet-500/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/15 ${Icon ? "pl-10" : "pl-4"} ${isPassword ? "pr-11" : "pr-4"}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
          </button>
        )}
      </div>
    </label>
  );
};

const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 7) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

export const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = getStrength(password);
  const levels = [
    { label: "Too weak", color: "bg-rose-500", text: "text-rose-400" },
    { label: "Weak", color: "bg-orange-500", text: "text-orange-400" },
    { label: "Okay", color: "bg-amber-400", text: "text-amber-300" },
    { label: "Good", color: "bg-lime-400", text: "text-lime-300" },
    { label: "Strong", color: "bg-emerald-400", text: "text-emerald-300" },
  ];
  const level = levels[score];
  return (
    <div className="animate-fade-in">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${level.color}`}
              style={{ width: i < score ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${level.text}`}>{level.label} password</p>
    </div>
  );
};

export const Card = ({ children, className = "", style }) => (
  <div
    style={style}
    className={`relative rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl ${className}`}
  >
    <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
    {children}
  </div>
);

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

const avatarColors = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-400 to-blue-600",
  "from-amber-400 to-rose-500",
  "from-emerald-400 to-teal-600",
  "from-pink-500 to-orange-400",
];

export const Avatar = ({ name, className = "size-10 text-sm" }) => {
  const color = avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/10 ${color} ${className}`}
    >
      {initials(name)}
    </div>
  );
};

export const RoleBadge = ({ role }) =>
  role === "admin" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-xs font-medium text-fuchsia-300">
      <span className="size-1.5 rounded-full bg-fuchsia-400" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
      <span className="size-1.5 rounded-full bg-cyan-400" /> User
    </span>
  );

// scroll par element ko fade-up karta hai
export const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="grid min-h-screen place-items-center">
    <Background />
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 rounded-2xl bg-violet-500/40 animate-ping-slow" />
        <span className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <FiShield className="size-7 text-white" />
        </span>
      </div>
      <p className="text-sm text-slate-400">Securing your session...</p>
    </div>
  </div>
);
