import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/dashboard/permissions";
import { hasRole } from "@/lib/dashboard/permissions";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type DashboardProfile = Tables<"profiles">;

export type DashboardSession = {
  user: User;
  profile: DashboardProfile;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function requireDashboardUser(): Promise<DashboardSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, phone, role, status, last_seen_at, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.status !== "active") {
    redirect("/auth/suspended");
  }

  await supabase.rpc("touch_profile_last_seen");

  return { user, profile, supabase };
}

export async function requireRoles(
  allowedRoles: readonly AppRole[],
): Promise<DashboardSession> {
  const session = await requireDashboardUser();

  if (!hasRole(session.profile.role, allowedRoles)) {
    redirect(
      "/dashboard?error=You+do+not+have+permission+to+open+that+section.",
    );
  }

  return session;
}
