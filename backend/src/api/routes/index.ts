import { Router } from "express";

import { env } from "../../config/env.js";
import { requireAuthenticatedUser } from "../middleware/require-auth.js";
import { sendSuccess } from "../response.js";
import { catalogRouter } from "./catalog.js";
import { facilitiesRouter } from "./facilities.js";
import { inventoryRouter } from "./inventory.js";
import { purchaseOrdersRouter } from "./purchase-orders.js";
import { suggestedOrdersRouter } from "./suggested-orders.js";

export const apiRouter = Router();
const protectedRouter = Router();

apiRouter.get("/health", (req, res) => {
  sendSuccess(req, res, {
    service: "vitaltrack-backend-api",
    status: "ok",
    version: env.apiVersion,
  });
});

protectedRouter.use(requireAuthenticatedUser);
protectedRouter.use("/catalog", catalogRouter);
protectedRouter.use("/facilities", facilitiesRouter);
protectedRouter.use("/inventory", inventoryRouter);
protectedRouter.use("/purchase-orders", purchaseOrdersRouter);
protectedRouter.use("/suggested-orders", suggestedOrdersRouter);

apiRouter.use(protectedRouter);
