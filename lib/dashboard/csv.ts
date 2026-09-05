export function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Spreadsheet applications execute formulas even inside CSV quotes.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
