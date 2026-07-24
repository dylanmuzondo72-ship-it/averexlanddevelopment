import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // The redirect must still complete if auth configuration is unavailable.
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set(
    "error",
    "Your staff access is inactive. Contact an administrator for assistance.",
  );

  return NextResponse.redirect(redirectUrl);
}
