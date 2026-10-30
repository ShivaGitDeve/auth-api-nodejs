// Invitation token ko login/signup ke beech sambhal ke rakhna.
// sessionStorage: sirf is tab tak, browser band hote hi hat jaata hai.
const KEY = "teamflow.pendingInviteToken";

export const ACCEPT_PATH = "/invitations/accept";

export const savePendingInvite = (token) => {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // storage blocked - token sirf memory mein
  }
};

export const readPendingInvite = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

// open redirect se bachne ke liye sirf apni app ke relative paths
export const safeNext = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : null;

// login/signup links jo wapas acceptance page par laayein
export const authQuery = ({ next, email }) => {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (email) params.set("email", email);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};
