import {
  BackendAuthError,
  isBackendAuthError,
} from "@/components/auth/backend-auth-error";
import { PurchaseOrdersList } from "@/components/purchase-orders/purchase-orders-list";
import { createServerApiClient } from "@/lib/api/server";
import type { PurchaseOrder } from "@/types/contracts";

export default async function PurchaseOrdersPage() {
  const apiClient = await createServerApiClient();
  let purchaseOrders: PurchaseOrder[];

  try {
    purchaseOrders = await apiClient.listPurchaseOrders({ limit: 50 });
  } catch (error) {
    if (isBackendAuthError(error)) {
      return <BackendAuthError error={error} />;
    }

    throw error;
  }

  return <PurchaseOrdersList purchaseOrders={purchaseOrders} />;
}
