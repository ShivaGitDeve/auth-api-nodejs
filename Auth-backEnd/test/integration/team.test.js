// Module 3 integration tests: real Postgres (isolated test schema) + real HTTP app.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { setupTestSchema, dropTestSchema } from "./testDb.js";

let models;
let server;
let base;
const u = {};
const ws = {};
const t = {};

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

const teams = (workspace) => `/workspaces/${workspace.id}/teams`;

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

// raw SQL insert ka error code (constraint tests ke liye)
const insertError = async (sql, replacements) => {
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
  u.member = await makeUser("Member");
  u.member2 = await makeUser("Member2");
  u.outsider = await makeUser("Outsider");
  u.otherOwner = await makeUser("OtherOwner");
  u.globalAdmin = await makeUser("GlobalAdm", "admin");

  ws.main = (await call("POST", "/workspaces", u.owner, { name: "Main" })).body.workspace;
  ws.other = (await call("POST", "/workspaces", u.otherOwner, { name: "Other" })).body.workspace;
  await join(ws.main, u.admin, "admin");
  await join(ws.main, u.member, "member");
  await join(ws.main, u.member2, "member");
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (models) await models.sequelize.close();
  await dropTestSchema();
});

describe("team CRUD and role permissions", () => {
  it("requires authentication and workspace membership", async () => {
    assert.equal((await call("GET", teams(ws.main), null)).status, 401);
    assert.equal((await call("GET", teams(ws.main), u.outsider)).status, 404);
    assert.equal((await call("GET", teams(ws.main), u.globalAdmin)).status, 404);
  });

  it("does not let a regular member create a team", async () => {
    const res = await call("POST", teams(ws.main), u.member, { name: "Sneaky" });
    assert.equal(res.status, 403);
  });

  it("owner and admin can create teams; names are normalized", async () => {
    const a = await call("POST", teams(ws.main), u.owner, { name: "  Design   Team ", description: " UI & UX " });
    assert.equal(a.status, 201);
    assert.equal(a.body.team.name, "Design Team");
    assert.equal(a.body.team.description, "UI & UX");
    assert.equal(a.body.team.memberCount, 0);
    t.design = a.body.team;

    const b = await call("POST", teams(ws.main), u.admin, { name: "Backend" });
    assert.equal(b.status, 201);
    t.backend = b.body.team;
  });

  it("rejects duplicate team names in the same workspace, case- and space-insensitively", async () => {
    for (const name of ["design team", "DESIGN   TEAM", " Design Team"]) {
      const res = await call("POST", teams(ws.main), u.owner, { name });
      assert.equal(res.status, 409, `"${name}" should be a duplicate`);
    }
  });

  it("allows the same team name in a different workspace", async () => {
    const res = await call("POST", teams(ws.other), u.otherOwner, { name: "Design Team" });
    assert.equal(res.status, 201);
    t.otherDesign = res.body.team;
  });

  it("validates input", async () => {
    assert.equal((await call("POST", teams(ws.main), u.owner, { name: "x" })).status, 400);
    assert.equal((await call("POST", teams(ws.main), u.owner, { name: "Ok", workspaceId: ws.other.id })).status, 400);
    assert.equal((await call("PATCH", `${teams(ws.main)}/${t.design.id}`, u.owner, {})).status, 400);
  });

  it("every workspace member can list teams and view details", async () => {
    const list = await call("GET", teams(ws.main), u.member);
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.teams.map((x) => x.name), ["Backend", "Design Team"]);
    assert.ok(!list.body.teams.some((x) => x.id === t.otherDesign.id));

    const details = await call("GET", `${teams(ws.main)}/${t.design.id}`, u.member);
    assert.equal(details.status, 200);
    assert.equal(details.body.team.name, "Design Team");
    assert.deepEqual(details.body.members, []);
  });

  it("only owner/admin can update; renaming to an existing name is rejected", async () => {
    const path = `${teams(ws.main)}/${t.backend.id}`;
    assert.equal((await call("PATCH", path, u.member, { name: "Hacked" })).status, 403);
    assert.equal((await call("PATCH", path, u.admin, { name: "design TEAM" })).status, 409);

    const ok = await call("PATCH", path, u.admin, { name: "Backend Squad", description: "APIs" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.team.name, "Backend Squad");

    // apne hi naam ka case badalna allowed hai
    const recase = await call("PATCH", path, u.owner, { name: "backend squad" });
    assert.equal(recase.status, 200);
    assert.equal(recase.body.team.name, "backend squad");
  });

  it("only owner/admin can delete a team", async () => {
    const created = await call("POST", teams(ws.main), u.owner, { name: "Temp" });
    const path = `${teams(ws.main)}/${created.body.team.id}`;
    assert.equal((await call("DELETE", path, u.member)).status, 403);
    assert.equal((await call("DELETE", path, u.admin)).status, 200);
    assert.equal((await call("GET", path, u.owner)).status, 404);
  });
});

