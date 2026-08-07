import type { Facility } from "@/types/contracts";

interface FacilitiesListProps {
  facilities: Facility[];
}

const formatFacilityType = (value: string | null) =>
  value
    ? value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Not set";

const formatLocation = (facility: Facility) => {
  const parts = [facility.city, facility.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not set";
};

const formatStatus = (isActive: boolean | null) => {
  if (isActive === false) {
    return "Inactive";
  }

  if (isActive === true) {
    return "Active";
  }

  return "Status not set";
};

const statusTone = (isActive: boolean | null) =>
  isActive === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700";

const SummaryCard = ({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "success";
}) => {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 text-lighthouse-accent"
      : "border-slate-200 text-lighthouse-primary";
  const testId = `facilities-summary-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${toneClass}`}
      data-testid={testId}
    >
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-normal">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </div>
  );
};

export const FacilitiesList = ({ facilities }: FacilitiesListProps) => {
  const activeFacilities = facilities.filter(
    (facility) => facility.is_active !== false,
  );
  const primaryFacility = facilities[0];

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
          Dentira workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-lighthouse-primary">
          Facilities
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review the care-site details assigned to the Dentira workspace,
          including location, timezone, and active status.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Visible sites"
          value={facilities.length}
          description={
            facilities.length === 0
              ? "No facilities listed for this workspace"
              : "Facilities assigned to this workspace"
          }
          tone={facilities.length > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Active sites"
          value={activeFacilities.length}
          description="Facilities listed for this workspace"
        />
        <SummaryCard
          label="Primary site"
          value={primaryFacility?.name ?? "Not set"}
          description="Main Dentira operating location"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Dentira facility directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Facility details come from the current authenticated organization.
          </p>
        </div>

        {facilities.length === 0 ? (
          <div
            className="px-5 py-12 text-center"
            data-testid="facilities-empty-state"
          >
            <p className="text-base font-semibold text-slate-900">
              No facilities listed
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              No facilities are currently listed for this workspace. Once a
              facility is assigned, its name, type, location, timezone, and
              status will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {facilities.map((facility) => (
              <article
                key={facility.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(120px,0.6fr))]"
                data-testid="facility-row"
              >
                <div>
                  <p className="text-base font-bold text-slate-900">
                    {facility.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {facility.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatFacilityType(facility.facility_type)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatLocation(facility)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Timezone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {facility.timezone ?? "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-bold ${statusTone(
                      facility.is_active,
                    )}`}
                  >
                    {formatStatus(facility.is_active)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm leading-6 text-slate-500">
        This view focuses on the Dentira facility details currently assigned to
        the workspace.
      </p>
    </section>
  );
};
