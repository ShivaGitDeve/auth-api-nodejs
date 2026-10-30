// Workspace pages ke chhote shared UI pieces

const colors = [
  "from-violet-500 to-indigo-600",
  "from-cyan-400 to-blue-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-pink-500 to-rose-600",
];

const wsInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "W";

export const WorkspaceAvatar = ({ name, className = "size-10 text-sm" }) => {
  const hash = [...(name || "")].reduce((n, c) => n + c.charCodeAt(0), 0);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br font-display font-bold text-white ring-1 ring-white/15 ${colors[hash % colors.length]} ${className}`}
    >
      {wsInitials(name)}
    </span>
  );
};

const roleStyles = {
  owner: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  admin: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
  member: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
};

export const WorkspaceRoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${roleStyles[role] || roleStyles.member}`}
  >
    {role}
  </span>
);

export const TextArea = ({ label, hint, ...props }) => (
  <label className="block">
    {label && (
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-400">
        {label}
        {hint && <span className="text-slate-500">{hint}</span>}
      </span>
    )}
    <textarea
      rows={3}
      className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-violet-500/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/15"
      {...props}
    />
  </label>
);
