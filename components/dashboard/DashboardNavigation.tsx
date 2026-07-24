"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AppRole } from "@/lib/dashboard/permissions";
import {
  canManageStaff,
  canViewActivity,
  canViewSettings,
} from "@/lib/dashboard/permissions";
import { companySettings } from "@/lib/company";

type NavigationItem = {
  href: string;
  label: string;
  mark: string;
  visible: (role: AppRole) => boolean;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    mark: "O",
    visible: () => true,
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    mark: "C",
    visible: () => true,
  },
  {
    href: "/dashboard/staff",
    label: "Staff",
    mark: "S",
    visible: canManageStaff,
  },
  {
    href: "/dashboard/settings",
    label: "Company Settings",
    mark: "G",
    visible: canViewSettings,
  },
  {
    href: "/dashboard/activity",
    label: "Activity",
    mark: "A",
    visible: canViewActivity,
  },
  {
    href: "/dashboard/profile",
    label: "My Profile",
    mark: "P",
    visible: () => true,
  },
];

const laterModules = [
  "Land administration",
  "Quotes and invoices",
  "Payments and receipts",
  "Projects and reports",
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = navigationItems.filter((item) => item.visible(role));

  return (
    <>
      <button
        className={`dashboard-menu-button ${isOpen ? "is-open" : ""}`}
        type="button"
        aria-label={isOpen ? "Close dashboard menu" : "Open dashboard menu"}
        aria-expanded={isOpen}
        aria-controls="dashboard-sidebar"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {isOpen && (
        <button
          className="dashboard-menu-backdrop"
          type="button"
          aria-label="Close dashboard menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`dashboard-sidebar ${isOpen ? "is-open" : ""}`}
        id="dashboard-sidebar"
      >
        <Link
          className="dashboard-brand"
          href="/dashboard"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src={companySettings.assets.logo}
            alt={companySettings.name}
            width={565}
            height={205}
            priority
          />
          <span>Business System</span>
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <p className="dashboard-nav-label">Workspace</p>
          {visibleItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={active ? "is-active" : ""}
                href={item.href}
                aria-current={active ? "page" : undefined}
                key={item.href}
                onClick={() => setIsOpen(false)}
              >
                <span className="dashboard-nav-mark" aria-hidden="true">
                  {item.mark}
                </span>
                {item.label}
              </Link>
            );
          })}

          <p className="dashboard-nav-label dashboard-nav-label-later">
            Coming later
          </p>
          {laterModules.map((module) => (
            <span className="dashboard-nav-disabled" key={module}>
              {module}
            </span>
          ))}
        </nav>

        <Link
          className="dashboard-public-link"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          View public website
        </Link>
      </aside>
    </>
  );
}
