import { signInAction } from "./actions";
import { initialAuthFormState } from "./form-state";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <>
      <section className="bg-lighthouse-primary px-6 py-8 text-white sm:px-8 lg:flex lg:flex-col lg:justify-between lg:px-10 lg:py-10">
        <div>
          <div className="inline-flex h-11 items-center rounded-lg bg-white px-4 text-sm font-bold tracking-tight text-lighthouse-primary shadow-sm">
            VitalTrack
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Technologies
          </p>
        </div>

        <div className="mt-12 max-w-md lg:mt-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
            Dentira operations workspace
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal">
            Supply ordering, ready for the day.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#C6D4EA]">
            Access the secure Dentira workspace for inventory visibility,
            facility context, and purchase-order review.
          </p>
        </div>

        <dl className="mt-10 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Workspace
            </dt>
            <dd className="mt-1 font-semibold text-white">Dentira Main Office</dd>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Focus
            </dt>
            <dd className="mt-1 font-semibold text-white">Dental supply operations</dd>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Status
            </dt>
            <dd className="mt-1 font-semibold text-white">Secure access required</dd>
          </div>
        </dl>
      </section>

      <section className="flex items-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lighthouse-accent">
              Welcome back
            </p>
            <h2 className="text-3xl font-bold tracking-normal text-lighthouse-primary">
              Sign in
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Enter your VitalTrack credentials to continue to the Dentira
              supply workspace.
            </p>
          </div>
          <SignInForm action={signInAction} initialState={initialAuthFormState} />
        </div>
      </section>
    </>
  );
}
