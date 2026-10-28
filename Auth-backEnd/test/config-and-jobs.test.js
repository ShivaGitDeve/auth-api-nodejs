import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Op } from "sequelize";
import config from "../src/config/env.js";
import swaggerSpec from "../src/config/swagger.js";
import RefreshTokenModel from "../src/models/refreshToken.model.js";
import { User, RefreshToken } from "../src/models/index.js";
import { cleanupExpiredRefreshTokens } from "../src/jobs/refreshTokenClean.job.js";

afterEach(() => mock.restoreAll());

describe("env config", () => {
  it("reads FRONTEND_URL without a trailing slash", () => {
    assert.equal(config.frontendUrl, "https://app.example.com");
  });

  it("parses comma separated CORS_ORIGINS", () => {
    assert.deepEqual(config.corsOrigins, ["https://app.example.com", "http://localhost:5173"]);
  });
});

describe("swagger", () => {
  it("builds a spec without importing anything from react", () => {
    assert.equal(swaggerSpec.openapi, "3.0.0");
  });
});

describe("model associations", () => {
  it("links users and refresh tokens through userId", () => {
    assert.equal(User.associations.refreshTokens.foreignKey, "userId");
    assert.equal(RefreshToken.associations.user.foreignKey, "userId");
  });
});

describe("refresh token cleanup job", () => {
  it("deletes tokens whose expire date is in the past", async () => {
    const destroy = mock.method(RefreshTokenModel, "destroy", async () => 3);
    const removed = await cleanupExpiredRefreshTokens();
    assert.equal(removed, 3);
    const { where } = destroy.mock.calls[0].arguments[0];
    assert.ok(where.expire[Op.lt] instanceof Date);
  });

  it("does not throw when the database call fails", async () => {
    mock.method(RefreshTokenModel, "destroy", async () => {
      throw new Error("db down");
    });
    assert.equal(await cleanupExpiredRefreshTokens(), 0);
  });
});
