import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../src/models/user.model.js";
import RefreshTokenModel from "../src/models/refreshToken.model.js";
import {
  registerUser,
  loginUser,
  refeshAT,
  resetPassword,
  changePassword,
} from "../src/controllers/auth.controller.js";
import { registerSchema, validate } from "../src/validation/auth-validation.js";
import { mockRes, mockNext } from "./helpers.js";

afterEach(() => mock.restoreAll());

const refreshTokenFor = (id) =>
  jwt.sign({ id }, process.env.REFRESH_JWT_SECRET, { expiresIn: "7d" });

describe("signup cannot grant admin", () => {
  for (const role of ["admin", "user"]) {
    it(`validation rejects role="${role}" in the signup body`, () => {
      const res = mockRes();
      const next = mockNext();
      validate(registerSchema)(
        { body: { name: "Test", email: "t@example.com", password: "secret123", role } },
        res,
        next,
      );
      assert.equal(res.statusCode, 400);
      assert.equal(next.mock.callCount(), 0);
    });
  }

  it("validation accepts a body without role", () => {
    const next = mockNext();
    validate(registerSchema)(
      { body: { name: "Test", email: "t@example.com", password: "secret123" } },
      mockRes(),
      next,
    );
    assert.equal(next.mock.callCount(), 1);
  });

  it("registerUser always creates the account with role 'user'", async () => {
    mock.method(User, "findOne", async () => null);
    const create = mock.method(User, "create", async (data) => ({ id: "new", ...data }));
    const res = mockRes();
    await registerUser(
      { body: { name: "Test", email: "t@example.com", password: "secret123", role: "admin" } },
      res,
    );
    assert.equal(res.statusCode, 201);
    assert.equal(create.mock.calls[0].arguments[0].role, "user");
  });
});

describe("loginUser", () => {
  it("rejects a disabled account", async () => {
    const password = await bcrypt.hash("secret123", 4);
    mock.method(User, "findOne", async () => ({ id: "u1", email: "t@example.com", password, isActive: false }));
    const create = mock.method(RefreshTokenModel, "create", async () => ({}));
    const res = mockRes();
    await loginUser({ body: { email: "t@example.com", password: "secret123" } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(create.mock.callCount(), 0);
  });
});

describe("refeshAT", () => {
  it("rejects and deletes a refresh token whose DB 'expire' is in the past", async () => {
    const token = refreshTokenFor("u1");
    const destroy = mock.fn(async () => {});
    mock.method(RefreshTokenModel, "findOne", async () => ({
      token,
      expire: new Date(Date.now() - 1000),
      destroy,
    }));
    const create = mock.method(RefreshTokenModel, "create", async () => ({}));
    const res = mockRes();
    await refeshAT({ headers: { authorization: `Bearer ${token}` } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Refresh Token Expired");
    assert.equal(destroy.mock.callCount(), 1);
    assert.equal(create.mock.callCount(), 0);
  });

  it("rotates a valid, unexpired refresh token", async () => {
    const token = refreshTokenFor("u1");
    mock.method(RefreshTokenModel, "findOne", async () => ({
      token,
      expire: new Date(Date.now() + 60_000),
    }));
    mock.method(RefreshTokenModel, "destroy", async () => 1);
    const create = mock.method(RefreshTokenModel, "create", async () => ({}));
    const res = mockRes();
    await refeshAT({ headers: { authorization: `Bearer ${token}` } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    assert.equal(create.mock.calls[0].arguments[0].userId, "u1");
  });
});

describe("session revocation", () => {
  it("changePassword deletes all of the user's refresh tokens", async () => {
    const user = {
      id: "u1",
      password: await bcrypt.hash("oldpass123", 4),
      save: mock.fn(async () => {}),
    };
    mock.method(User, "findByPk", async () => user);
    const destroy = mock.method(RefreshTokenModel, "destroy", async () => 2);
    const res = mockRes();
    await changePassword(
      { user: { id: "u1" }, body: { currentPassword: "oldpass123", newPassword: "newpass123" } },
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.equal(user.save.mock.callCount(), 1);
    assert.deepEqual(destroy.mock.calls[0].arguments[0], { where: { userId: "u1" } });
    assert.ok(await bcrypt.compare("newpass123", user.password));
  });

  it("changePassword keeps sessions when the current password is wrong", async () => {
    mock.method(User, "findByPk", async () => ({
      id: "u1",
      password: await bcrypt.hash("oldpass123", 4),
      save: mock.fn(async () => {}),
    }));
    const destroy = mock.method(RefreshTokenModel, "destroy", async () => 0);
    const res = mockRes();
    await changePassword(
      { user: { id: "u1" }, body: { currentPassword: "wrong", newPassword: "newpass123" } },
      res,
    );
    assert.equal(res.statusCode, 400);
    assert.equal(destroy.mock.callCount(), 0);
  });

  it("resetPassword deletes all of the user's refresh tokens", async () => {
    const user = { id: "u1", save: mock.fn(async () => {}) };
    mock.method(User, "findOne", async () => user);
    const destroy = mock.method(RefreshTokenModel, "destroy", async () => 1);
    const res = mockRes();
    await resetPassword({ body: { token: "abc", newPassword: "newpass123" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(user.resetPasswordToken, null);
    assert.deepEqual(destroy.mock.calls[0].arguments[0], { where: { userId: "u1" } });
  });
});
