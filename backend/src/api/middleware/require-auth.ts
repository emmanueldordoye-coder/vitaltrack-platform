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
        code: "UNAUTHORIZED",
        message: "A valid Supabase access token is required for this endpoint.",
      }),
    );
    return;
  }

  next();
};
