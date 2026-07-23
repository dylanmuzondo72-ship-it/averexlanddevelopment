"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { companySettings } from "@/lib/company";
import { publicWhatsAppLinks } from "@/lib/whatsapp";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/available-land", label: "Available Land" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header" id="top">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Averex Land Solutions home">
          <img src={companySettings.assets.logo} alt={companySettings.name} />
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`main-nav${open ? " open" : ""}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <span className="mobile-nav-divider" aria-hidden="true" />
          <Link
            className="staff-portal-link"
            href="/login"
            aria-current={pathname === "/login" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <LockIcon />
            <span>Staff Portal</span>
          </Link>
          <a
            className="nav-cta"
            href={publicWhatsAppLinks.requestConsultation}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
          >
            Request a Consultation
          </a>
        </nav>
      </div>
    </header>
  );
}
