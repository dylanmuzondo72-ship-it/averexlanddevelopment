"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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

function portalConfigMessage() {
  return "The staff portal is not configured for this deployment yet.";
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

  let supabase;

  try {
    supabase = await createClient();
  } catch {
    redirect(
      withMessage("/login", "error", portalConfigMessage(), {
        next,
      }),
    );
  }

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
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Missing preview env vars should not trap a user on the logout endpoint.
  }

  redirect(withMessage("/login", "message", "You have been signed out."));
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirect(
      withMessage("/forgot-password", "error", "Enter your account email."),
    );
  }

  let supabase;

  try {
    supabase = await createClient();
  } catch {
    redirect(
      withMessage("/forgot-password", "error", portalConfigMessage()),
    );
  }

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

  let supabase;

  try {
    supabase = await createClient();
  } catch {
    redirect(withMessage("/reset-password", "error", portalConfigMessage()));
  }

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
