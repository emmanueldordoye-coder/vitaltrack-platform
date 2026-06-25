import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import morgan from "morgan";

import { apiRouter } from "./api/routes/index.js";
import { errorHandler } from "./api/middleware/error-handler.js";
import { notFoundHandler } from "./api/middleware/not-found.js";
import { assignRequestContext } from "./api/middleware/request-context.js";
import { requestTimeout } from "./api/middleware/request-timeout.js";
import { env } from "./config/env.js";

interface CreateAppOptions {
  requestContextMiddleware?: RequestHandler;
}

export const createApp = ({
  requestContextMiddleware = assignRequestContext,
}: CreateAppOptions = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      credentials: true,
      origin:
        env.corsAllowedOrigins.length > 0 ? env.corsAllowedOrigins : true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(requestTimeout);
  app.use(requestContextMiddleware);

  app.get("/", (req, res) => {
    res.json({
      success: true,
      data: {
        name: "VitalTrack Backend API",
        version: env.apiVersion,
      },
      meta: {
        requestId: req.context.requestId,
        timestamp: new Date().toISOString(),
        version: env.apiVersion,
      },
    });
  });

  app.use(`/api/${env.apiVersion}`, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
