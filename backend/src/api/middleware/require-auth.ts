import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors.js";

export const requireAuthenticatedUser = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.context.accessToken || !req.context.user) {
    next(
      new AppError({
        statusCode: 401,
        code: "AUTH_HEADER_MISSING",
        message: "Authorization bearer token is required for this endpoint.",
      }),
    );
    return;
  }

  if (!req.context.organizationId) {
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

  next();
};