describe("team membership", () => {
  const members = () => `${teams(ws.main)}/${t.design.id}/members`;

  it("owner/admin can add existing workspace members", async () => {
    const a = await call("POST", members(), u.owner, { userId: u.member.id });
    assert.equal(a.status, 201);
    assert.equal(a.body.member.userId, u.member.id);
    assert.equal(a.body.member.workspaceRole, "member");
    assert.ok(!("password" in a.body.member));

    const b = await call("POST", members(), u.admin, { userId: u.admin.id });
    assert.equal(b.status, 201);

    const details = await call("GET", `${teams(ws.main)}/${t.design.id}`, u.member);
    assert.equal(details.body.members.length, 2);
    assert.equal(details.body.team.isMember, true);
    const list = await call("GET", teams(ws.main), u.member);
    const design = list.body.teams.find((x) => x.id === t.design.id);
    assert.equal(design.memberCount, 2);
    assert.equal(design.isMember, true);
  });

  it("a regular member cannot add or remove team members", async () => {
    assert.equal((await call("POST", members(), u.member, { userId: u.member2.id })).status, 403);
    assert.equal((await call("DELETE", `${members()}/${u.admin.id}`, u.member)).status, 403);
  });

  it("rejects adding the same person twice (409)", async () => {
    const res = await call("POST", members(), u.owner, { userId: u.member.id });
    assert.equal(res.status, 409);
  });

  it("rejects users who are not in this workspace (400), including other workspaces' members", async () => {
    assert.equal((await call("POST", members(), u.owner, { userId: u.outsider.id })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: u.otherOwner.id })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: crypto.randomUUID() })).status, 400);
    assert.equal((await call("POST", members(), u.owner, { userId: "nope" })).status, 400);
  });

  it("removes a member; removing again or a non-member is 404", async () => {
    const res = await call("DELETE", `${members()}/${u.admin.id}`, u.owner);
    assert.equal(res.status, 200);
    assert.equal((await call("DELETE", `${members()}/${u.admin.id}`, u.owner)).status, 404);
    assert.equal((await call("DELETE", `${members()}/${u.outsider.id}`, u.owner)).status, 404);
    assert.equal((await call("DELETE", `${members()}/not-a-uuid`, u.owner)).status, 404);
  });
});

describe("cross-workspace access", () => {
  it("cannot reach another workspace's team through your own workspace", async () => {
    const path = `${teams(ws.main)}/${t.otherDesign.id}`;
    assert.equal((await call("GET", path, u.owner)).status, 404);
    assert.equal((await call("PATCH", path, u.owner, { name: "Stolen" })).status, 404);
    assert.equal((await call("DELETE", path, u.owner)).status, 404);
    assert.equal((await call("POST", `${path}/members`, u.owner, { userId: u.member.id })).status, 404);
  });

  it("cannot reach another workspace's teams directly without membership", async () => {
    const path = `${teams(ws.other)}/${t.otherDesign.id}`;
    assert.equal((await call("GET", path, u.owner)).status, 404);
    assert.equal((await call("DELETE", path, u.owner)).status, 404);
    const still = await models.Team.findByPk(t.otherDesign.id);
    assert.equal(still.name, "Design Team");
  });
});

