import { Navigate, Link } from "react-router-dom";
import {
  FiArrowRight,
  FiClock,
  FiKey,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../../auth/Auth-context";
import { Background, Button, Logo, Reveal } from "../../components/ui";
import { SecurityOrb } from "../../components/AuthLayout";

const features = [
  { icon: FiKey, title: "JWT access tokens", desc: "Short-lived, signed tokens keep every request authenticated and stateless." },
  { icon: FiRefreshCw, title: "Refresh rotation", desc: "Refresh tokens rotate on every use with reuse detection built in." },
  { icon: FiUserCheck, title: "Role-based access", desc: "Admin and user roles guard routes on both server and client." },
  { icon: FiLock, title: "bcrypt hashing", desc: "Passwords are salted and hashed — never stored in plain text." },
  { icon: FiMail, title: "Email recovery", desc: "Secure, time-limited reset links delivered straight to your inbox." },
  { icon: FiClock, title: "Rate limiting", desc: "Brute-force protection on login and password reset endpoints." },
];

const steps = [
  { n: "01", title: "Create account", desc: "Sign up with your name, email and a strong password." },
  { n: "02", title: "Sign in securely", desc: "Get a JWT session with automatic silent refresh." },
  { n: "03", title: "Stay protected", desc: "Manage your profile, password and access in one place." },
];

const HomePage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <Background />

      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#06060f]/50 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white">
              Sign in
            </Link>
            <Link to="/signup">
              <Button className="rounded-full px-5 py-2">Get started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* --- HERO --- */}
      <main className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-200 animate-fade-up">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-violet-400 animate-ping-slow" />
              <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
            </span>
            Production-ready authentication
          </div>

          <h1
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight animate-fade-up sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "100ms" }}
          >
            Secure auth,
            <br />
            <span className="text-gradient">beautifully simple.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate-400 animate-fade-up lg:mx-0"
            style={{ animationDelay: "200ms" }}
          >
            JWT authentication with refresh tokens, role-based access control and email password
            recovery — wrapped in an experience your users will love.
          </p>

          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up lg:justify-start"
            style={{ animationDelay: "300ms" }}
          >
            <Link to="/signup">
              <Button className="rounded-full px-8 py-4 text-base">
                Create free account
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="rounded-full px-8 py-4 text-base">
                Sign in
              </Button>
            </Link>
          </div>

          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 animate-fade-up lg:justify-start"
            style={{ animationDelay: "400ms" }}
          >
            {["Node.js", "Express", "PostgreSQL", "React"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <FiZap className="size-3.5 text-violet-400" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="animate-scale-in" style={{ animationDelay: "200ms" }}>
          <SecurityOrb className="scale-90 sm:scale-110" />
        </div>
      </main>

      {/* --- FEATURES --- */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">Features</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Everything you need to <span className="text-gradient">stay secure</span>
          </h2>
          <p className="mt-4 text-slate-400">Built with modern security standards and production-ready architecture.</p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-violet-400/30 hover:bg-white/[0.05]">
                <div className="absolute -right-12 -top-12 size-40 rounded-full bg-violet-600/0 blur-3xl transition-all duration-700 group-hover:bg-violet-600/30" />
                <div className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-110 group-hover:from-violet-500 group-hover:to-fuchsia-500 group-hover:text-white">
                  <Icon className="size-5" />
                </div>
                <h3 className="relative mt-6 font-display text-lg font-semibold">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">How it works</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Up and running in minutes</h2>
        </Reveal>
        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent md:block" />
          {steps.map(({ n, title, desc }, i) => (
            <Reveal key={n} delay={i * 150} className="relative text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/10 bg-[#0d0d1c] font-display text-xl font-bold text-gradient shadow-xl">
                {n}
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-cyan-500/20 px-6 py-16 text-center sm:px-16">
            <div className="absolute -left-20 -top-20 size-72 rounded-full bg-violet-500/30 blur-3xl animate-blob" />
            <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-cyan-400/20 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
            <FiShield className="relative mx-auto size-12 text-white animate-float" />
            <h2 className="relative mt-6 font-display text-3xl font-bold sm:text-5xl">Ready to get started?</h2>
            <p className="relative mx-auto mt-4 max-w-md text-slate-300">
              Create your account in seconds and experience secure authentication done right.
            </p>
            <Link to="/signup" className="relative mt-8 inline-block">
              <Button variant="light" className="rounded-full px-8 py-4 text-base">
                Create free account <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} AuthUI. Built with Node.js & React.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
