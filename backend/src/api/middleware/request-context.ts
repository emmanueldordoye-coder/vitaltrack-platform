import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { createRequestScopedSupabaseClient } from "../../config/supabase.js";
import { AppError } from "../errors.js";

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_FAILED",
      message: "Authorization header must use the Bearer scheme.",
    });
  }

  return token;
};

export const assignRequestContext = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  void (async () => {
    try {
      const requestId = req.header("x-request-id")?.trim() || randomUUID();
      res.setHeader("x-request-id", requestId);
      req.context = {
        requestId,
        supabase: createRequestScopedSupabaseClient(),
        validated: {},
      };

      const accessToken = getBearerToken(req.header("authorization"));
      const supabase = createRequestScopedSupabaseClient(accessToken);

      req.context.accessToken = accessToken;
      req.context.supabase = supabase;

      if (!accessToken) {
        next();
        return;
      }

      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        next(
          new AppError({
            statusCode: 401,
            code: "AUTH_FAILED",
            message: "Unable to validate the provided access token.",
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

      req.context.user = data.user;

      const { data: membership, error: membershipError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (membershipError) {
        next(
          new AppError({
            statusCode: 403,
            code: "FORBIDDEN",
            message: "Unable to resolve organization context for the authenticated user.",
            details: {
              code: membershipError.code,
              message: membershipError.message,
            },
          }),
        );
        return;
      }

      if (!membership?.organization_id) {
        next(
          new AppError({
            statusCode: 403,
            code: "FORBIDDEN",
            message: "Authenticated user does not have an active organization context.",
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
