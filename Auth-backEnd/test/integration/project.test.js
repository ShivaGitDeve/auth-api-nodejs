// Module 4 integration tests: real Postgres (isolated test schema) + real HTTP app.
import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { setupTestSchema, dropTestSchema } from "./testDb.js";

let models;
let server;
let base;
const u = {};
const ws = {};
const p = {};
const teams = {};

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

const projects = (workspace) => `/workspaces/${workspace.id}/projects`;
const projectPath = (workspace, project) => `${projects(workspace)}/${project.id}`;

const makeUser = async (name, role = "user") =>
  models.User.create({
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase()}-${crypto.randomUUID()}@example.com`,
    password: "not-used-in-these-tests",
    role,
  });

const join = (workspace, user, role) =>
  models.WorkspaceMember.create({ workspaceId: workspace.id, userId: user.id, role });

const sqlError = async (sql, replacements) => {
  try {
    await models.sequelize.query(sql, { replacements });
    return null;
  } catch (error) {
    return error.parent?.code || error.original?.code || error.message;
  }
};

before(async () => {
  await setupTestSchema();
  models = await import("../../src/models/index.js");
  const app = (await import("../../src/app.js")).default;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  u.owner = await makeUser("Owner");
  u.admin = await makeUser("Admin");
  u.pm = await makeUser("ProjectLead");
  u.member = await makeUser("Member");
  u.member2 = await makeUser("Member2");
  u.outsider = await makeUser("Outsider");
  u.otherOwner = await makeUser("OtherOwner");
  u.globalAdmin = await makeUser("GlobalAdm", "admin");

  ws.main = (await call("POST", "/workspaces", u.owner, { name: "Main" })).body.workspace;
  ws.other = (await call("POST", "/workspaces", u.otherOwner, { name: "Other" })).body.workspace;
  await join(ws.main, u.admin, "admin");
  await join(ws.main, u.pm, "member");
  await join(ws.main, u.member, "member");
  await join(ws.main, u.member2, "member");

  teams.main = (await call("POST", `/workspaces/${ws.main.id}/teams`, u.owner, { name: "Design" })).body.team;
  teams.other = (await call("POST", `/workspaces/${ws.other.id}/teams`, u.otherOwner, { name: "Design" })).body.team;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (models) await models.sequelize.close();
  await dropTestSchema();
});

describe("access and creation", () => {
  it("requires authentication and workspace membership", async () => {
    assert.equal((await call("GET", projects(ws.main), null)).status, 401);
    assert.equal((await call("GET", projects(ws.main), u.outsider)).status, 404);
    assert.equal((await call("GET", projects(ws.main), u.globalAdmin)).status, 404);
  });

  it("only workspace owners/admins can create projects", async () => {
    const res = await call("POST", projects(ws.main), u.member, { name: "Sneaky" });
    assert.equal(res.status, 403);
  });

  it("creates a project; creator becomes owner and first member in one go", async () => {
    const res = await call("POST", projects(ws.main), u.admin, {
      name: "Website Revamp",
      key: "web",
      description: " Marketing site ",
      status: "active",
      priority: "high",
      startDate: "2026-01-01",
      dueDate: "2026-03-31",
      teamId: teams.main.id,
    });
    assert.equal(res.status, 201);
    const project = res.body.project;
    assert.equal(project.key, "WEB");
    assert.equal(project.description, "Marketing site");
    assert.equal(project.owner.userId, u.admin.id);
    assert.equal(project.team.id, teams.main.id);
    assert.equal(project.memberCount, 1);
    assert.equal(project.isMember, true);
    p.web = project;

    const row = await models.Project.findByPk(project.id);
    const adminMembership = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.admin.id } });
    assert.equal(row.ownerMemberId, adminMembership.id);
    assert.equal(await models.ProjectMember.count({ where: { projectId: project.id, workspaceMemberId: adminMembership.id } }), 1);
  });

  it("generates a key when none is given and avoids collisions", async () => {
    const a = await call("POST", projects(ws.main), u.owner, { name: "Mobile App" });
    assert.equal(a.status, 201);
    assert.equal(a.body.project.key, "MA");
    assert.equal(a.body.project.status, "planning");
    assert.equal(a.body.project.priority, "medium");
    p.mobile = a.body.project;

    const b = await call("POST", projects(ws.main), u.owner, { name: "Marketing Analytics" });
    assert.equal(b.body.project.key, "MA2");
    p.analytics = b.body.project;
  });

  it("rolls back the project if the owner membership cannot be created", async () => {
    mock.method(models.ProjectMember, "create", async () => {
      throw new Error("simulated failure");
    });
    try {
      const res = await call("POST", projects(ws.main), u.owner, { name: "Rollback Me", key: "RBK" });
      assert.equal(res.status, 500);
    } finally {
      mock.restoreAll();
    }
    assert.equal(await models.Project.count({ where: { key: "RBK" } }), 0);
  });
});

describe("validation and key uniqueness", () => {
  it("rejects invalid input", async () => {
    const bad = [
      { name: "x" },
      { name: "Ok name", key: "1AB" },
      { name: "Ok name", status: "archived" },
      { name: "Ok name", priority: "critical" },
      { name: "Ok name", startDate: "2026-13-01" },
      { name: "Ok name", startDate: "2026-05-01", dueDate: "2026-04-01" },
      { name: "Ok name", workspaceId: ws.other.id },
    ];
    for (const body of bad) {
      const res = await call("POST", projects(ws.main), u.owner, body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  it("enforces key uniqueness per workspace (case-insensitive input)", async () => {
    assert.equal((await call("POST", projects(ws.main), u.owner, { name: "Dup", key: "Web" })).status, 409);
    const other = await call("POST", projects(ws.other), u.otherOwner, { name: "Same key elsewhere", key: "WEB" });
    assert.equal(other.status, 201);
    p.otherWeb = other.body.project;
  });

  it("rejects a team from another workspace or a random team id", async () => {
    assert.equal((await call("POST", projects(ws.main), u.owner, { name: "Bad team", teamId: teams.other.id })).status, 400);
    assert.equal((await call("POST", projects(ws.main), u.owner, { name: "Bad team", teamId: crypto.randomUUID() })).status, 400);
    assert.equal((await call("PATCH", projectPath(ws.main, p.web), u.owner, { teamId: teams.other.id })).status, 400);
  });

  it("checks date order against existing values on update", async () => {
    // existing start 2026-01-01
    const res = await call("PATCH", projectPath(ws.main, p.web), u.owner, { dueDate: "2025-12-31" });
    assert.equal(res.status, 400);
  });
});

describe("viewing and updating", () => {
  it("every workspace member can list and view projects", async () => {
    const list = await call("GET", projects(ws.main), u.member);
    assert.equal(list.status, 200);
    assert.deepEqual(new Set(list.body.projects.map((x) => x.key)), new Set(["WEB", "MA", "MA2"]));
    assert.ok(list.body.projects.every((x) => x.permissions.canManage === false));

    const details = await call("GET", projectPath(ws.main, p.web), u.member);
    assert.equal(details.status, 200);
    assert.equal(details.body.members.length, 1);
    assert.equal(details.body.members[0].isOwner, true);
    assert.ok(!("password" in details.body.members[0]));

    const filtered = await call("GET", `${projects(ws.main)}?status=active`, u.member);
    assert.deepEqual(filtered.body.projects.map((x) => x.key), ["WEB"]);
    assert.equal((await call("GET", `${projects(ws.main)}?status=nope`, u.member)).status, 400);
  });

  it("a regular member cannot update, archive, delete or manage members", async () => {
    const path = projectPath(ws.main, p.web);
    assert.equal((await call("PATCH", path, u.member, { name: "Hacked" })).status, 403);
    assert.equal((await call("POST", `${path}/archive`, u.member)).status, 403);
    assert.equal((await call("DELETE", path, u.member, { confirm: "WEB" })).status, 403);
    assert.equal((await call("POST", `${path}/members`, u.member, { userId: u.member.id })).status, 403);
  });

  it("workspace owner/admin can update fields, status and priority", async () => {
    const res = await call("PATCH", projectPath(ws.main, p.web), u.owner, {
      name: "Website 2.0",
      status: "on_hold",
      priority: "urgent",
      teamId: null,
      key: "site",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.project.name, "Website 2.0");
    assert.equal(res.body.project.status, "on_hold");
    assert.equal(res.body.project.priority, "urgent");
    assert.equal(res.body.project.team, null);
    assert.equal(res.body.project.key, "SITE");
    assert.equal((await call("PATCH", projectPath(ws.main, p.web), u.owner, { key: "MA" })).status, 409);
  });

  it("transferring ownership makes the new owner a member; only workspace owner/admin may do it", async () => {
    const path = projectPath(ws.main, p.mobile);
    const res = await call("PATCH", path, u.admin, { ownerUserId: u.pm.id });
    assert.equal(res.status, 200);
    assert.equal(res.body.project.owner.userId, u.pm.id);
    const details = await call("GET", path, u.pm);
    assert.ok(details.body.members.some((m) => m.userId === u.pm.id && m.isOwner));
    assert.equal(details.body.project.permissions.canManage, true);
    assert.equal(details.body.project.permissions.canAdminister, false);

    // project owner (workspace member) ownership transfer nahi kar sakta
    assert.equal((await call("PATCH", path, u.pm, { ownerUserId: u.member.id })).status, 403);
    // owner workspace ka member hona chahiye
    assert.equal((await call("PATCH", path, u.owner, { ownerUserId: u.outsider.id })).status, 400);
  });

  it("the project owner can update their own project but not delete it", async () => {
    const path = projectPath(ws.main, p.mobile);
    const res = await call("PATCH", path, u.pm, { status: "active", priority: "low" });
    assert.equal(res.status, 200);
    assert.equal((await call("DELETE", path, u.pm, { confirm: "MA" })).status, 403);
    // doosre project par koi haq nahi
    assert.equal((await call("PATCH", projectPath(ws.main, p.analytics), u.pm, { name: "Mine now" })).status, 403);
  });
});

describe("project members", () => {
  const members = () => `${projectPath(ws.main, p.mobile)}/members`;

  it("project owner can add workspace members; duplicates are rejected", async () => {
    const res = await call("POST", members(), u.pm, { userId: u.member.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.member.userId, u.member.id);
    assert.equal((await call("POST", members(), u.owner, { userId: u.member.id })).status, 409);

    const list = await call("GET", members(), u.member2);
    assert.equal(list.status, 200);
    assert.deepEqual(new Set(list.body.members.map((m) => m.userId)), new Set([u.owner.id, u.pm.id, u.member.id]));
  });

  it("rejects users who are not in this workspace", async () => {
    assert.equal((await call("POST", members(), u.owner, { userId: u.outsider.id })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: u.otherOwner.id })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: crypto.randomUUID() })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: "bad" })).status, 400);
  });

  it("removes members, but never the current project owner", async () => {
    assert.equal((await call("DELETE", `${members()}/${u.pm.id}`, u.owner)).status, 409);
    assert.equal((await call("DELETE", `${members()}/${u.member.id}`, u.pm)).status, 200);
    assert.equal((await call("DELETE", `${members()}/${u.member.id}`, u.pm)).status, 404);
    assert.equal((await call("DELETE", `${members()}/not-a-uuid`, u.pm)).status, 404);
  });
});

describe("archive, unarchive and delete", () => {
  it("archived projects are hidden by default and read-only", async () => {
    const path = projectPath(ws.main, p.analytics);
    const res = await call("POST", `${path}/archive`, u.admin);
    assert.equal(res.status, 200);
    assert.equal(res.body.project.status, "archived");
    assert.ok(res.body.project.archivedAt);
    assert.equal((await call("POST", `${path}/archive`, u.admin)).status, 409);

    const list = await call("GET", projects(ws.main), u.member);
    assert.ok(!list.body.projects.some((x) => x.id === p.analytics.id));
    const all = await call("GET", `${projects(ws.main)}?includeArchived=true`, u.member);
    assert.ok(all.body.projects.some((x) => x.id === p.analytics.id));
    const archivedOnly = await call("GET", `${projects(ws.main)}?status=archived`, u.member);
    assert.deepEqual(archivedOnly.body.projects.map((x) => x.id), [p.analytics.id]);

    assert.equal((await call("PATCH", path, u.owner, { name: "Edit archived" })).status, 409);
    assert.equal((await call("POST", `${path}/members`, u.owner, { userId: u.member.id })).status, 409);
  });

  it("unarchive restores the project with the requested status", async () => {
    const path = projectPath(ws.main, p.analytics);
    const res = await call("POST", `${path}/unarchive`, u.owner, { status: "completed" });
    assert.equal(res.status, 200);
    assert.equal(res.body.project.status, "completed");
    assert.equal(res.body.project.archivedAt, null);
    assert.equal((await call("POST", `${path}/unarchive`, u.owner)).status, 409);
  });

  it("delete requires the project key as confirmation", async () => {
    const path = projectPath(ws.main, p.analytics);
    assert.equal((await call("DELETE", path, u.owner, { confirm: "WRONG" })).status, 400);
    assert.equal((await call("DELETE", path, u.owner, {})).status, 400);
    const res = await call("DELETE", path, u.admin, { confirm: "ma2" });
    assert.equal(res.status, 200);
    assert.equal(await models.Project.count({ where: { id: p.analytics.id } }), 0);
    assert.equal(await models.ProjectMember.count({ where: { projectId: p.analytics.id } }), 0);
  });
});

describe("cross-workspace access", () => {
  it("another workspace's project id is not reachable through your workspace", async () => {
    const path = `${projects(ws.main)}/${p.otherWeb.id}`;
    assert.equal((await call("GET", path, u.owner)).status, 404);
    assert.equal((await call("PATCH", path, u.owner, { name: "Stolen" })).status, 404);
    assert.equal((await call("POST", `${path}/archive`, u.owner)).status, 404);
    assert.equal((await call("DELETE", path, u.owner, { confirm: "WEB" })).status, 404);
    assert.equal((await call("POST", `${path}/members`, u.owner, { userId: u.member.id })).status, 404);
  });

  it("non-members cannot reach the other workspace's projects directly", async () => {
    const path = projectPath(ws.other, p.otherWeb);
    assert.equal((await call("GET", path, u.owner)).status, 404);
    assert.equal((await call("GET", `${projects(ws.main)}/not-a-uuid`, u.owner)).status, 404);
    assert.equal((await models.Project.findByPk(p.otherWeb.id)).name, "Same key elsewhere");
  });
});

describe("database constraints", () => {
  const insert = (fields) =>
    sqlError(
      `INSERT INTO projects (id, "workspaceId", name, key, status, priority, "startDate", "dueDate", "teamId", "ownerMemberId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :ws, 'Raw', :key, :status, :priority, :start, :due, :team, :owner, now(), now())`,
      { ws: ws.main.id, key: "RAW", status: "planning", priority: "low", start: null, due: null, team: null, owner: null, ...fields },
    );

  it("rejects invalid status, priority, key format and date range at the DB level", async () => {
    assert.equal(await insert({ status: "done" }), "23514");
    assert.equal(await insert({ priority: "critical" }), "23514");
    assert.equal(await insert({ key: "raw" }), "23514");
    assert.equal(await insert({ start: "2026-05-01", due: "2026-04-01" }), "23514");
  });

  it("rejects a duplicate key in the same workspace", async () => {
    assert.equal(await insert({ key: "SITE" }), "23505");
  });

  it("rejects a team or owner from another workspace (composite FKs)", async () => {
    assert.equal(await insert({ key: "RAW1", team: teams.other.id }), "23503");
    const otherOwnerMembership = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.other.id } });
    assert.equal(await insert({ key: "RAW2", owner: otherOwnerMembership.id }), "23503");
  });

  it("rejects a project membership that crosses workspaces", async () => {
    const otherMembership = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.other.id } });
    const code = await sqlError(
      `INSERT INTO project_members (id, "projectId", "workspaceMemberId", "workspaceId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :project, :wm, :ws, now(), now())`,
      { project: p.web.id, wm: otherMembership.id, ws: ws.main.id },
    );
    assert.equal(code, "23503");
  });
});

