"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  readCredentials,
  safeRedirectPath,
  validateCredentials,
} from "@/lib/auth";

export type AuthFormState = { error: string | null; notice?: string | null };

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const creds = readCredentials(formData);
  if (!creds.email || !creds.password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) {
    // Same message for unknown email and wrong password — avoids revealing
    // which accounts exist.
    return { error: "Incorrect email or password." };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const creds = readCredentials(formData);
  const invalid = validateCredentials(creds);
  if (invalid) return { error: invalid };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(creds);
  if (error) {
    return { error: "Couldn't create your account. Please try again." };
  }

  // With email confirmation enabled in Supabase, no session is returned yet.
  if (!data.session) {
    return {
      error: null,
      notice: "Check your email to confirm your account, then sign in.",
    };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
