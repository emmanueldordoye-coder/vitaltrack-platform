export interface AppErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  public constructor({ statusCode, code, message, details }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const createNotFoundError = (resource: string) =>
  new AppError({
    statusCode: 404,
    code: "NOT_FOUND",
    message: `${resource} not found.`,
  });

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
