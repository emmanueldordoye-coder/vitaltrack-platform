"use server";

import { revalidatePath } from "next/cache";

import { createServerApiClient } from "@/lib/api/server";
import { createInventoryItemFormSchema } from "@/lib/validation/forms";

import type { InventoryFormState } from "./form-state";

export const createInventoryItemAction = async (
  _prevState: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> => {
  const parsed = createInventoryItemFormSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    category: formData.get("category"),
    uom: formData.get("uom"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid inventory item data.",
    };
  }

  const apiClient = await createServerApiClient();
  await apiClient.createInventoryItem({
    ...parsed.data,
    currency: parsed.data.currency.toUpperCase(),
  });
  revalidatePath("/inventory");

  return {
    status: "success",
    message: "Inventory item created.",
  };
};
