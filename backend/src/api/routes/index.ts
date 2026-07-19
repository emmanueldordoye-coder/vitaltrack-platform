import { Router } from "express";

import { env } from "../../config/env.js";
import { requireAuthenticatedUser } from "../middleware/require-auth.js";
import { sendSuccess } from "../response.js";
import { facilitiesRouter } from "./facilities.js";
import { inventoryRouter } from "./inventory.js";
import { purchaseOrdersRouter } from "./purchase-orders.js";

export const apiRouter = Router();
const protectedRouter = Router();

apiRouter.get("/health", (req, res) => {
  sendSuccess(req, res, {
    service: "vitaltrack-backend-api",
    status: "ok",
    version: env.apiVersion,
    gitSha: env.gitSha,
  });
});

protectedRouter.use(requireAuthenticatedUser);
protectedRouter.use("/facilities", facilitiesRouter);
protectedRouter.use("/inventory", inventoryRouter);
protectedRouter.use("/purchase-orders", purchaseOrdersRouter);

apiRouter.use(protectedRouter);
