import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiFolder, FiGrid, FiLayers, FiLock, FiLogOut, FiShield, FiUser, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../auth/Auth-context";
import { useWorkspaces } from "../workspace/WorkspaceContext";
import { Avatar, Background, Logo } from "./ui";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const isTeamsPath = (path) => /^\/workspaces\/[^/]+\/teams(\/|$)/.test(path);
const isProjectsPath = (path) => /^\/workspaces\/[^/]+\/projects(\/|$)/.test(path);

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const { current } = useWorkspaces();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // match: /workspaces/:id/teams par "Teams" active ho, "Workspaces" nahi
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: FiGrid },
    {
      to: "/workspaces",
      label: "Workspaces",
      icon: FiLayers,
      match: (p) => p.startsWith("/workspaces") && !isTeamsPath(p) && !isProjectsPath(p),
    },
    {
      to: current ? `/workspaces/${current.id}/projects` : "/workspaces",
      label: "Projects",
      icon: FiFolder,
      match: isProjectsPath,
    },
    {
      to: current ? `/workspaces/${current.id}/teams` : "/workspaces",
      label: "Teams",
      icon: FiUsers,
      match: isTeamsPath,
    },
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

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#06060f]/70 backdrop-blur-xl">
        {/* row 1: logo + workspace switcher | user */}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden shrink-0 sm:block">
              <Logo to="/dashboard" />
            </span>
            <span className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" />
            <div className="min-w-0">
              <WorkspaceSwitcher />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
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

        {/* row 2: nav tabs (sab screen sizes par) - chhoti screen par horizontal scroll */}
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
          {links.map(({ to, label, icon: Icon, match }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => {
                const active = match ? match(pathname) : isActive;
                return `group relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors duration-300 ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`;
              }}
            >
              {({ isActive }) => {
                const active = match ? match(pathname) : isActive;
                return (
                  <>
                    <span
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-300 ${
                        active ? "" : "group-hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className={`size-4 ${active ? "text-violet-300" : ""}`} /> {label}
                    </span>
                    <span
                      className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ${
                        active ? "opacity-100" : "scale-x-0 opacity-0"
                      }`}
                    />
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
};

export default AppShell;
