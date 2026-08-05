import { signInAction } from "./actions";
import { initialAuthFormState } from "./form-state";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          VitalTrack
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-600">
          Use your Supabase-backed account to access the operations workspace.
        </p>
      </div>
      <SignInForm action={signInAction} initialState={initialAuthFormState} />
    </section>
  );
}
