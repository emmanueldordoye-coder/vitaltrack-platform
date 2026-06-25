import type { Request, Response } from "express";

import { env } from "../config/env.js";
import type {
  ApiErrorResponse,
  ApiResponseMeta,
  ApiSuccessResponse,
} from "../types/api.js";

const buildMeta = (requestId?: string): ApiResponseMeta => ({
  requestId: requestId ?? "unknown",
  timestamp: new Date().toISOString(),
  version: env.apiVersion,
});

export const sendSuccess = <T>(
  req: Request,
  res: Response<ApiSuccessResponse<T>>,
  data: T,
  statusCode = 200,
) =>
  res.status(statusCode).json({
    success: true,
    data,
    meta: buildMeta(req.context?.requestId),
  });

export const sendError = (
  req: Request,
  res: Response<ApiErrorResponse>,
  {
    statusCode,
    code,
    message,
    details,
  }: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  },
) =>
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    meta: buildMeta(req.context?.requestId),
  });
