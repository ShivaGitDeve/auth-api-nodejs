import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/user.model.js";
import { getUsers, updateUserRole, deleteUser } from "../src/controllers/admin.controller.js";
import { mockRes, mockNext } from "./helpers.js";

const admin = { id: "admin-1", email: "admin@example.com", role: "admin" };

afterEach(() => mock.restoreAll());

describe("admin getUsers", () => {
  it("excludes password and reset-token fields", async () => {
    const findAll = mock.method(User, "findAll", async () => [{ id: "u1" }]);
    const res = mockRes();
    await getUsers({ user: admin }, res, mockNext());

    const { exclude } = findAll.mock.calls[0].arguments[0].attributes;
    assert.ok(exclude.includes("password"));
    assert.ok(exclude.includes("resetPasswordToken"));
    assert.ok(exclude.includes("resetPasswordExpires"));
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 1);
    // dono response shapes (naya "users", purana "data") same list dete hain
    assert.deepEqual(res.body.users, res.body.data);
  });
});

describe("admin updateUserRole", () => {
  it("rejects an invalid role", async () => {
    const res = mockRes();
    await updateUserRole({ user: admin, params: { id: "u2" }, body: { role: "owner" } }, res, mockNext());
    assert.equal(res.statusCode, 400);
  });

  it("does not let an admin change their own role", async () => {
    const res = mockRes();
    await updateUserRole({ user: admin, params: { id: admin.id }, body: { role: "user" } }, res, mockNext());
    assert.equal(res.statusCode, 403);
  });

  it("updates another user's role", async () => {
    const target = { id: "u2", email: "u2@example.com", role: "user", save: mock.fn(async () => {}) };
    mock.method(User, "findByPk", async () => target);
    const res = mockRes();
    await updateUserRole({ user: admin, params: { id: "u2" }, body: { role: "admin" } }, res, mockNext());
    assert.equal(res.statusCode, 200);
    assert.equal(target.role, "admin");
    assert.equal(target.save.mock.callCount(), 1);
  });
});

describe("admin deleteUser", () => {
  it("does not let an admin delete themselves", async () => {
    const res = mockRes();
    await deleteUser({ user: admin, params: { id: admin.id } }, res, mockNext());
    assert.equal(res.statusCode, 403);
  });

  it("returns 404 for an unknown user", async () => {
    mock.method(User, "findByPk", async () => null);
    const res = mockRes();
    await deleteUser({ user: admin, params: { id: "missing" } }, res, mockNext());
    assert.equal(res.statusCode, 404);
  });
});
