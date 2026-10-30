import { PRIORITY, STATUS } from "../project/projectMeta";

export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.planning;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${p.className}`} title={`${p.label} priority`}>
      <span className="flex items-end gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-1 rounded-sm ${i <= p.bars ? "bg-current" : "bg-white/15"}`}
            style={{ height: `${4 + i * 2}px` }}
          />
        ))}
      </span>
      {p.label}
    </span>
  );
};

export const ProjectKey = ({ value, className = "" }) => (
  <span className={`rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-slate-300 ${className}`}>
    {value}
  </span>
);

export const SelectField = ({ label, children, className = "", ...props }) => (
  <label className={`block ${className}`}>
    {label && <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>}
    <select
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-60 [&>option]:bg-[#0d0d1c]"
      {...props}
    >
      {children}
    </select>
  </label>
);

export const DateField = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
    <input
      type="date"
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-[11px] text-sm text-white outline-none transition [color-scheme:dark] focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/15"
      {...props}
    />
  </label>
);
