import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set(
        "error",
        "The staff portal is not configured for this deployment yet.",
      );
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
