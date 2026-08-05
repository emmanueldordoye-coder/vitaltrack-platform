import { ApiClientError } from "@/lib/api/client";

const authErrorMessages: Record<
  string,
  { category: string; title: string; message: string }
> = {
  AUTH_HEADER_MISSING: {
    category: "missing_auth_header",
    title: "Session validation required",
    message:
      "VitalTrack could not send a bearer token to the staging backend. Sign out, clear stale staging cookies if needed, and sign back in.",
  },
  AUTH_HEADER_INVALID: {
    category: "malformed_auth_header",
    title: "Session validation required",
    message:
      "VitalTrack sent an invalid authorization header to the staging backend. Sign out, clear stale staging cookies if needed, and sign back in.",
  },
  AUTH_TOKEN_INVALID: {
    category: "invalid_or_expired_jwt",
    title: "Session validation required",
    message:
      "VitalTrack could not validate this session with the staging backend. Sign out, clear stale staging cookies if needed, and sign back in.",
  },
  AUTH_TOKEN_PROJECT_MISMATCH: {
    category: "wrong_supabase_project",
    title: "Backend Supabase project mismatch",
    message:
      "This user is signed in, but the staging backend is configured for a different Supabase project than the frontend session.",
  },
  AUTH_WORKSPACE_LOOKUP_FAILED: {
    category: "workspace_lookup_failed",
    title: "Workspace validation required",
    message:
      "VitalTrack validated this session but could not load the organization workspace from the staging backend.",
  },
  AUTH_ORGANIZATION_REQUIRED: {
    category: "no_organization_membership",
    title: "Organization access required",
    message:
      "This user is not assigned to an active organization yet. Ask an administrator to add the user to the Dentira staging organization, then sign out and sign back in.",
  },
};

export const isBackendAuthError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError &&
  (error.status === 401 || error.status === 403);

export const BackendAuthError = ({ error }: { error: ApiClientError }) => {
  const content = authErrorMessages[error.code] ?? {
    category: "unknown_auth_failure",
    title: "Session validation required",
    message:
      "VitalTrack could not validate this session with the staging backend. Sign out, clear stale staging cookies if needed, and sign back in.",
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Workspace</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your account is signed in, but VitalTrack could not finish loading the
          organization workspace.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">{content.title}</h2>
        <p className="mt-2">{content.message}</p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Diagnostic category</dt>
            <dd>{content.category}</dd>
          </div>
          <div>
            <dt className="font-medium">HTTP status</dt>
            <dd>{error.status}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
