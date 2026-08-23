import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("Phase 6 reporting foundation", () => {
  it("contains every required report route", () => {
    for (const route of ["reports", "reports/invoices", "reports/outstanding", "reports/overdue", "reports/payments", "reports/quotations", "reports/monthly-summary", "reports/activity", "reports/client-statements"]) {
      expect(existsSync(join(root, "app/dashboard", route, "page.tsx"))).toBe(true);
    }
  });

  it("uses active payments as the revenue source", () => {
    expect(read("lib/dashboard/reports.ts")).toContain("payments");
    expect(read("app/dashboard/reports/payments/page.tsx")).toContain('status==="active"');
  });

  it("provides protected CSV and print entry points", () => {
    expect(read("app/api/reports/csv/route.ts")).toContain("requireDashboardUser");
    expect(existsSync(join(root, "app/dashboard/reports/print/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/dashboard/reports/client-statements/[clientId]/print/page.tsx"))).toBe(true);
  });
});
