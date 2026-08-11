import {
  BackendAuthError,
  isBackendAuthError,
} from "@/components/auth/backend-auth-error";
import { ProductCatalogList } from "@/components/product-catalog/product-catalog-list";
import { createServerApiClient } from "@/lib/api/server";
import type { Facility, ProductCatalogItem } from "@/types/contracts";

interface ProductCatalogPageProps {
  searchParams?: {
    search?: string | string[];
  };
}

const getSearchQuery = (search?: string | string[]) => {
  const value = Array.isArray(search) ? search[0] : search;
  return value?.trim() ?? "";
};

export default async function ProductCatalogPage({
  searchParams,
}: ProductCatalogPageProps) {
  const apiClient = await createServerApiClient();
  const searchQuery = getSearchQuery(searchParams?.search);
  let items: ProductCatalogItem[];
  let facilities: Facility[];

  try {
    [items, facilities] = await Promise.all([
      apiClient.listProductCatalog({
        limit: 100,
        search: searchQuery || undefined,
      }),
      apiClient.listFacilities({
        limit: 25,
      }),
    ]);
  } catch (error) {
    if (isBackendAuthError(error)) {
      return <BackendAuthError error={error} />;
    }

    throw error;
  }

  return (
    <ProductCatalogList
      facilities={facilities}
      items={items}
      searchQuery={searchQuery}
    />
  );
}
