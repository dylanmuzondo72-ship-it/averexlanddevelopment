"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateStaffProfileAction } from "@/app/dashboard/staff/actions";
import {
  appRoles,
  profileStatuses,
  roleLabels,
  type AppRole,
  type ProfileStatus,
} from "@/lib/dashboard/permissions";
import type { StaffFormState } from "@/lib/dashboard/staff-validation";

function SaveProfileButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="dashboard-button dashboard-button-secondary"
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save profile"}
    </button>
  );
}

export function StaffProfileForm({
  profile,
  currentProfileId,
}: {
  profile: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: AppRole;
    status: ProfileStatus;
  };
  currentProfileId: string;
}) {
  const [state, action] = useActionState<StaffFormState, FormData>(
    updateStaffProfileAction,
    {},
  );
  const isCurrentProfile = profile.id === currentProfileId;

  return (
    <form className="dashboard-staff-form" action={action}>
      <input type="hidden" name="targetProfileId" value={profile.id} />
      {state.formError && (
        <p className="dashboard-notice dashboard-notice-error" role="alert">
          {state.formError}
        </p>
      )}
      {state.message && (
        <p className="dashboard-notice" role="status">
          {state.message}
        </p>
      )}

      <div className="dashboard-form-grid dashboard-form-grid-three">
        <label className="dashboard-field">
          <span>Full name</span>
          <input
            name="fullName"
            defaultValue={profile.fullName}
            required
            maxLength={160}
          />
        </label>
        <label className="dashboard-field">
          <span>Phone</span>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            maxLength={40}
          />
        </label>
        <label className="dashboard-field">
          <span>Role</span>
          <select name="role" defaultValue={profile.role}>
            {appRoles.map((role) => (
              <option value={role} key={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="dashboard-field">
          <span>Status</span>
          <select name="status" defaultValue={profile.status}>
            {profileStatuses.map((status) => (
              <option
                value={status}
                key={status}
                disabled={isCurrentProfile && status === "inactive"}
              >
                {status === "active" ? "Active" : "Inactive"}
              </option>
            ))}
          </select>
        </label>
        <div className="dashboard-field dashboard-field-wide">
          <span>Authentication email</span>
          <p className="dashboard-readonly-value">{profile.email}</p>
          <p className="dashboard-field-hint">
            Authentication email and password are managed through Supabase and
            cannot be changed here.
          </p>
        </div>
      </div>

      <div className="dashboard-staff-form-footer">
        <label className="dashboard-checkbox">
          <input type="checkbox" name="confirmed" value="yes" required />
          I confirm these profile, role and status changes.
        </label>
        <SaveProfileButton />
      </div>
    </form>
  );
}
