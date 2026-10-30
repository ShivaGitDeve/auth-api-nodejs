// Module 1 integration tests: real Postgres (isolated test schema) + real HTTP app.
import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { setupTestSchema, dropTestSchema } from "./testDb.js";

let app;
let models;
let server;
let base;
const users = {};

const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

const call = async (method, path, user, body) => {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${tokenFor(user)}`;
  const res = await fetch(`${base}/api/workspaces${path}`, {
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

const makeUser = async (name, role = "user") =>
  models.User.create({
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase()}-${crypto.randomUUID()}@example.com`,
    password: "not-used-in-these-tests",
    role,
  });

before(async () => {
  await setupTestSchema();
  models = await import("../../src/models/index.js");
  app = (await import("../../src/app.js")).default;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  users.owner = await makeUser("Owner");
  users.member = await makeUser("Member");
  users.wsAdmin = await makeUser("WsAdmin");
  users.outsider = await makeUser("Outsider");
  users.globalAdmin = await makeUser("GlobalAdm", "admin");
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (models) await models.sequelize.close();
  await dropTestSchema();
});

describe("authentication", () => {
  it("rejects requests without a token", async () => {
    const res = await call("GET", "", null);
    assert.equal(res.status, 401);
  });
});

describe("workspace creation", () => {
  it("creates a workspace and makes the creator its owner", async () => {
    const res = await call("POST", "", users.owner, { name: "Acme Inc", description: "  Main org  " });
    assert.equal(res.status, 201);
    assert.equal(res.body.workspace.slug, "acme-inc");
    assert.equal(res.body.workspace.role, "owner");
    assert.equal(res.body.workspace.memberCount, 1);
    assert.equal(res.body.workspace.description, "Main org");

    const rows = await models.WorkspaceMember.findAll({ where: { workspaceId: res.body.workspace.id } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId, users.owner.id);
    assert.equal(rows[0].role, "owner");
    users.acme = res.body.workspace;
  });

  it("generates a unique slug when the name is reused", async () => {
    const res = await call("POST", "", users.outsider, { name: "Acme Inc" });
    assert.equal(res.status, 201);
    assert.match(res.body.workspace.slug, /^acme-inc-[0-9a-f]{4}$/);
    users.otherAcme = res.body.workspace;
  });

  it("returns 409 for an explicitly requested slug that is taken", async () => {
    const res = await call("POST", "", users.member, { name: "Copycat", slug: "acme-inc" });
    assert.equal(res.status, 409);
  });

  it("validates the request body", async () => {
    const short = await call("POST", "", users.owner, { name: "A" });
    assert.equal(short.status, 400);
    const badSlug = await call("POST", "", users.owner, { name: "Valid name", slug: "Bad Slug!" });
    assert.equal(badSlug.status, 400);
  });

  it("rolls back the workspace if adding the owner membership fails", async () => {
    const before = await models.Workspace.count({ where: { name: "Rollback Test" } });
    mock.method(models.WorkspaceMember, "create", async () => {
      throw new Error("simulated membership failure");
    });
    try {
      const res = await call("POST", "", users.owner, { name: "Rollback Test" });
      assert.equal(res.status, 500);
    } finally {
      mock.restoreAll();
    }
    const afterCount = await models.Workspace.count({ where: { name: "Rollback Test" } });
    assert.equal(afterCount, before);
  });
});

describe("membership and roles", () => {
  before(async () => {
    await models.WorkspaceMember.create({ workspaceId: users.acme.id, userId: users.member.id, role: "member" });
    await models.WorkspaceMember.create({ workspaceId: users.acme.id, userId: users.wsAdmin.id, role: "admin" });
  });

  it("lets every member view the workspace with its member list", async () => {
    for (const u of [users.owner, users.wsAdmin, users.member]) {
      const res = await call("GET", `/${users.acme.id}`, u);
      assert.equal(res.status, 200, `${u.name} should see the workspace`);
      assert.equal(res.body.members.length, 3);
    }
    const asMember = await call("GET", `/${users.acme.id}`, users.member);
    assert.equal(asMember.body.workspace.role, "member");
    const owner = asMember.body.members.find((m) => m.role === "owner");
    assert.equal(owner.userId, users.owner.id);
    assert.ok(!("password" in owner));
  });

  it("allows owner and admin, but not member, to update settings", async () => {
    const asMember = await call("PATCH", `/${users.acme.id}`, users.member, { name: "Hijacked" });
    assert.equal(asMember.status, 403);

    const asAdmin = await call("PATCH", `/${users.acme.id}`, users.wsAdmin, { description: "Updated by admin" });
    assert.equal(asAdmin.status, 200);
    assert.equal(asAdmin.body.workspace.description, "Updated by admin");

    const asOwner = await call("PATCH", `/${users.acme.id}`, users.owner, { name: "Acme Corp", slug: "acme-corp" });
    assert.equal(asOwner.status, 200);
    assert.equal(asOwner.body.workspace.name, "Acme Corp");
    assert.equal(asOwner.body.workspace.slug, "acme-corp");
    users.acme = asOwner.body.workspace;
  });

  it("rejects an update to a slug used by another workspace", async () => {
    const res = await call("PATCH", `/${users.acme.id}`, users.owner, { slug: users.otherAcme.slug });
    assert.equal(res.status, 409);
  });

  it("rejects an empty update", async () => {
    const res = await call("PATCH", `/${users.acme.id}`, users.owner, {});
    assert.equal(res.status, 400);
  });

  it("allows only the owner to delete", async () => {
    const asMember = await call("DELETE", `/${users.acme.id}`, users.member, { confirm: users.acme.name });
    assert.equal(asMember.status, 403);
    const asAdmin = await call("DELETE", `/${users.acme.id}`, users.wsAdmin, { confirm: users.acme.name });
    assert.equal(asAdmin.status, 403);
    const wrongConfirm = await call("DELETE", `/${users.acme.id}`, users.owner, { confirm: "acme corp" });
    assert.equal(wrongConfirm.status, 400);
    assert.equal(await models.Workspace.count({ where: { id: users.acme.id } }), 1);
  });
});

describe("cross-workspace isolation", () => {
  it("lists only the caller's own workspaces", async () => {
    const owner = await call("GET", "", users.owner);
    assert.deepEqual(owner.body.workspaces.map((w) => w.id), [users.acme.id]);
    assert.equal(owner.body.workspaces[0].memberCount, 3);

    const outsider = await call("GET", "", users.outsider);
    assert.deepEqual(outsider.body.workspaces.map((w) => w.id), [users.otherAcme.id]);
  });

  it("hides another workspace completely (404 for read, update and delete)", async () => {
    const id = users.otherAcme.id;
    assert.equal((await call("GET", `/${id}`, users.owner)).status, 404);
    assert.equal((await call("PATCH", `/${id}`, users.owner, { name: "Taken over" })).status, 404);
    assert.equal((await call("DELETE", `/${id}`, users.owner, { confirm: "Acme Inc" })).status, 404);
    const still = await models.Workspace.findByPk(id);
    assert.equal(still.name, "Acme Inc");
  });

  it("does not let a global admin into a workspace they are not a member of", async () => {
    const res = await call("GET", `/${users.acme.id}`, users.globalAdmin);
    assert.equal(res.status, 404);
    const list = await call("GET", "", users.globalAdmin);
    assert.equal(list.body.count, 0);
  });

  it("returns 404 for malformed and unknown ids", async () => {
    assert.equal((await call("GET", "/not-a-uuid", users.owner)).status, 404);
    assert.equal((await call("GET", `/${crypto.randomUUID()}`, users.owner)).status, 404);
  });
});

describe("deletion and cascades", () => {
  it("owner deletes the workspace and all its memberships", async () => {
    const res = await call("DELETE", `/${users.acme.id}`, users.owner, { confirm: users.acme.name });
    assert.equal(res.status, 200);
    assert.equal(await models.Workspace.count({ where: { id: users.acme.id } }), 0);
    assert.equal(await models.WorkspaceMember.count({ where: { workspaceId: users.acme.id } }), 0);

    const memberList = await call("GET", "", users.member);
    assert.equal(memberList.body.count, 0);
  });

  it("deleting a user removes their memberships but keeps the workspace", async () => {
    await models.User.destroy({ where: { id: users.outsider.id } });
    const ws = await models.Workspace.findByPk(users.otherAcme.id);
    assert.ok(ws, "workspace still exists");
    assert.equal(ws.createdById, null);
    assert.equal(await models.WorkspaceMember.count({ where: { userId: users.outsider.id } }), 0);
  });
});
