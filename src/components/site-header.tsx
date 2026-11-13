"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Our services" },
  { href: "/track", label: "Track a shipment" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <div className="topbar">
        <div className="shell flex items-center justify-between gap-4">
          <span>Shipping made personal. From Nigeria, with care.</span>
          <Link href="/faqs" className="inline-flex items-center gap-2 hover:text-white">
            Help centre <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <header className="site-header">
        <div className="shell flex h-[88px] items-center justify-between gap-5">
          <Brand light />
          <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  pathname === link.href ||
                  (link.href === "/services" && pathname.startsWith("/services/"))
                    ? "page"
                    : undefined
                }
                className="nav-link"
              >
                {link.label}
                {link.href === "/services" && <ChevronDown size={13} />}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/book">
                Book a shipment <ArrowRight />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-lg border border-white/25 text-white lg:hidden"
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className={cn("border-t border-white/10 bg-navy px-6 pb-6 lg:hidden", !open && "hidden")}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className="block border-b border-white/10 py-4 text-sm text-white"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="mt-5 w-full">
            <Link onClick={() => setOpen(false)} href="/book">
              Book a shipment <ArrowRight />
            </Link>
          </Button>
        </nav>
      </header>
    </>
  );
}
