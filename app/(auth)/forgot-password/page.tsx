import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { companySettings } from "@/lib/company";

export const metadata: Metadata = {
  title: "Reset Staff Password",
  description: "Request an Averex staff portal password reset.",
  robots: {
    index: false,
    follow: false,
  },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="login-placeholder auth-page">
      <div className="login-panel auth-panel">
        <img src={companySettings.assets.logo} alt={companySettings.name} />
        <p className="eyebrow">PASSWORD RESET</p>
        <h1>Reset staff access</h1>
        <p>
          Enter the email linked to your staff account. Supabase will send a
          secure password-reset link if the account exists.
        </p>

        {(params.error || params.message) && (
          <p className={`auth-notice ${params.error ? "auth-notice-error" : ""}`}>
            {params.error || params.message}
          </p>
        )}

        <form className="auth-form" action={requestPasswordResetAction}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
            />
          </label>
          <button className="btn btn-primary auth-submit" type="submit">
            Send Reset Link
          </button>
        </form>

        <div className="auth-links">
          <Link href="/login">Back to Staff Portal</Link>
          <Link href="/">Return to public site</Link>
        </div>
      </div>
    </section>
  );
}
