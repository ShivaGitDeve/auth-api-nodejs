// backend (utils/projectMeta.js) jaisi hi values

export const STATUS = {
  planning: { label: "Planning", className: "border-sky-400/30 bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  active: { label: "Active", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  on_hold: { label: "On hold", className: "border-amber-400/30 bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  completed: { label: "Completed", className: "border-violet-400/30 bg-violet-500/10 text-violet-300", dot: "bg-violet-400" },
  archived: { label: "Archived", className: "border-slate-400/20 bg-white/5 text-slate-400", dot: "bg-slate-500" },
};

// "archived" sirf archive action se
export const EDITABLE_STATUSES = ["planning", "active", "on_hold", "completed"];

export const PRIORITY = {
  low: { label: "Low", className: "text-slate-300", bars: 1 },
  medium: { label: "Medium", className: "text-sky-300", bars: 2 },
  high: { label: "High", className: "text-orange-300", bars: 3 },
  urgent: { label: "Urgent", className: "text-rose-300", bars: 4 },
};

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const KEY_PATTERN = "[A-Za-z][A-Za-z0-9]{1,9}";

// backend ke suggestProjectKey jaisa (sirf preview ke liye; asli key server banata hai)
export const suggestKey = (name) => {
  const words = String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let key = words.length >= 2 ? words.map((w) => w[0]).join("").slice(0, 4) : (words[0] || "").slice(0, 3);
  key = key.replace(/^[0-9]+/, "");
  if (key.length < 2) key = (key + "PRJ").slice(0, 3);
  return key;
};

export const formatDate = (value) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

export const isOverdue = (project) => {
  if (!project.dueDate || ["completed", "archived"].includes(project.status)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return project.dueDate < today;
};
