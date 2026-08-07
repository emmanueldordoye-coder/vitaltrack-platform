import { ApiClientError } from "@/lib/api/client";

const authErrorMessages: Record<
  string,
  { category: string; title: string; message: string }
> = {
  AUTH_HEADER_MISSING: {
    category: "missing_auth_header",
    title: "Session needs attention",
    message:
      "Your secure session could not be confirmed. Sign out, then sign back in to continue.",
  },
  AUTH_HEADER_INVALID: {
    category: "malformed_auth_header",
    title: "Session needs attention",
    message:
      "Your secure session could not be confirmed. Sign out, then sign back in to continue.",
  },
  AUTH_TOKEN_INVALID: {
    category: "invalid_or_expired_jwt",
    title: "Session needs attention",
    message:
      "Your secure session could not be confirmed. Sign out, then sign back in to continue.",
  },
  AUTH_TOKEN_PROJECT_MISMATCH: {
    category: "wrong_supabase_project",
    title: "Workspace connection needs attention",
    message:
      "Your account is signed in, but VitalTrack could not connect it to the Dentira workspace. Sign out, then sign back in. If this continues, contact support.",
  },
  AUTH_WORKSPACE_LOOKUP_FAILED: {
    category: "workspace_lookup_failed",
    title: "Workspace access needs attention",
    message:
      "VitalTrack could not load the Dentira workspace for this session. Sign out, then sign back in. If this continues, contact support.",
  },
  AUTH_ORGANIZATION_REQUIRED: {
    category: "no_organization_membership",
    title: "Workspace access required",
    message:
      "This user is signed in, but is not assigned to an active Dentira workspace yet. Ask an administrator to add workspace access, then sign out and sign back in.",
  },
};

export const isBackendAuthError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError &&
  (error.status === 401 || error.status === 403);

export const BackendAuthError = ({ error }: { error: ApiClientError }) => {
  const content = authErrorMessages[error.code] ?? {
    category: "unknown_auth_failure",
    title: "Session needs attention",
    message:
      "Your secure session could not be confirmed. Sign out, then sign back in to continue.",
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Dentira workspace
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          VitalTrack could not finish loading the workspace for this signed-in
          account.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">{content.title}</h2>
        <p className="mt-2">{content.message}</p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Support reference</dt>
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
