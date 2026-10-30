import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTeamName, teamNameKey } from "../src/utils/teamName.js";
import { WORKSPACE_PERMISSIONS } from "../src/utils/workspaceRoles.js";
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
} from "../src/validation/team-validation.js";

describe("team name normalization", () => {
  it("trims and collapses inner whitespace for storage", () => {
    assert.equal(normalizeTeamName("  Design   Team \t "), "Design Team");
  });

  it("produces the same key for case/whitespace variants", () => {
    const key = teamNameKey("Design Team");
    for (const variant of [" design team ", "DESIGN   TEAM", "Design\tTeam"]) {
      assert.equal(teamNameKey(variant), key);
    }
    assert.notEqual(teamNameKey("Design Teams"), key);
  });
});

describe("team permissions", () => {
  it("lets only owners and admins manage teams", () => {
    assert.deepEqual(WORKSPACE_PERMISSIONS.manageTeams, ["owner", "admin"]);
  });
});

describe("team validation", () => {
  it("requires a 2-80 character name on create", () => {
    assert.ok(createTeamSchema.validate({}).error);
    assert.ok(createTeamSchema.validate({ name: " a " }).error);
    assert.ok(createTeamSchema.validate({ name: "x".repeat(81) }).error);
    assert.ok(!createTeamSchema.validate({ name: "QA", description: "" }).error);
  });

  it("rejects unknown fields such as workspaceId", () => {
    assert.ok(createTeamSchema.validate({ name: "QA", workspaceId: "x" }).error);
  });

  it("requires at least one field on update", () => {
    assert.ok(updateTeamSchema.validate({}).error);
    assert.ok(!updateTeamSchema.validate({ description: "New" }).error);
  });

  it("requires a valid userId to add a member", () => {
    assert.ok(addTeamMemberSchema.validate({}).error);
    assert.ok(addTeamMemberSchema.validate({ userId: "not-a-uuid" }).error);
    assert.ok(!addTeamMemberSchema.validate({ userId: "0b6b1f2e-4f1a-4c1a-9a3e-2b7d8c9e0f11" }).error);
  });
});
