import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import supertest from "supertest";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";

const { requireAuthenticatedUser } =
  await import("../src/api/middleware/require-auth.js");
const { errorHandler } = await import("../src/api/middleware/error-handler.js");
const { createAssignRequestContext } =
  await import("../src/api/middleware/request-context.js");

type AuthResult = {
  data: {
    user: { id: string; email?: string } | null;
  };
  error: null | { status?: number; message: string };
};

type MembershipResult = {
  data: { organization_id: string } | null;
  error: null | { code?: string; message: string };
};

const createJwt = ({
  issuer = "https://example.supabase.co/auth/v1",
  audience = "authenticated",
  expiresAt = Math.floor(Date.now() / 1000) + 3600,
}: {
  issuer?: string;
  audience?: string;
  expiresAt?: number;
} = {}) => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({
      aud: audience,
      exp: expiresAt,
      iss: issuer,
      sub: "user-current",
    }),
    "signature",
  ].join(".");
};

class FakeMembershipQuery {
  public select() {
    return this;
  }

  public eq() {
    return this;
  }

  public maybeSingle() {
    return Promise.resolve(this.membershipResult);
  }

  public constructor(private readonly membershipResult: MembershipResult) {}
}

const createAppWithRequestContext = ({
  authResult,
  membershipResult,
  observedClientTokens,
}: {
  authResult: AuthResult;
  membershipResult: MembershipResult;
  observedClientTokens: Array<string | undefined>;
}) => {
  const app = express();
  const createSupabaseClient = (accessToken?: string) => {
    observedClientTokens.push(accessToken);
    return {
      auth: {
        getUser: async () => authResult,
      },
      from: () => new FakeMembershipQuery(membershipResult),
    } as never;
  };

  app.use(createAssignRequestContext(createSupabaseClient));
  app.get("/protected", requireAuthenticatedUser, (req, res) => {
    res.json({
      organizationId: req.context.organizationId,
      userId: req.context.user?.id,
    });
  });
  app.use(errorHandler);
  return app;
};

test("request context accepts a valid staging-style Supabase token", async () => {
  const observedClientTokens: Array<string | undefined> = [];
  const accessToken = createJwt();
  const app = createAppWithRequestContext({
    authResult: {
      data: {
        user: { id: "user-current", email: "user@example.com" },
      },
      error: null,
    },
    membershipResult: {
      data: { organization_id: "org-current" },
      error: null,
    },
    observedClientTokens,
  });

  const response = await supertest(app)
    .get("/protected")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.organizationId, "org-current");
  assert.deepEqual(observedClientTokens, [undefined, undefined, accessToken]);
});

test("request context returns 401 when the bearer token is missing", async () => {
  const observedClientTokens: Array<string | undefined> = [];
  const app = createAppWithRequestContext({
    authResult: {
      data: { user: null },
      error: null,
    },
    membershipResult: {
      data: { organization_id: "org-current" },
      error: null,
    },
    observedClientTokens,
  });

  const response = await supertest(app).get("/protected");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "AUTH_HEADER_MISSING");
  assert.deepEqual(observedClientTokens, [undefined]);
});

test("request context rejects invalid Supabase tokens with 401", async () => {
  const observedClientTokens: Array<string | undefined> = [];
  const app = createAppWithRequestContext({
    authResult: {
      data: { user: null },
      error: { status: 401, message: "invalid JWT" },
    },
    membershipResult: {
      data: { organization_id: "org-current" },
      error: null,
    },
    observedClientTokens,
  });

  const response = await supertest(app)
    .get("/protected")
    .set("Authorization", `Bearer ${createJwt()}`);

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "AUTH_TOKEN_INVALID");
  assert.deepEqual(observedClientTokens, [undefined, undefined]);
});

test("request context rejects mismatched Supabase token issuers with safe diagnostics", async () => {
  const observedClientTokens: Array<string | undefined> = [];
  const accessToken = createJwt({
    issuer: "https://other-project.supabase.co/auth/v1",
  });
  const originalWarn = console.warn;
  const diagnostics: unknown[] = [];
  console.warn = (...args: unknown[]) => {
    diagnostics.push(args);
  };

  try {
    const app = createAppWithRequestContext({
      authResult: {
        data: {
          user: { id: "user-current" },
        },
        error: null,
      },
      membershipResult: {
        data: { organization_id: "org-current" },
        error: null,
      },
      observedClientTokens,
    });

    const response = await supertest(app)
      .get("/protected")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTH_TOKEN_PROJECT_MISMATCH");
    assert.deepEqual(observedClientTokens, [undefined]);
    assert.equal(JSON.stringify(diagnostics).includes(accessToken), false);
    assert.equal(JSON.stringify(diagnostics).includes("other-project"), true);
  } finally {
    console.warn = originalWarn;
  }
});

test("request context returns 403 when an authenticated user has no organization", async () => {
  const observedClientTokens: Array<string | undefined> = [];
  const accessToken = createJwt();
  const app = createAppWithRequestContext({
    authResult: {
      data: {
        user: { id: "user-current" },
      },
      error: null,
    },
    membershipResult: {
      data: null,
      error: null,
    },
    observedClientTokens,
  });

  const response = await supertest(app)
    .get("/protected")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, "AUTH_ORGANIZATION_REQUIRED");
  assert.equal(response.body.error.message.includes("organization"), true);
});
