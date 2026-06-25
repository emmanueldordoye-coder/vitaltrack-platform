import { z } from "zod";

import {
  booleanQuerySchema,
  limitQuerySchema,
  metadataSchema,
  uuidSchema,
} from "./common.js";

export const listFacilitiesQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  facilityType: z.string().trim().min(1).optional(),
  isActive: booleanQuerySchema.optional(),
  limit: limitQuerySchema,
});

export const createFacilitySchema = z.object({
  name: z.string().trim().min(1).max(255),
  facilityType: z.string().trim().min(1).max(50).optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  postalCode: z.string().trim().min(1).max(20).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(1).max(20).optional(),
  email: z.string().trim().email().max(255).optional(),
  timezone: z.string().trim().min(1).max(50).default("UTC"),
  isActive: z.boolean().default(true),
  metadata: metadataSchema.optional(),
});