describe("database constraints", () => {
  it("unique index blocks duplicate names even when bypassing the API", async () => {
    const code = await insertError(
      `INSERT INTO teams (id, "workspaceId", name, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :ws, 'DESIGN TEAM', now(), now())`,
      { ws: ws.main.id },
    );
    assert.equal(code, "23505"); // unique_violation
  });

  it("composite FK blocks a team membership that crosses workspaces", async () => {
    const otherMembership = await models.WorkspaceMember.findOne({
      where: { workspaceId: ws.other.id, userId: u.otherOwner.id },
    });
    // other workspace ka member + main workspace ki team
    const code = await insertError(
      `INSERT INTO team_members (id, "teamId", "workspaceMemberId", "workspaceId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :team, :wm, :ws, now(), now())`,
      { team: t.design.id, wm: otherMembership.id, ws: ws.main.id },
    );
    assert.equal(code, "23503"); // foreign_key_violation

    const code2 = await insertError(
      `INSERT INTO team_members (id, "teamId", "workspaceMemberId", "workspaceId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :team, :wm, :ws, now(), now())`,
      { team: t.design.id, wm: otherMembership.id, ws: ws.other.id },
    );
    assert.equal(code2, "23503");
  });

  it("unique constraint blocks duplicate team membership rows", async () => {
    const wm = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.member.id } });
    const code = await insertError(
      `INSERT INTO team_members (id, "teamId", "workspaceMemberId", "workspaceId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :team, :wm, :ws, now(), now())`,
      { team: t.design.id, wm: wm.id, ws: ws.main.id },
    );
    assert.equal(code, "23505");
  });
});

describe("cleanup behaviour", () => {
  it("removing someone from the workspace removes their team memberships", async () => {
    await call("POST", `${teams(ws.main)}/${t.design.id}/members`, u.owner, { userId: u.member2.id });
    const wm = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.member2.id } });
    assert.equal(await models.TeamMember.count({ where: { workspaceMemberId: wm.id } }), 1);

    await wm.destroy();
    assert.equal(await models.TeamMember.count({ where: { workspaceMemberId: wm.id } }), 0);
  });

  it("deleting a user removes their team memberships", async () => {
    const wm = await models.WorkspaceMember.findOne({ where: { workspaceId: ws.main.id, userId: u.member.id } });
    assert.equal(await models.TeamMember.count({ where: { workspaceMemberId: wm.id } }), 1);
    await models.User.destroy({ where: { id: u.member.id } });
    assert.equal(await models.TeamMember.count({ where: { workspaceMemberId: wm.id } }), 0);
  });

  it("deleting a team removes its memberships", async () => {
    await call("POST", `${teams(ws.main)}/${t.backend.id}/members`, u.owner, { userId: u.admin.id });
    assert.equal(await models.TeamMember.count({ where: { teamId: t.backend.id } }), 1);
    await call("DELETE", `${teams(ws.main)}/${t.backend.id}`, u.owner);
    assert.equal(await models.TeamMember.count({ where: { teamId: t.backend.id } }), 0);
  });

  it("deleting a workspace removes its teams and team memberships", async () => {
    await call("POST", `${teams(ws.main)}/${t.design.id}/members`, u.owner, { userId: u.admin.id });
    assert.ok((await models.Team.count({ where: { workspaceId: ws.main.id } })) > 0);

    const res = await call("DELETE", `/workspaces/${ws.main.id}`, u.owner, { confirm: ws.main.name });
    assert.equal(res.status, 200);
    assert.equal(await models.Team.count({ where: { workspaceId: ws.main.id } }), 0);
    assert.equal(await models.TeamMember.count({ where: { workspaceId: ws.main.id } }), 0);
    // doosre workspace ki team bachi rehti hai
    assert.ok(await models.Team.findByPk(t.otherDesign.id));
  });
});
