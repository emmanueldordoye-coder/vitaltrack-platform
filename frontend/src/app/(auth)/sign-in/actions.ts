"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInFormSchema } from "@/lib/validation/forms";

import type { AuthFormState } from "./form-state";

const signIn = async (
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
) =>
  supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

export const signInAction = async (
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const parsed = signInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid sign-in data.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await signIn(supabase, parsed.data);
  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect("/dashboard");
};
