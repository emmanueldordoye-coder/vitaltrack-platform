import type { PurchaseOrder } from "@/types/contracts";

export interface DraftPurchaseOrderActionInput {
  facilityId: string;
  vendorId: string;
  items: Array<{
    productId: string;
    sourcePurchaseOrderItemId: string;
    quantityOrdered: number;
  }>;
}

export type DraftPurchaseOrderActionResult =
  | {
      status: "success";
      message: string;
      purchaseOrder: PurchaseOrder;
    }
  | {
      status: "error";
      message: string;
    };
