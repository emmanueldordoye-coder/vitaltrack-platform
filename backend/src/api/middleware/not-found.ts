import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors.js";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(
    new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found.`,
    }),
  );
};
