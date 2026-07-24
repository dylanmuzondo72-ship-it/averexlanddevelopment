import { AuthScrollReset } from "@/components/AuthScrollReset";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main" className="auth-shell">
      <AuthScrollReset />
      {children}
    </main>
  );
}
