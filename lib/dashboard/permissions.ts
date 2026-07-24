import type { Enums } from "../supabase/database.types";

export type AppRole = Enums<"app_role">;
export type ProfileStatus = Enums<"profile_status">;

export const appRoles: AppRole[] = [
  "administrator",
  "staff",
  "accountant",
  "viewer",
];

export const profileStatuses: ProfileStatus[] = ["active", "inactive"];

export const roleLabels: Record<AppRole, string> = {
  administrator: "Administrator",
  staff: "Staff",
  accountant: "Accountant",
  viewer: "Viewer",
};

export function canCreateClients(role: AppRole) {
  return role === "administrator" || role === "staff";
}

export function canEditClients(role: AppRole) {
  return role === "administrator" || role === "staff";
}

export function canArchiveClients(role: AppRole) {
  return role === "administrator";
}

export function canManageStaff(role: AppRole) {
  return role === "administrator";
}

export function canViewSettings(role: AppRole) {
  return role === "administrator" || role === "accountant";
}

export function canEditSettings(role: AppRole) {
  return role === "administrator";
}

export function canViewActivity(role: AppRole) {
  return role === "administrator" || role === "accountant";
}

export function canCreateQuotations(role: AppRole) {
  return role === "administrator" || role === "staff";
}

export function canManageQuotations(role: AppRole) {
  return role === "administrator" || role === "staff";
}

export function canCreateInvoices(role: AppRole) {
  return role === "administrator" || role === "accountant";
}

export function canManageInvoices(role: AppRole) {
  return role === "administrator" || role === "accountant";
}

export function hasRole(role: AppRole, allowedRoles: readonly AppRole[]) {
  return allowedRoles.includes(role);
}
