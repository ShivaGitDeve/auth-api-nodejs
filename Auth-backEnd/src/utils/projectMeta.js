// Project ke allowed values + chhote helpers (validation, controller aur tests share karte hain)

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"];
// "archived" sirf archive endpoint se set hota hai
export const EDITABLE_PROJECT_STATUSES = PROJECT_STATUSES.filter((s) => s !== "archived");
export const PROJECT_PRIORITIES = ["low", "medium", "high", "urgent"];

export const PROJECT_KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/;

export const normalizeProjectKey = (key) => String(key).trim().toUpperCase();

// naam se key: "Mobile App Redesign" -> "MAR", "Website" -> "WEB"
export const suggestProjectKey = (name) => {
  const words = String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let key =
    words.length >= 2
      ? words.map((w) => w[0]).join("").slice(0, 4)
      : (words[0] || "").slice(0, 3);
  key = key.replace(/^[0-9]+/, "");
  if (key.length < 2) key = (key + "PRJ").slice(0, 3);
  return key;
};

// "YYYY-MM-DD" strings ko seedha compare kar sakte hain
export const isValidDateRange = (startDate, dueDate) =>
  !startDate || !dueDate || String(dueDate) >= String(startDate);

// project-level permission: workspace owner/admin ya project owner
export const canManageProject = (membership, project) =>
  ["owner", "admin"].includes(membership?.role) ||
  Boolean(project?.ownerMemberId && project.ownerMemberId === membership?.id);

// delete aur ownership transfer sirf workspace owner/admin
export const canAdministerProject = (membership) => ["owner", "admin"].includes(membership?.role);
