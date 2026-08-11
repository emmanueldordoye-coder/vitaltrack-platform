import { z } from "zod";

import { limitQuerySchema } from "./common.js";

export const listProductCatalogQuerySchema = z.object({
  limit: limitQuerySchema,
  search: z.string().trim().min(1).optional(),
});
