"use client";

import { useFormState, useFormStatus } from "react-dom";

import { FormMessage } from "@/components/forms/form-message";

import type { FacilityFormState } from "./actions";

interface FacilityFormProps {
  action: (_prevState: FacilityFormState, formData: FormData) => Promise<FacilityFormState>;
  initialState: FacilityFormState;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Create facility"}
    </button>
  );
};

export const FacilityForm = ({ action, initialState }: FacilityFormProps) => {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">New facility</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          placeholder="Facility name"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="city"
          placeholder="City"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="facilityType"
          placeholder="Facility type"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="timezone"
          defaultValue="UTC"
          placeholder="Timezone"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <FormMessage status={state.status} message={state.message} />
      <SubmitButton />
    </form>
  );
};
