import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>
          The page or land listing you requested is not published on the Averex
          website.
        </p>
        <Link className="btn btn-primary" href="/">
          Return Home
        </Link>
      </div>
    </section>
  );
}
