import type { Metadata } from "next";
import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { companySettings } from "@/lib/company";

export const metadata: Metadata = {
  title: "Staff Portal",
  description: "Secure Averex staff portal access.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

function AuthNotice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;

  return (
    <p className={`auth-notice ${error ? "auth-notice-error" : ""}`}>
      {error || message}
    </p>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="login-placeholder auth-page">
      <div className="login-panel auth-panel">
        <img src={companySettings.assets.logo} alt={companySettings.name} />
        <p className="eyebrow">STAFF ACCESS</p>
        <h1>Staff Portal</h1>
        <p>
          Sign in to manage Averex business records. Access is limited to
          authorised users only.
        </p>

        <AuthNotice error={params.error} message={params.message} />

        <form className="auth-form" action={signInAction}>
          <input type="hidden" name="next" value={params.next || "/dashboard"} />
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
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Enter your password"
            />
          </label>
          <button className="btn btn-primary auth-submit" type="submit">
            Sign In
          </button>
        </form>

        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/">Return to public site</Link>
        </div>
      </div>
    </section>
  );
}
