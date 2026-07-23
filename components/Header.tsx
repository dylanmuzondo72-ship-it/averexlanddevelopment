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
          <a
            className="nav-cta"
            href={publicWhatsAppLinks.requestConsultation}
            target="_blank"
            rel="noopener"
          >
            Request a Consultation
          </a>
        </nav>
      </div>
    </header>
  );
}
