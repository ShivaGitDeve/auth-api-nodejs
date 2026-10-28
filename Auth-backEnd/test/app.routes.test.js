// HTTP-level checks against the Express app (no database needed:
// these requests are rejected before any query runs).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

describe("CORS", () => {
  it("allows a configured origin", async () => {
    const res = await fetch(`${base}/`, { headers: { Origin: "http://localhost:5173" } });
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  });

  it("does not allow an unknown origin", async () => {
    const res = await fetch(`${base}/`, { headers: { Origin: "https://evil.example.com" } });
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});

describe("admin routes require authentication", () => {
  const paths = [
    ["GET", "/api/admin/users"],
    ["PATCH", "/api/admin/users/x/role"],
    ["DELETE", "/api/admin/users/x"],
    ["DELETE", "/api/admin/user/x"], // legacy alias
    ["GET", "/api/auth/users"], // legacy alias
  ];
  for (const [method, path] of paths) {
    it(`${method} ${path} -> 401 without a token`, async () => {
      const res = await fetch(`${base}${path}`, { method });
      assert.equal(res.status, 401);
    });
  }
});

describe("signup validation over HTTP", () => {
  it("rejects a role field in the request body", async () => {
    const res = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacker", email: "h@example.com", password: "secret123", role: "admin" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.some((m) => m.includes("Role cannot be set")));
  });
});
