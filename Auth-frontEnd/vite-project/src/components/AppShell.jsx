import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiLock, FiLogOut, FiShield, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../auth/Auth-context";
import { Avatar, Background, Logo } from "./ui";

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: FiGrid },
    { to: "/profile", label: "Profile", icon: FiUser },
    { to: "/security", label: "Security", icon: FiLock },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: FiShield }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out. See you soon!");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen text-white">
      <Background />

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#06060f]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo to="/dashboard" />

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30"
                      : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
            <Avatar name={user?.name} className="size-9 text-xs" />
            <button
              onClick={handleLogout}
              title="Logout"
              className="grid size-9 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <FiLogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* mobile nav */}
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive ? "bg-violet-600 text-white" : "bg-white/[0.04] text-slate-400"
                }`
              }
            >
              <Icon className="size-3.5" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
};

export default AppShell;
