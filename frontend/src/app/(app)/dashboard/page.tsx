import {
  BackendAuthError,
  isBackendAuthError,
} from "@/components/auth/backend-auth-error";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { createServerApiClient } from "@/lib/api/server";
import type {
  Facility,
  InventoryCatalogItem,
  PurchaseOrder,
} from "@/types/contracts";

export default async function DashboardPage() {
  const apiClient = await createServerApiClient();
  let facilities: Facility[];
  let inventoryItems: InventoryCatalogItem[];
  let purchaseOrders: PurchaseOrder[];

  try {
    [facilities, inventoryItems, purchaseOrders] = await Promise.all([
      apiClient.listFacilities({ isActive: true, limit: 50 }),
      apiClient.listInventoryItems({ limit: 50 }),
      apiClient.listPurchaseOrders({ limit: 50 }),
    ]);
  } catch (error) {
    if (isBackendAuthError(error)) {
      return <BackendAuthError error={error} />;
    }

    throw error;
  }

  return (
    <DashboardOverview
      facilities={facilities}
      inventoryItems={inventoryItems}
      purchaseOrders={purchaseOrders}
    />
  );
}
