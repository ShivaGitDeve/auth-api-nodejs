import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_KEY_RE,
  normalizeProjectKey,
  suggestProjectKey,
  isValidDateRange,
  canManageProject,
  canAdministerProject,
} from "../src/utils/projectMeta.js";
import {
  createProjectSchema,
  updateProjectSchema,
  unarchiveProjectSchema,
  addProjectMemberSchema,
} from "../src/validation/project-validation.js";

describe("project keys", () => {
  it("normalizes to uppercase", () => {
    assert.equal(normalizeProjectKey("  web2 "), "WEB2");
  });

  it("suggests valid keys from names", () => {
    assert.equal(suggestProjectKey("Mobile App Redesign"), "MAR");
    assert.equal(suggestProjectKey("Website"), "WEB");
    assert.equal(suggestProjectKey("a"), "APR");
    for (const name of ["123 launch", "!!!", "Q4 Growth Plan Big Push Now", "x y"]) {
      assert.match(suggestProjectKey(name), PROJECT_KEY_RE, `key for "${name}"`);
    }
  });
});

describe("date ranges", () => {
  it("allows open or ordered ranges and rejects reversed ones", () => {
    assert.ok(isValidDateRange(null, null));
    assert.ok(isValidDateRange("2026-01-01", null));
    assert.ok(isValidDateRange("2026-01-01", "2026-01-01"));
    assert.ok(isValidDateRange("2026-01-01", "2026-02-01"));
    assert.ok(!isValidDateRange("2026-02-01", "2026-01-31"));
  });
});

describe("project permissions", () => {
  const project = { ownerMemberId: "m-owner" };
  it("workspace owner/admin can manage and administer any project", () => {
    for (const role of ["owner", "admin"]) {
      assert.ok(canManageProject({ id: "x", role }, project));
      assert.ok(canAdministerProject({ id: "x", role }));
    }
  });

  it("project owner can manage but not administer", () => {
    const me = { id: "m-owner", role: "member" };
    assert.ok(canManageProject(me, project));
    assert.ok(!canAdministerProject(me));
  });

  it("other members can do neither", () => {
    const me = { id: "m-other", role: "member" };
    assert.ok(!canManageProject(me, project));
    assert.ok(!canManageProject(me, { ownerMemberId: null }));
    assert.ok(!canAdministerProject(me));
  });
});

describe("project validation", () => {
  it("requires a name and accepts optional fields", () => {
    assert.ok(createProjectSchema.validate({}).error);
    const { error } = createProjectSchema.validate({
      name: "Website",
      key: "web",
      status: "active",
      priority: "urgent",
      startDate: "2026-01-01",
      dueDate: "2026-03-01",
      teamId: null,
    });
    assert.ok(!error);
  });

  it("rejects bad keys, statuses, priorities and dates", () => {
    assert.ok(createProjectSchema.validate({ name: "X1", key: "1AB" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", key: "A" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", key: "TOOLONGKEY1" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", status: "archived" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", priority: "critical" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", startDate: "2026-02-30" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", dueDate: "01/02/2026" }).error);
  });

  it("rejects a due date before the start date", () => {
    const { error } = createProjectSchema.validate({ name: "X1", startDate: "2026-05-01", dueDate: "2026-04-01" });
    assert.match(error.message, /Due date cannot be before the start date/);
  });

  it("rejects unknown fields such as workspaceId or ownerMemberId", () => {
    assert.ok(createProjectSchema.validate({ name: "X1", workspaceId: "w" }).error);
    assert.ok(createProjectSchema.validate({ name: "X1", ownerMemberId: "m" }).error);
  });

  it("update needs at least one field; unarchive and member schemas validate", () => {
    assert.ok(updateProjectSchema.validate({}).error);
    assert.ok(!updateProjectSchema.validate({ priority: "low" }).error);
    assert.ok(unarchiveProjectSchema.validate({ status: "archived" }).error);
    assert.ok(!unarchiveProjectSchema.validate({}).error);
    assert.ok(addProjectMemberSchema.validate({ userId: "nope" }).error);
  });
});
