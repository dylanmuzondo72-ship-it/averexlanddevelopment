import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="dashboard-pagination" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)}>Previous</Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <p>
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </p>
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)}>Next</Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}
