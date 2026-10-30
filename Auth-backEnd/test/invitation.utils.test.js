import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_TTL_MS,
} from "../src/utils/invitationToken.js";
import { canManageInviteRole, INVITABLE_ROLES } from "../src/utils/workspaceRoles.js";
import { createInvitationSchema } from "../src/validation/invitation-validation.js";

describe("invitation tokens", () => {
  it("creates a long random token and stores only its SHA-256 hash", () => {
    const { token, tokenHash, expiresAt } = createInvitationToken();
    assert.ok(token.length >= 40);
    assert.match(tokenHash, /^[0-9a-f]{64}$/);
    assert.notEqual(tokenHash, token);
    assert.equal(hashInvitationToken(token), tokenHash);
    const ttl = expiresAt.getTime() - Date.now();
    assert.ok(ttl > INVITATION_TTL_MS - 5000 && ttl <= INVITATION_TTL_MS);
  });

  it("never repeats tokens", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => createInvitationToken().token));
    assert.equal(tokens.size, 200);
  });
});

describe("invite role permissions", () => {
  it("owner can invite admins and members", () => {
    assert.ok(canManageInviteRole("owner", "admin"));
    assert.ok(canManageInviteRole("owner", "member"));
  });

  it("admin can invite only members", () => {
    assert.ok(canManageInviteRole("admin", "member"));
    assert.ok(!canManageInviteRole("admin", "admin"));
  });

  it("members and unknown roles cannot invite", () => {
    assert.ok(!canManageInviteRole("member", "member"));
    assert.ok(!canManageInviteRole(undefined, "member"));
  });

  it("ownership can never be granted by invitation", () => {
    assert.ok(!INVITABLE_ROLES.includes("owner"));
    assert.ok(!canManageInviteRole("owner", "owner"));
    const { error } = createInvitationSchema.validate({ email: "a@example.com", role: "owner" });
    assert.ok(error);
  });
});
