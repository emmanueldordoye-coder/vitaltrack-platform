import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "vitaltrack-frontend",
      status: "ok",
      gitSha:
        process.env.NEXT_PUBLIC_GIT_SHA ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        null,
    },
  });
}
