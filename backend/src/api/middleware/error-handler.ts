import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../../config/env.js";
import { isAppError } from "../errors.js";
import { sendError } from "../response.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ZodError) {
    sendError(req, res, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
    });
    return;
  }

  if (isAppError(error)) {
    sendError(req, res, {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: env.isProduction ? undefined : error.details,
    });
    return;
  }

  sendError(req, res, {
    statusCode: 500,
    code: "SERVER_ERROR",
    message: env.isProduction
      ? "An unexpected error occurred."
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.",
  });
};
