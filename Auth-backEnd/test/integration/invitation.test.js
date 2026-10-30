// Module 2 integration tests: real Postgres (isolated test schema) + real HTTP app.
// Email delivery is mocked - nothing is ever sent.
import { describe, it, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { setupTestSchema, dropTestSchema } from "./testDb.js";

let models;
let transporter;
let server;
let base;
let sentMails = [];
const u = {};
const ws = {};

const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

const call = async (method, path, user, body) => {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${tokenFor(user)}`;
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // empty body
  }
  return { status: res.status, body: json };
};

const invite = (user, workspace, body) => call("POST", `/workspaces/${workspace.id}/invitations`, user, body);

// mocked mail se raw token nikaalo (asli user ise email link se paata hai)
const tokenFromLastMail = () => {
  const mail = sentMails.at(-1);
  const match = mail.text.match(/token=([^\s]+)/);
  return decodeURIComponent(match[1]);
};

const makeUser = async (name, email, role = "user") =>
  models.User.create({
    id: crypto.randomUUID(),
    name,
    email: email || `${name.toLowerCase()}-${crypto.randomUUID()}@example.com`,
    password: "not-used-in-these-tests",
    role,
  });

const makeWorkspace = async (owner, name) => {
  const res = await call("POST", "/workspaces", owner, { name });
  assert.equal(res.status, 201);
  return res.body.workspace;
};

before(async () => {
  await setupTestSchema();
  models = await import("../../src/models/index.js");
  ({ transporter } = await import("../../src/utils/sendEmail.js"));
  const app = (await import("../../src/app.js")).default;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  u.owner = await makeUser("Owner");
  u.admin = await makeUser("Admin");
  u.member = await makeUser("Member");
  u.invitee = await makeUser("Invitee", `invitee-${crypto.randomUUID()}@example.com`);
  u.stranger = await makeUser("Stranger");
  u.otherOwner = await makeUser("OtherOwner");

  ws.main = await makeWorkspace(u.owner, "Main Workspace");
  ws.other = await makeWorkspace(u.otherOwner, "Other Workspace");
  await models.WorkspaceMember.create({ workspaceId: ws.main.id, userId: u.admin.id, role: "admin" });
  await models.WorkspaceMember.create({ workspaceId: ws.main.id, userId: u.member.id, role: "member" });
});

beforeEach(() => {
  sentMails = [];
  mock.method(transporter, "sendMail", async (mail) => {
    sentMails.push(mail);
    return { messageId: "mocked" };
  });
});

after(async () => {
  mock.restoreAll();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (models) await models.sequelize.close();
  await dropTestSchema();
});

describe("creating invitations: authorization and role rules", () => {
  it("requires authentication", async () => {
    const res = await invite(null, ws.main, { email: "x@example.com" });
    assert.equal(res.status, 401);
  });

  it("hides the workspace from non-members (404)", async () => {
    const res = await invite(u.stranger, ws.main, { email: "x@example.com" });
    assert.equal(res.status, 404);
  });

  it("does not let a regular member invite (403)", async () => {
    const res = await invite(u.member, ws.main, { email: "x@example.com" });
    assert.equal(res.status, 403);
  });

  it("does not let an admin invite another admin (403)", async () => {
    const res = await invite(u.admin, ws.main, { email: "new-admin@example.com", role: "admin" });
    assert.equal(res.status, 403);
    assert.equal(sentMails.length, 0);
  });

  it("never allows inviting someone as owner (400)", async () => {
    const res = await invite(u.owner, ws.main, { email: "boss@example.com", role: "owner" });
    assert.equal(res.status, 400);
  });

  it("lets an admin invite a member: normalizes email, emails a FRONTEND_URL link, stores only a hash", async () => {
    const res = await invite(u.admin, ws.main, { email: "  New.Member@Example.COM " });
    assert.equal(res.status, 201);
    assert.equal(res.body.emailSent, true);
    assert.equal(res.body.invitation.email, "new.member@example.com");
    assert.equal(res.body.invitation.role, "member");
    assert.equal(res.body.invitation.status, "pending");
    assert.ok(!("tokenHash" in res.body.invitation));

    assert.equal(sentMails.length, 1);
    assert.equal(sentMails[0].to, "new.member@example.com");
    const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    assert.ok(sentMails[0].text.includes(`${frontend}/invitations/accept?token=`));

    const raw = tokenFromLastMail();
    const row = await models.WorkspaceInvitation.findByPk(res.body.invitation.id, { raw: true });
    assert.equal(row.tokenHash, crypto.createHash("sha256").update(raw).digest("hex"));
    assert.ok(!Object.values(row).some((v) => String(v).includes(raw)), "raw token must not be stored");
  });

  it("lets the owner invite an admin", async () => {
    const res = await invite(u.owner, ws.main, { email: "future-admin@example.com", role: "admin" });
    assert.equal(res.status, 201);
    assert.equal(res.body.invitation.role, "admin");
  });

  it("rejects a duplicate pending invitation, case-insensitively (409)", async () => {
    const res = await invite(u.owner, ws.main, { email: "NEW.MEMBER@example.com" });
    assert.equal(res.status, 409);
    assert.equal(sentMails.length, 0);
  });

  it("rejects inviting an existing member (409)", async () => {
    const res = await invite(u.owner, ws.main, { email: u.member.email.toUpperCase() });
    assert.equal(res.status, 409);
  });

  it("keeps the invitation and reports emailSent=false when delivery fails", async () => {
    mock.method(transporter, "sendMail", async () => {
      throw new Error("SMTP down");
    });
    const res = await invite(u.owner, ws.main, { email: "smtp-fail@example.com" });
    assert.equal(res.status, 201);
    assert.equal(res.body.emailSent, false);
    assert.equal(await models.WorkspaceInvitation.count({ where: { email: "smtp-fail@example.com" } }), 1);
  });
});

describe("listing, revoking and resending", () => {
  it("lists invitations for owners and admins only, without token hashes", async () => {
    const asOwner = await call("GET", `/workspaces/${ws.main.id}/invitations`, u.owner);
    assert.equal(asOwner.status, 200);
    assert.ok(asOwner.body.count >= 3);
    assert.ok(asOwner.body.invitations.every((i) => !("tokenHash" in i)));

    assert.equal((await call("GET", `/workspaces/${ws.main.id}/invitations`, u.admin)).status, 200);
    assert.equal((await call("GET", `/workspaces/${ws.main.id}/invitations`, u.member)).status, 403);
    assert.equal((await call("GET", `/workspaces/${ws.main.id}/invitations`, u.stranger)).status, 404);
  });

  it("does not let an admin revoke an admin invitation, but the owner can", async () => {
    const created = await invite(u.owner, ws.main, { email: "admin-to-revoke@example.com", role: "admin" });
    const path = `/workspaces/${ws.main.id}/invitations/${created.body.invitation.id}/revoke`;
    assert.equal((await call("POST", path, u.admin)).status, 403);
    const res = await call("POST", path, u.owner);
    assert.equal(res.status, 200);
    assert.equal(res.body.invitation.status, "revoked");
    assert.equal((await call("POST", path, u.owner)).status, 409);
  });

  it("resend issues a new token and invalidates the old link", async () => {
    const created = await invite(u.admin, ws.main, { email: "resend-me@example.com" });
    const oldToken = tokenFromLastMail();

    const res = await call("POST", `/workspaces/${ws.main.id}/invitations/${created.body.invitation.id}/resend`, u.admin);
    assert.equal(res.status, 200);
    assert.equal(res.body.emailSent, true);
    const newToken = tokenFromLastMail();
    assert.notEqual(newToken, oldToken);

    assert.equal((await call("POST", "/invitations/preview", null, { token: oldToken })).status, 404);
    assert.equal((await call("POST", "/invitations/preview", null, { token: newToken })).status, 200);
  });

  it("cannot resend a revoked invitation", async () => {
    const created = await invite(u.owner, ws.main, { email: "revoked-resend@example.com" });
    const base = `/workspaces/${ws.main.id}/invitations/${created.body.invitation.id}`;
    await call("POST", `${base}/revoke`, u.owner);
    assert.equal((await call("POST", `${base}/resend`, u.owner)).status, 409);
  });
});

describe("cross-workspace access", () => {
  it("an owner of another workspace cannot see, revoke or resend these invitations", async () => {
    const created = await invite(u.owner, ws.main, { email: "cross@example.com" });
    const id = created.body.invitation.id;

    // via the other user's own workspace id
    assert.equal((await call("POST", `/workspaces/${ws.other.id}/invitations/${id}/revoke`, u.otherOwner)).status, 404);
    assert.equal((await call("POST", `/workspaces/${ws.other.id}/invitations/${id}/resend`, u.otherOwner)).status, 404);
    const otherList = await call("GET", `/workspaces/${ws.other.id}/invitations`, u.otherOwner);
    assert.ok(!otherList.body.invitations.some((i) => i.id === id));

    // via the real workspace id (not a member there)
    assert.equal((await call("POST", `/workspaces/${ws.main.id}/invitations/${id}/revoke`, u.otherOwner)).status, 404);
    assert.equal((await call("GET", `/workspaces/${ws.main.id}/invitations`, u.otherOwner)).status, 404);

    const row = await models.WorkspaceInvitation.findByPk(id);
    assert.equal(row.status, "pending");
  });
});

describe("previewing and accepting", () => {
  let token;

  before(async () => {
    sentMails = [];
    mock.method(transporter, "sendMail", async (mail) => {
      sentMails.push(mail);
      return {};
    });
    // invitee ka email alag case mein - match case-insensitive hona chahiye
    const res = await invite(u.owner, ws.main, { email: u.invitee.email.toUpperCase() });
    assert.equal(res.status, 201);
    token = tokenFromLastMail();
  });

  it("preview works without login and returns no ids or hashes", async () => {
    const res = await call("POST", "/invitations/preview", null, { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.invitation.workspaceName, "Main Workspace");
    assert.equal(res.body.invitation.status, "pending");
    assert.equal(res.body.invitation.email, u.invitee.email);
    assert.equal(res.body.accountExists, true);
    assert.ok(!("tokenHash" in res.body.invitation));
    assert.ok(!("id" in res.body.invitation));
  });

  it("rejects an invalid token (404)", async () => {
    const bad = crypto.randomBytes(32).toString("base64url");
    assert.equal((await call("POST", "/invitations/preview", null, { token: bad })).status, 404);
    assert.equal((await call("POST", "/invitations/accept", u.invitee, { token: bad })).status, 404);
  });

  it("requires login to accept (401)", async () => {
    assert.equal((await call("POST", "/invitations/accept", null, { token })).status, 401);
  });

  it("rejects a signed-in user whose email does not match (403) without consuming the invitation", async () => {
    const res = await call("POST", "/invitations/accept", u.stranger, { token });
    assert.equal(res.status, 403);
    assert.equal(await models.WorkspaceMember.count({ where: { workspaceId: ws.main.id, userId: u.stranger.id } }), 0);
    const preview = await call("POST", "/invitations/preview", null, { token });
    assert.equal(preview.body.invitation.status, "pending");
  });

  it("accepts for the matching user and creates the membership with the invited role", async () => {
    const before = await call("GET", `/workspaces/${ws.main.id}`, u.invitee);
    assert.equal(before.status, 404);

    const res = await call("POST", "/invitations/accept", u.invitee, { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.workspace.id, ws.main.id);
    assert.equal(res.body.workspace.role, "member");
    assert.equal(res.body.alreadyMember, false);

    const membership = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.invitee.id } });
    assert.equal(membership.role, "member");
    const after = await call("GET", `/workspaces/${ws.main.id}`, u.invitee);
    assert.equal(after.status, 200);

    // invitee ab bhi doosre workspace mein nahi ja sakta
    assert.equal((await call("GET", `/workspaces/${ws.other.id}`, u.invitee)).status, 404);
  });

  it("an accepted invitation cannot be reused (410)", async () => {
    const res = await call("POST", "/invitations/accept", u.invitee, { token });
    assert.equal(res.status, 410);
    const preview = await call("POST", "/invitations/preview", null, { token });
    assert.equal(preview.body.invitation.status, "accepted");
  });

  it("a revoked invitation cannot be accepted (410)", async () => {
    const target = await makeUser("RevokedGuy");
    const created = await invite(u.owner, ws.main, { email: target.email });
    const revokedToken = tokenFromLastMail();
    await call("POST", `/workspaces/${ws.main.id}/invitations/${created.body.invitation.id}/revoke`, u.owner);
    const res = await call("POST", "/invitations/accept", target, { token: revokedToken });
    assert.equal(res.status, 410);
    assert.equal(await models.WorkspaceMember.count({ where: { userId: target.id } }), 0);
  });

  it("an expired invitation cannot be accepted (410) and is marked expired", async () => {
    const target = await makeUser("LateGuy");
    const created = await invite(u.owner, ws.main, { email: target.email });
    const expiredToken = tokenFromLastMail();
    await models.WorkspaceInvitation.update(
      { expiresAt: new Date(Date.now() - 60_000) },
      { where: { id: created.body.invitation.id } },
    );
    const res = await call("POST", "/invitations/accept", target, { token: expiredToken });
    assert.equal(res.status, 410);
    const row = await models.WorkspaceInvitation.findByPk(created.body.invitation.id);
    assert.equal(row.status, "expired");
    assert.equal(await models.WorkspaceMember.count({ where: { userId: target.id } }), 0);

    // expired invitation ke baad nayi invitation bhej sakte hain
    const again = await invite(u.owner, ws.main, { email: target.email });
    assert.equal(again.status, 201);
  });

  it("accepting while already a member consumes the invitation without changing the role", async () => {
    const target = await makeUser("AlreadyIn");
    const created = await invite(u.owner, ws.main, { email: target.email, role: "admin" });
    const t = tokenFromLastMail();
    await models.WorkspaceMember.create({ workspaceId: ws.main.id, userId: target.id, role: "member" });

    const res = await call("POST", "/invitations/accept", target, { token: t });
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyMember, true);
    assert.equal(res.body.workspace.role, "member");
    const row = await models.WorkspaceInvitation.findByPk(created.body.invitation.id);
    assert.equal(row.status, "accepted");
  });

  it("concurrent accepts of the same token create exactly one membership", async () => {
    const target = await makeUser("Racer");
    await invite(u.owner, ws.main, { email: target.email });
    const t = tokenFromLastMail();
    const results = await Promise.all([
      call("POST", "/invitations/accept", target, { token: t }),
      call("POST", "/invitations/accept", target, { token: t }),
    ]);
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [200, 410]);
    assert.equal(await models.WorkspaceMember.count({ where: { workspaceId: ws.main.id, userId: target.id } }), 1);
  });
});
