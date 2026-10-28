import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../src/models/user.model.js";
import { proTect, authorizeRole } from "../src/middlewares/auth.middleware.js";
import { mockRes, mockNext } from "./helpers.js";

const tokenFor = (id) => jwt.sign({ id, role: "user" }, process.env.JWT_SECRET);
const reqWith = (token) => ({ headers: token ? { authorization: `Bearer ${token}` } : {} });

afterEach(() => mock.restoreAll());

describe("proTect", () => {
  it("rejects a request without a token", async () => {
    const res = mockRes();
    const next = mockNext();
    await proTect(reqWith(null), res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects an invalid token", async () => {
    const res = mockRes();
    const next = mockNext();
    await proTect(reqWith("not-a-jwt"), res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Invalid Token");
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    mock.method(User, "findByPk", async () => null);
    const res = mockRes();
    const next = mockNext();
    await proTect(reqWith(tokenFor("deleted-id")), res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "User no longer exists");
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects a disabled user", async () => {
    mock.method(User, "findByPk", async () => ({ id: "u1", role: "user", isActive: false }));
    const res = mockRes();
    const next = mockNext();
    await proTect(reqWith(tokenFor("u1")), res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it("attaches an active user and never loads sensitive fields", async () => {
    const findByPk = mock.method(User, "findByPk", async () => ({ id: "u1", role: "user", isActive: true }));
    const req = reqWith(tokenFor("u1"));
    const next = mockNext();
    await proTect(req, mockRes(), next);
    assert.equal(next.mock.callCount(), 1);
    assert.equal(req.user.id, "u1");
    const { exclude } = findByPk.mock.calls[0].arguments[1].attributes;
    for (const field of ["password", "resetPasswordToken", "resetPasswordExpires"]) {
      assert.ok(exclude.includes(field), `${field} should be excluded`);
    }
  });
});

describe("authorizeRole", () => {
  it("returns 401 when req.user is missing", () => {
    const res = mockRes();
    const next = mockNext();
    authorizeRole("admin")({}, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("returns 403 for a role that is not allowed", () => {
    const res = mockRes();
    const next = mockNext();
    authorizeRole("admin")({ user: { role: "user" } }, res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it("calls next for an allowed role", () => {
    const next = mockNext();
    authorizeRole("admin")({ user: { role: "admin" } }, mockRes(), next);
    assert.equal(next.mock.callCount(), 1);
  });
});
