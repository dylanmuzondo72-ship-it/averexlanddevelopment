"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/login") || value.startsWith("/auth")) {
    return "/dashboard";
  }

  return value;
}

function withMessage(
  path: string,
  type: "error" | "message",
  message: string,
  extraParams: Record<string, string> = {},
) {
  const params = new URLSearchParams({ [type]: message, ...extraParams });
  return `${path}?${params.toString()}`;
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = safeNextPath(getString(formData, "next") || "/dashboard");

  if (!email || !password) {
    redirect(
      withMessage("/login", "error", "Enter your email and password.", {
        next,
      }),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      withMessage("/login", "error", "Invalid login details.", {
        next,
      }),
    );
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withMessage("/login", "message", "You have been signed out."));
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirect(
      withMessage("/forgot-password", "error", "Enter your account email."),
    );
  }

  const supabase = await createClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    redirect(
      withMessage(
        "/forgot-password",
        "error",
        "Unable to start password reset. Try again or contact an administrator.",
      ),
    );
  }

  redirect(
    withMessage(
      "/forgot-password",
      "message",
      "If an account exists, a password reset link has been sent.",
    ),
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password.length < 8) {
    redirect(
      withMessage(
        "/reset-password",
        "error",
        "Use a password with at least 8 characters.",
      ),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      withMessage("/reset-password", "error", "Passwords do not match."),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      withMessage(
        "/reset-password",
        "error",
        "The reset session expired. Request a new password reset link.",
      ),
    );
  }

  redirect(withMessage("/dashboard", "message", "Password updated."));
}
