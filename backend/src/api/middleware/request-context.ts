import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import {
  getJwtDiagnostics,
  type JwtDiagnostics,
} from "../../config/auth-diagnostics.js";
import { env } from "../../config/env.js";
import {
  createRequestScopedSupabaseClient,
  type RequestScopedSupabaseClient,
} from "../../config/supabase.js";
import { AppError } from "../errors.js";

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_HEADER_INVALID",
      message: "Authorization header must use the Bearer scheme.",
    });
  }

  return token;
};

type SupabaseClientFactory = (
  accessToken?: string,
) => RequestScopedSupabaseClient;

const logAuthDiagnostics = ({
  event,
  requestId,
  token,
  reason,
}: {
  event: string;
  requestId: string;
  token?: string;
  reason?: string;
}) => {
  const jwt = getJwtDiagnostics(token);

  console.warn("VitalTrack auth diagnostic", {
    event,
    requestId,
    backendProjectRef: env.supabaseProjectRef,
    tokenAudience: jwt.audience,
    tokenExpiresAt: jwt.expiresAt,
    tokenIssuer: jwt.issuer,
    tokenIssuerProjectRef: jwt.issuerProjectRef,
    reason,
  });
};

const issuerMatchesBackendProject = (jwt: JwtDiagnostics) =>
  !jwt.issuerProjectRef ||
  !env.supabaseProjectRef ||
  jwt.issuerProjectRef === env.supabaseProjectRef;

export const createAssignRequestContext =
  (
    createSupabaseClient: SupabaseClientFactory = createRequestScopedSupabaseClient,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        const requestId = req.header("x-request-id")?.trim() || randomUUID();
        res.setHeader("x-request-id", requestId);
        req.context = {
          requestId,
          supabase: createSupabaseClient(),
          validated: {},
        };

        const accessToken = getBearerToken(req.header("authorization"));
        req.context.accessToken = accessToken;

        if (!accessToken) {
          next();
          return;
        }

        // Validate the JWT with a clean Supabase client. Supplying the bearer
        // token both as a global Authorization header and as getUser(jwt) can
        // make authentication behavior dependent on header-merging details.
        const jwt = getJwtDiagnostics(accessToken);
        if (!issuerMatchesBackendProject(jwt)) {
          logAuthDiagnostics({
            event: "auth_token_project_mismatch",
            requestId,
            token: accessToken,
            reason:
              "Token issuer project does not match backend Supabase project.",
          });
          next(
            new AppError({
              statusCode: 401,
              code: "AUTH_TOKEN_PROJECT_MISMATCH",
              message:
                "Access token was issued by a different Supabase project.",
            }),
          );
          return;
        }

        const authClient = createSupabaseClient();
        const { data, error } = await authClient.auth.getUser(accessToken);

        if (error || !data.user) {
          logAuthDiagnostics({
            event: "auth_token_validation_failed",
            requestId,
            token: accessToken,
            reason: error?.message,
          });
          next(
            new AppError({
              statusCode: 401,
              code: "AUTH_TOKEN_INVALID",
              message: "Access token is invalid or expired.",
              details: error
                ? {
                    code: error.status,
                    message: error.message,
                  }
                : undefined,
            }),
          );
          return;
        }

        // Use a separate request-scoped client carrying the validated token for
        // all RLS-protected database operations that follow.
        const supabase = createSupabaseClient(accessToken);
        req.context.supabase = supabase;
        req.context.user = data.user;

        const { data: membership, error: membershipError } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (membershipError) {
          logAuthDiagnostics({
            event: "auth_membership_lookup_failed",
            requestId,
            token: accessToken,
            reason: membershipError.message,
          });
          next(
            new AppError({
              statusCode: 403,
              code: "AUTH_WORKSPACE_LOOKUP_FAILED",
              message:
                "Unable to resolve organization context for the authenticated user.",
              details: {
                code: membershipError.code,
                message: membershipError.message,
              },
            }),
          );
          return;
        }

        if (!membership?.organization_id) {
          logAuthDiagnostics({
            event: "auth_membership_missing",
            requestId,
            token: accessToken,
            reason:
              "No public.users organization_id was found for the authenticated user.",
          });
          next(
            new AppError({
              statusCode: 403,
              code: "AUTH_ORGANIZATION_REQUIRED",
              message:
                "Authenticated user does not have an active organization context.",
            }),
          );
          return;
        }

        req.context.organizationId = membership.organization_id;
        next();
      } catch (error) {
        next(error);
      }
    })();
  };

export const assignRequestContext = createAssignRequestContext();
