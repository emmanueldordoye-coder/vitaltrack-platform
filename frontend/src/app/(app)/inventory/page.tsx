import {
  BackendAuthError,
  isBackendAuthError,
} from "@/components/auth/backend-auth-error";
import { InventoryCatalog } from "@/components/inventory/inventory-catalog";
import { createServerApiClient } from "@/lib/api/server";
import type { InventoryCatalogItem } from "@/types/contracts";

interface InventoryPageProps {
  searchParams?: {
    search?: string | string[];
  };
}

const getSearchQuery = (search?: string | string[]) => {
  const value = Array.isArray(search) ? search[0] : search;
  return value?.trim() ?? "";
};

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps = {}) {
  const apiClient = await createServerApiClient();
  const searchQuery = getSearchQuery(searchParams?.search);
  let items: InventoryCatalogItem[];

  try {
    items = await apiClient.listInventoryItems({
      limit: 50,
      search: searchQuery || undefined,
    });
  } catch (error) {
    if (isBackendAuthError(error)) {
      return <BackendAuthError error={error} />;
    }

    throw error;
  }

  return <InventoryCatalog items={items} searchQuery={searchQuery} />;
}
