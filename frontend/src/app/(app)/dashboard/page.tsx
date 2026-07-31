import { StatCard } from "@/components/dashboard/stat-card";
import { ApiClientError } from "@/lib/api/client";
import { createServerApiClient } from "@/lib/api/server";

const DashboardAuthError = ({ error }: { error: ApiClientError }) => {
  const isMissingOrganization = error.code === "AUTH_ORGANIZATION_REQUIRED";
  const isWorkspaceLookupFailure =
    error.code === "AUTH_WORKSPACE_LOOKUP_FAILED";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your account is signed in, but VitalTrack could not finish loading the
          organization workspace.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">
          {isMissingOrganization
            ? "Organization access required"
            : isWorkspaceLookupFailure
              ? "Workspace validation required"
              : "Session validation required"}
        </h2>
        <p className="mt-2">
          {isMissingOrganization
            ? "This user is not assigned to an active organization yet. Ask an administrator to add the user to the Dentira staging organization, then sign out and sign back in."
            : isWorkspaceLookupFailure
              ? "VitalTrack validated this session but could not load the organization workspace from the staging backend."
              : "VitalTrack could not validate this session with the staging backend. Sign out, clear stale staging cookies if needed, and sign back in."}
        </p>
      </div>
    </section>
  );
};

export default async function DashboardPage() {
  const apiClient = await createServerApiClient();
  let facilities;
  let inventoryItems;
  let purchaseOrders;

  try {
    [facilities, inventoryItems, purchaseOrders] = await Promise.all([
      apiClient.listFacilities({ limit: 10 }),
      apiClient.listInventoryItems({ limit: 10 }),
      apiClient.listPurchaseOrders({ limit: 10 }),
    ]);
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 401 || error.status === 403)
    ) {
      return <DashboardAuthError error={error} />;
    }

    throw error;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Operations snapshot pulled from the backend API.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Facilities" value={facilities.length} />
        <StatCard label="Inventory items" value={inventoryItems.length} />
        <StatCard label="Purchase orders" value={purchaseOrders.length} />
      </div>
    </section>
  );
}
