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
      className="h-11 w-full rounded-md bg-lighthouse-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#087f57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lighthouse-accent disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
};

export const SignInForm = ({ action, initialState }: SignInFormProps) => {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      data-testid="sign-in-form"
      noValidate
    >
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lighthouse-accent focus:bg-white focus:ring-2 focus:ring-lighthouse-accent/20"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lighthouse-accent focus:bg-white focus:ring-2 focus:ring-lighthouse-accent/20"
        />
      </div>
      <FormMessage status={state.status} message={state.message} />
      <SubmitButton />
      <p className="text-center text-xs leading-5 text-slate-500">
        Secure access for authorized Dentira operations users.
      </p>
    </form>
  );
};
