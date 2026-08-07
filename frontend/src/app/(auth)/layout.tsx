import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-lighthouse-background px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.7fr)]">
        {children}
      </div>
    </main>
  );
}
