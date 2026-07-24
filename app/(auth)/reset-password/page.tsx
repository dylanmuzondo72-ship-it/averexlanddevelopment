import type { Metadata } from "next";
import Link from "next/link";
import { updatePasswordAction } from "@/app/auth/actions";
import { companySettings } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set New Staff Password",
  description: "Set a new Averex staff portal password.",
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  let configError = false;
  let userEmail: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email;
  } catch {
    configError = true;
  }

  return (
    <section className="login-placeholder auth-page">
      <div className="login-panel auth-panel">
        <img src={companySettings.assets.logo} alt={companySettings.name} />
        <p className="eyebrow">NEW PASSWORD</p>
        <h1>Set a new password</h1>

        {!userEmail ? (
          <>
            {configError ? (
              <p className="auth-notice auth-notice-error">
                The staff portal is not configured for this deployment yet.
              </p>
            ) : (
              <p>
                This page requires a valid password-reset session. Request a new
                reset link if your link has expired.
              </p>
            )}
            <div className="auth-links auth-links-center">
              <Link className="btn btn-primary" href="/forgot-password">
                Request Reset Link
              </Link>
              <Link href="/login">Back to Staff Portal</Link>
            </div>
          </>
        ) : (
          <>
            <p>
              Choose a strong password for {userEmail}. Passwords must contain
              at least 8 characters.
            </p>

            {(params.error || params.message) && (
              <p
                className={`auth-notice ${
                  params.error ? "auth-notice-error" : ""
                }`}
              >
                {params.error || params.message}
              </p>
            )}

            <form className="auth-form" action={updatePasswordAction}>
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Enter a new password"
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Confirm the password"
                />
              </label>
              <button className="btn btn-primary auth-submit" type="submit">
                Update Password
              </button>
            </form>
          </>
        )}
        <div className="auth-links auth-links-center">
          <Link href="/" scroll>
            Return to public website
          </Link>
        </div>
      </div>
    </section>
  );
}
