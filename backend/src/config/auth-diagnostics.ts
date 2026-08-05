export interface JwtDiagnostics {
  audience?: string;
  expiresAt?: string;
  issuer?: string;
  issuerProjectRef?: string;
}

export const getSupabaseProjectRef = (supabaseUrl: string) => {
  try {
    const { hostname } = new URL(supabaseUrl);
    const [projectRef] = hostname.split(".");
    return projectRef || null;
  } catch {
    return null;
  }
};

const decodeBase64UrlJson = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
    string,
    unknown
  >;
};

export const getJwtDiagnostics = (
  accessToken: string | undefined,
): JwtDiagnostics => {
  if (!accessToken) {
    return {};
  }

  try {
    const [, payloadSegment] = accessToken.split(".");
    if (!payloadSegment) {
      return {};
    }

    const payload = decodeBase64UrlJson(payloadSegment);
    const issuer = typeof payload.iss === "string" ? payload.iss : undefined;
    const audience = typeof payload.aud === "string" ? payload.aud : undefined;
    const expiresAt =
      typeof payload.exp === "number"
        ? new Date(payload.exp * 1000).toISOString()
        : undefined;

    return {
      audience,
      expiresAt,
      issuer,
      issuerProjectRef: issuer ? getSupabaseProjectRef(issuer) ?? undefined : undefined,
    };
  } catch {
    return {};
  }
};
