import { z } from "zod";

export const signInFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const createFacilityFormSchema = z.object({
  name: z.string().trim().min(1, "Facility name is required.").max(255),
  city: z.string().trim().max(100).optional(),
  facilityType: z.string().trim().max(50).optional(),
  timezone: z.string().trim().max(50).default("UTC"),
});

export const createInventoryItemFormSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required.").max(100),
  name: z.string().trim().min(1, "Item name is required.").max(255),
  category: z.string().trim().max(100).optional(),
  uom: z.string().trim().max(50).default("unit"),
  currency: z.string().trim().length(3).default("USD"),
});

export type SignInFormInput = z.infer<typeof signInFormSchema>;
export type CreateFacilityFormInput = z.infer<typeof createFacilityFormSchema>;
export type CreateInventoryItemFormInput = z.infer<typeof createInventoryItemFormSchema>;
