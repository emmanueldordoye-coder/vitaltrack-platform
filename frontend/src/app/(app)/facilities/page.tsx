import { createServerApiClient } from "@/lib/api/server";

import { createFacilityAction, initialFacilityFormState } from "./actions";
import { FacilityForm } from "./facility-form";

export default async function FacilitiesPage() {
  const apiClient = await createServerApiClient();
  const facilities = await apiClient.listFacilities({ limit: 50 });

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Facilities</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage care sites connected to your organization.
        </p>
      </header>

      <FacilityForm action={createFacilityAction} initialState={initialFacilityFormState} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Timezone</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{facility.name}</td>
                <td className="px-4 py-3">{facility.facility_type ?? "—"}</td>
                <td className="px-4 py-3">{facility.city ?? "—"}</td>
                <td className="px-4 py-3">{facility.timezone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
