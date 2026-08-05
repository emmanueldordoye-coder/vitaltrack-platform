import {
  BackendAuthError,
  isBackendAuthError,
} from "@/components/auth/backend-auth-error";
import { FacilitiesList } from "@/components/facilities/facilities-list";
import { createServerApiClient } from "@/lib/api/server";

export default async function FacilitiesPage() {
  const apiClient = await createServerApiClient();
  let facilities;

  try {
    facilities = await apiClient.listFacilities({ limit: 50 });
  } catch (error) {
    if (isBackendAuthError(error)) {
      return <BackendAuthError error={error} />;
    }

    throw error;
  }

  return <FacilitiesList facilities={facilities} />;
}
