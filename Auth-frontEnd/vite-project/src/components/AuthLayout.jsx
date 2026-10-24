import { FiCheck, FiKey, FiLock, FiMail, FiShield, FiUserCheck } from "react-icons/fi";
import { Background, Card, Logo } from "./ui";

const orbitBadges = [
  { icon: FiKey, label: "JWT", pos: "left-0 top-10", delay: "0s" },
  { icon: FiLock, label: "bcrypt", pos: "right-0 top-24", delay: "-2s" },
  { icon: FiUserCheck, label: "RBAC", pos: "bottom-10 left-6", delay: "-4s" },
  { icon: FiMail, label: "Email reset", pos: "bottom-2 right-4", delay: "-3s" },
];

export const SecurityOrb = ({ className = "" }) => (
  <div className={`relative mx-auto size-80 ${className}`}>
    <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow">
      <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-violet-400 shadow-[0_0_20px_4px] shadow-violet-500/70" />
    </div>
    <div className="absolute inset-10 rounded-full border border-dashed border-white/15 animate-spin-reverse">
      <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_16px_4px] shadow-cyan-400/70" />
    </div>
    <div className="absolute inset-20 rounded-full bg-gradient-to-br from-violet-600/50 to-cyan-500/30 blur-2xl" />
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative animate-float">
        <span className="absolute inset-0 rounded-3xl bg-violet-500/50 animate-ping-slow" />
        <div className="relative grid size-28 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 shadow-2xl shadow-violet-600/50 ring-1 ring-white/30">
          <FiShield className="size-12 text-white" />
        </div>
      </div>
    </div>
    {orbitBadges.map(({ icon: Icon, label, pos, delay }) => (
      <div
        key={label}
        className={`absolute ${pos} flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-xl animate-float`}
        style={{ animationDelay: delay }}
      >
        <Icon className="size-3.5 text-violet-300" /> {label}
      </div>
    ))}
  </div>
);

const points = [
  "Short-lived access tokens with refresh rotation",
  "Passwords hashed with bcrypt — never stored plain",
  "Secure email-based password recovery",
];

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="relative grid min-h-screen text-white lg:grid-cols-2">
    <Background />

    <aside className="relative hidden flex-col justify-between border-r border-white/5 p-12 lg:flex">
      <Logo />
      <div className="animate-fade-up">
        <SecurityOrb />
        <h2 className="mt-12 font-display text-4xl font-bold leading-tight">
          Your identity,
          <br />
          <span className="text-gradient">locked down.</span>
        </h2>
        <ul className="mt-6 space-y-3">
          {points.map((p, i) => (
            <li
              key={p}
              className="flex items-center gap-3 text-sm text-slate-400 animate-fade-up"
              style={{ animationDelay: `${300 + i * 120}ms` }}
            >
              <span className="grid size-5 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                <FiCheck className="size-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-600">© {new Date().getFullYear()} AuthUI. Built with Node.js & React.</p>
    </aside>

    <main className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <Card className="p-8 animate-fade-up sm:p-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </Card>
        {footer && (
          <p className="mt-6 text-center text-sm text-slate-400 animate-fade-in" style={{ animationDelay: "400ms" }}>
            {footer}
          </p>
        )}
      </div>
    </main>
  </div>
);

export default AuthLayout;
