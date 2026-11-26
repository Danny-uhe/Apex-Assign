import test from "node:test";
import assert from "node:assert/strict";
import { ZodError, z } from "zod";
import { stripHtml, sanitizeInputs } from "../utils/sanitize.js";
import { errorHandler } from "../middleware/errorHandler.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { createPersonalTaskSchema } from "../modules/personal-tasks/personal-task.validation.js";
import { updateProfileSchema } from "../modules/users/users.validation.js";

test("stripHtml removes XSS scripts, event handlers, and null bytes", () => {
  assert.equal(stripHtml('<script>alert("xss")</script>Hello'), "Hello");
  assert.equal(stripHtml('<img src=x onerror="alert(1)">Task'), "Task");
  assert.equal(stripHtml("Clean\0 title "), "Clean title");
});

test("sanitizeInputs strips XSS from body/query while keeping passwords untouched", () => {
  const req = {
    body: {
      title: "<b>Urgent</b> <script>evil()</script>",
      password: "My<Pass>123!",
      nested: { note: '<svg onload="alert(1)">Note' },
    },
    query: {
      search: "<script>bad()</script>alpha",
    },
  } as unknown as Parameters<typeof sanitizeInputs>[0];

  const res = {
    status: () => ({ json: () => {} }),
  } as unknown as Parameters<typeof sanitizeInputs>[1];

  let called = false;
  sanitizeInputs(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.title, "Urgent");
  assert.equal(req.body.password, "My<Pass>123!");
  assert.equal(req.body.nested.note, "Note");
  assert.equal(req.query.search, "alpha");
});

test("sanitizeInputs rejects prototype pollution keys", () => {
  const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
  const req = { body: payload, query: {} } as unknown as Parameters<typeof sanitizeInputs>[0];

  let statusCode = 0;
  let body: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return {
        json(data: unknown) {
          body = data;
        },
      };
    },
  } as unknown as Parameters<typeof sanitizeInputs>[1];

  let nextCalled = false;
  sanitizeInputs(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal((body as { success: boolean }).success, false);
});

test("JWT refresh token generation and HS256 verification work", () => {
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/db";
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret-123456";
  process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-123456";
  process.env.REDIS_URL ??= "redis://localhost:6379";
  process.env.SMTP_HOST ??= "localhost";
  process.env.SMTP_USER ??= "user";
  process.env.SMTP_PASS ??= "pass";
  process.env.SMTP_FROM ??= "noreply@example.com";

  const access = generateAccessToken("user_1", "member");
  const refresh = generateRefreshToken("user_1");
  assert.ok(access.split(".").length === 3);
  const decoded = verifyRefreshToken(refresh);
  assert.equal(decoded.userId, "user_1");
});

test("personalTask validation transforms YYYY-MM-DD to end of day UTC", () => {
  const parsed = createPersonalTaskSchema.parse({
    title: "Pay invoice",
    dueDate: "2026-12-01",
    repeat: "weekly",
  });
  assert.equal(parsed.dueDate, "2026-12-01T23:59:59.999Z");
  assert.equal(parsed.repeat, "weekly");
});

test("updateProfileSchema strips unknown email key and rejects non-http avatar URLs", () => {
  const parsed = updateProfileSchema.parse({
    name: "Jane",
    email: "hacker@evil.com",
  } as Record<string, unknown>);
  assert.equal("email" in parsed, false);

  assert.throws(() =>
    updateProfileSchema.parse({ avatar: "javascript:alert(1)" })
  );
});

test("errorHandler returns 422 with structured issues on ZodError", () => {
  let err: unknown;
  try {
    z.object({ title: z.string().min(3) }).parse({ title: "" });
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof ZodError);

  let statusCode = 0;
  let responseBody: Record<string, unknown> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return {
        json(data: Record<string, unknown>) {
          responseBody = data;
        },
      };
    },
  } as unknown as Parameters<typeof errorHandler>[2];

  errorHandler(
    err,
    { id: "req-1", path: "/test" } as Parameters<typeof errorHandler>[1],
    res,
    () => {}
  );

  assert.equal(statusCode, 422);
  assert.equal(responseBody.success, false);
  assert.ok(Array.isArray(responseBody.errors));
});
