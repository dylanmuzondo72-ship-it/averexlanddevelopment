import { describe, expect, it } from "vitest";
import { safeNextPath } from "../lib/auth-redirect";
import { csvCell } from "../lib/dashboard/csv";
describe("Integration security regressions",()=>{
  it.each(["//evil.invalid","/\\evil.invalid","/\n/evil.invalid","https://evil.invalid","/auth/logout"])("blocks unsafe auth redirect %s",value=>expect(safeNextPath(value)).toBe("/dashboard"));
  it("preserves internal recovery redirects",()=>expect(safeNextPath("/reset-password?flow=recovery")).toBe("/reset-password?flow=recovery"));
  it.each(["=1+1"," +SUM(1,2)","\t@SUM(1)","-1+2"])("escapes spreadsheet formula %s",value=>expect(csvCell(value)).toBe(`"'${value}"`));
  it("preserves ordinary text and CSV quoting",()=>expect(csvCell('A "client"')).toBe('"A ""client"""'));
});
