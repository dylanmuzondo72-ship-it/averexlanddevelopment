import { describe, expect, it } from "vitest";
import {
  parseActivityFilters,
} from "../lib/dashboard/activity-validation";
import {
  emptyClientValues,
  parseClientFilters,
  validateClientForm,
} from "../lib/dashboard/client-validation";
import {
  canArchiveClients,
  canCreateClients,
  canEditClients,
  canEditSettings,
  canManageStaff,
  canViewActivity,
  canViewSettings,
} from "../lib/dashboard/permissions";
import { validateSettingsForm } from "../lib/dashboard/settings-validation";
import {
  parseStaffFilters,
  validateStaffUpdate,
} from "../lib/dashboard/staff-validation";

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("Phase 3 permission matrix", () => {
  it("allows only administrators and staff to create or edit clients", () => {
    expect(canCreateClients("administrator")).toBe(true);
    expect(canCreateClients("staff")).toBe(true);
    expect(canCreateClients("accountant")).toBe(false);
    expect(canCreateClients("viewer")).toBe(false);
    expect(canEditClients("administrator")).toBe(true);
    expect(canEditClients("staff")).toBe(true);
    expect(canEditClients("accountant")).toBe(false);
  });

  it("reserves archive, staff and settings edits for administrators", () => {
    expect(canArchiveClients("administrator")).toBe(true);
    expect(canArchiveClients("staff")).toBe(false);
    expect(canManageStaff("administrator")).toBe(true);
    expect(canManageStaff("accountant")).toBe(false);
    expect(canEditSettings("administrator")).toBe(true);
    expect(canEditSettings("accountant")).toBe(false);
  });

  it("gives accountants read-only settings and activity access", () => {
    expect(canViewSettings("accountant")).toBe(true);
    expect(canViewActivity("accountant")).toBe(true);
    expect(canViewSettings("staff")).toBe(false);
    expect(canViewActivity("viewer")).toBe(false);
  });
});

describe("client validation", () => {
  it("requires a display name and phone", () => {
    const result = validateClientForm(formData({ clientType: "individual" }));
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.displayName).toBeTruthy();
    expect(result.fieldErrors.phone).toBeTruthy();
  });

  it("requires a company name for company records", () => {
    const result = validateClientForm(
      formData({
        clientType: "company",
        displayName: "Example Holdings",
        phone: "+263 700 000 000",
      }),
    );
    expect(result.fieldErrors.companyName).toBeTruthy();
  });

  it("accepts a valid individual client", () => {
    const result = validateClientForm(
      formData({
        ...emptyClientValues,
        clientType: "individual",
        displayName: "Verified Test Name",
        phone: "+263 700 000 000",
        email: "person@example.com",
      }),
    );
    expect(result.valid).toBe(true);
    expect(result.values.email).toBe("person@example.com");
  });

  it("normalises unsupported filters", () => {
    expect(
      parseClientFilters({
        status: "deleted",
        type: "unknown",
        sort: "unsafe",
        page: "-5",
      }),
    ).toEqual({
      search: "",
      status: undefined,
      type: undefined,
      sort: "newest",
      page: 1,
    });
  });
});

describe("staff and settings validation", () => {
  it("requires confirmation for staff permission changes", () => {
    const result = validateStaffUpdate(
      formData({
        targetProfileId: "00000000-0000-4000-8000-000000000001",
        fullName: "Test Staff",
        role: "staff",
        status: "active",
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Confirm");
  });

  it("rejects invalid staff filters", () => {
    expect(parseStaffFilters({ role: "owner", status: "blocked" })).toMatchObject({
      role: undefined,
      status: undefined,
      page: 1,
    });
  });

  it("rejects unsafe settings URLs, prefixes and tax rates", () => {
    const result = validateSettingsForm(
      formData({
        companyName: "Averex Land Solutions",
        slogan: "Enhance Your True Land Value",
        ceoName: "B. Mungofa",
        address: "Harare",
        primaryPhone: "+263 774 041 144",
        primaryEmail: "averexls@gmail.com",
        defaultCurrency: "USD",
        defaultTaxRate: "140",
        quotePrefix: "bad prefix",
        invoicePrefix: "AVX-INV",
        receiptPrefix: "AVX-REC",
        landListingPrefix: "AVX-LAND",
        clientPrefix: "AVX-CL",
        googleMapsEmbedUrl: "javascript:alert(1)",
        socialLinks: "{}",
        taxDetails: "{}",
        bankingDetails: "{}",
        ecocashDetails: "{}",
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.defaultTaxRate).toBeTruthy();
    expect(result.fieldErrors.quotePrefix).toBeTruthy();
    expect(result.fieldErrors.googleMapsEmbedUrl).toBeTruthy();
  });
});

describe("activity filters", () => {
  it("accepts known actions and rejects unsafe date values", () => {
    expect(
      parseActivityFilters({
        action: "client.created",
        resource: "client",
        from: "not-a-date",
        page: "2",
      }),
    ).toMatchObject({
      action: "client.created",
      resource: "client",
      dateFrom: "",
      page: 2,
    });
  });
});
