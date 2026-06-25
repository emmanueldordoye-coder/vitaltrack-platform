import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodType } from "zod";

type ValidationSchemas = {
  body?: ZodType;
  params?: AnyZodObject;
  query?: AnyZodObject;
};

export const validate = ({ body, params, query }: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.context.validated ??= {};

      if (body) {
        req.context.validated.body = body.parse(req.body);
      }

      if (params) {
        req.context.validated.params = params.parse(req.params);
      }

      if (query) {
        req.context.validated.query = query.parse(req.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
