import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: { default: "ParcelLane — Deliver with confidence", template: "%s | ParcelLane" },
  description:
    "Thoughtful shipping for the things that matter. Explore express delivery, nationwide shipping in Nigeria, and international cargo with ParcelLane.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Dynamic rendering lets Next.js attach the request's CSP nonce to hydration.
  await headers();
  return (
    <html lang="en-NG">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