describe("cleanup behaviour", () => {
  it("deleting a team keeps the project and just clears teamId", async () => {
    const team = (await call("POST", `/workspaces/${ws.main.id}/teams`, u.owner, { name: "Temp Team" })).body.team;
    await call("PATCH", projectPath(ws.main, p.web), u.owner, { teamId: team.id });
    await call("DELETE", `/workspaces/${ws.main.id}/teams/${team.id}`, u.owner);
    const row = await models.Project.findByPk(p.web.id);
    assert.ok(row);
    assert.equal(row.teamId, null);
    assert.equal(row.workspaceId, ws.main.id);
  });

  it("removing the project owner from the workspace keeps the project and clears the owner", async () => {
    const wm = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.pm.id } });
    await wm.destroy();
    const row = await models.Project.findByPk(p.mobile.id);
    assert.ok(row);
    assert.equal(row.ownerMemberId, null);
    assert.equal(await models.ProjectMember.count({ where: { workspaceMemberId: wm.id } }), 0);
    // ab sirf workspace owner/admin manage kar sakte hain
    const details = await call("GET", projectPath(ws.main, p.mobile), u.member);
    assert.equal(details.body.project.owner, null);
  });

  it("deleting a user removes their project memberships", async () => {
    await call("POST", `${projectPath(ws.main, p.web)}/members`, u.owner, { userId: u.member2.id });
    const wm = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.member2.id } });
    await models.User.destroy({ where: { id: u.member2.id } });
    assert.equal(await models.ProjectMember.count({ where: { workspaceMemberId: wm.id } }), 0);
  });

  it("deleting a workspace removes its projects and project members only", async () => {
    const res = await call("DELETE", `/workspaces/${ws.main.id}`, u.owner, { confirm: ws.main.name });
    assert.equal(res.status, 200);
    assert.equal(await models.Project.count({ where: { workspaceId: ws.main.id } }), 0);
    assert.equal(await models.ProjectMember.count({ where: { workspaceId: ws.main.id } }), 0);
    assert.ok(await models.Project.findByPk(p.otherWeb.id));
  });
});
