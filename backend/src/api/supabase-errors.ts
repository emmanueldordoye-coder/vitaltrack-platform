import { AppError } from "./errors.js";

interface SupabaseErrorLike {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message: string;
}

const mapStatusCode = (code?: string) => {
  switch (code) {
    case "23505":
      return 409;
    case "23503":
      return 400;
    default:
      return 400;
  }
};

const mapErrorCode = (code?: string) => {
  switch (code) {
    case "23505":
      return "CONFLICT";
    default:
      return "DATABASE_ERROR";
  }
};

export const throwSupabaseError = (
  action: string,
  error: SupabaseErrorLike,
): never => {
  throw new AppError({
    statusCode: mapStatusCode(error.code),
    code: mapErrorCode(error.code),
    message: action,
    details: {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    },
  });
};
