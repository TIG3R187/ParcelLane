"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Plus,
  SlidersHorizontal,
  Mail,
  CreditCard,
  Bell,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { NavigationLink } from "@/components/navigation-link";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/shipments", label: "Shipments & bookings", icon: Package },
  { href: "/admin/shipments/new", label: "Create shipment", icon: Plus },
  { href: "/admin/pricing", label: "Shipping prices", icon: SlidersHorizontal },
  { href: "/admin/enquiries", label: "Customer enquiries", icon: Mail },
  { href: "/admin/payments", label: "Test payments", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit", label: "Audit history", icon: ShieldCheck },
];

export function AdminNavigation() {
  const mobile = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const items = links.map((link) => (
    <NavigationLink
      key={link.href}
      href={link.href}
      aria-current={pathname === link.href ? "page" : undefined}
      onClick={() => mobile.current?.removeAttribute("open")}
    >
      <link.icon size={17} />
      {link.label}
    </NavigationLink>
  ));
  return (
    <>
      <nav className="admin-desktop-navigation space-y-1" aria-label="Administrator navigation">
        {items}
      </nav>
      <details
        className="admin-mobile-navigation"
        ref={mobile}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            mobile.current?.removeAttribute("open");
            mobile.current?.querySelector("summary")?.focus();
          }
        }}
      >
        <summary role="button" aria-label="Operations menu">
          Operations menu <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <nav aria-label="Mobile administrator navigation">{items}</nav>
      </details>
    </>
  );
}
