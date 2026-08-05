"use client";

import { useFormState, useFormStatus } from "react-dom";

import { FormMessage } from "@/components/forms/form-message";

import type { AuthFormState } from "./form-state";

interface SignInFormProps {
  action: (_prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  initialState: AuthFormState;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
};

export const SignInForm = ({ action, initialState }: SignInFormProps) => {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2"
        />
      </div>
      <FormMessage status={state.status} message={state.message} />
      <SubmitButton />
    </form>
  );
};
