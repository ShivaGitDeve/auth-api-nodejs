import crypto from "crypto";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 din

export const hashInvitationToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

// raw token sirf email link mein jaata hai; DB mein sirf hash
export const createInvitationToken = () => {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashInvitationToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  };
};
