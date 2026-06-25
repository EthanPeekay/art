"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/artworks", label: "Artworks" },
  { href: "/dashboard/posts", label: "Feed posts" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "block rounded-sm px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors",
              active
                ? "bg-charcoal text-parchment"
                : "text-ink-soft hover:bg-charcoal/8 hover:text-ink"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
