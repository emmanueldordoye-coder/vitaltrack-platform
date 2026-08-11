"use server";

import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";
import type {
  DraftPurchaseOrderActionInput,
  DraftPurchaseOrderActionResult,
} from "./action-types";

export async function createDraftPurchaseOrder(
  input: DraftPurchaseOrderActionInput,
): Promise<DraftPurchaseOrderActionResult> {
  if (!input.facilityId || !input.vendorId || input.items.length === 0) {
    return {
      status: "error",
      message: "Select catalog products before creating a draft PO.",
    };
  }

  const apiClient = await createServerApiClient();

  try {
    const purchaseOrder = await apiClient.createPurchaseOrder({
      facilityId: input.facilityId,
      vendorId: input.vendorId,
      status: "draft",
      items: input.items,
    });

    return {
      status: "success",
      message:
        "Draft PO created in VitalTrack. Supplier submission integration is not enabled in this demo environment.",
      purchaseOrder,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }
}
