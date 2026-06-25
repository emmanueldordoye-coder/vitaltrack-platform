import type { RequestContext } from "./api.js";

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export {};
