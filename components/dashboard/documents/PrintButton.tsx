"use client";

export function PrintButton() {
  return (
    <button
      className="dashboard-button dashboard-button-primary document-print-button"
      type="button"
      onClick={() => window.print()}
    >
      Print / Save as PDF
    </button>
  );
}
