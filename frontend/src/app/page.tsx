import { redirect } from "next/navigation";

import { getServerSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const sessionUser = await getServerSessionUser();
  redirect(sessionUser ? "/dashboard" : "/sign-in");
}
