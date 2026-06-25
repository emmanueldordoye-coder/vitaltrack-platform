import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../errors.js";

export const requestTimeout = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.setTimeout(env.apiTimeoutMs);
  res.setTimeout(env.apiTimeoutMs, () => {
    if (res.headersSent) {
      return;
    }

    next(
      new AppError({
        statusCode: 504,
        code: "REQUEST_TIMEOUT",
        message: `Request exceeded the ${env.apiTimeoutMs}ms timeout.`,
      }),
    );
  });

  next();
};
