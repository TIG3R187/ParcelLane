"use client";

import { NavigationLink as Link } from "@/components/navigation-link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/services", label: "Our services" },
  { href: "/track", label: "Track a shipment" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const closeMenu = () => menu.current?.removeAttribute("open");
  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        closeMenu();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const dismissOnDesktop = () => {
      if (desktop.matches) closeMenu();
    };
    document.addEventListener("pointerdown", dismissOutside);
    desktop.addEventListener("change", dismissOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      desktop.removeEventListener("change", dismissOnDesktop);
    };
  }, []);
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
            <details
              ref={menu}
              className="mobile-menu lg:hidden"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeMenu();
                  menu.current?.querySelector("summary")?.focus();
                }
              }}
            >
              <summary
                role="button"
                aria-label="Toggle navigation"
                aria-controls="mobile-menu"
                className="mobile-menu-toggle"
              >
                <Menu className="menu-open-icon" size={21} aria-hidden="true" />
                <X className="menu-close-icon" size={21} aria-hidden="true" />
              </summary>
              <nav id="mobile-menu" aria-label="Mobile navigation" className="mobile-menu-panel">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="block border-b border-white/10 py-4 text-sm text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild className="mt-5 w-full">
                  <Link href="/book" onClick={closeMenu}>
                    Book a shipment <ArrowRight />
                  </Link>
                </Button>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
