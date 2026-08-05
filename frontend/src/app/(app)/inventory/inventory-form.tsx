"use client";

import { useFormState, useFormStatus } from "react-dom";

import { FormMessage } from "@/components/forms/form-message";

import type { InventoryFormState } from "./form-state";

interface InventoryFormProps {
  action: (_prevState: InventoryFormState, formData: FormData) => Promise<InventoryFormState>;
  initialState: InventoryFormState;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Create inventory item"}
    </button>
  );
};

export const InventoryForm = ({ action, initialState }: InventoryFormProps) => {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">New inventory item</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="sku"
          placeholder="SKU"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="category"
          placeholder="Category"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="uom"
          defaultValue="unit"
          placeholder="UOM"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="currency"
          defaultValue="USD"
          placeholder="Currency"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <FormMessage status={state.status} message={state.message} />
      <SubmitButton />
    </form>
  );
};
