import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowUpRight, PackageCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid grid gap-10 pb-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Brand light />
            <p className="mt-5 max-w-[270px] text-sm leading-7 text-slate-300">
              Big plans. Small parcels.
              <br />
              Care in every delivery.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400">
              <PackageCheck size={15} className="text-primary" /> Based in Nigeria. Built around
              you.
            </span>
          </div>
          <div>
            <p className="footer-heading">Our services</p>
            <Link href="/services/express-delivery">Express delivery</Link>
            <Link href="/services/nationwide-shipping">Nationwide shipping</Link>
            <Link href="/services/international-cargo">International cargo</Link>
            <Link href="/quote">Request a quote</Link>
          </div>
          <div>
            <p className="footer-heading">Useful links</p>
            <Link href="/track">Track a shipment</Link>
            <Link href="/book">Book a shipment</Link>
            <Link href="/faqs">Frequently asked questions</Link>
            <Link href="/contact">
              Contact us <ArrowUpRight size={12} />
            </Link>
          </div>
          <div>
            <p className="footer-heading">ParcelLane</p>
            <Link href="/about">About us</Link>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/terms">Terms of service</Link>
            <span className="mt-5 block max-w-[210px] text-xs leading-5 text-slate-400">
              Website preview. Online shipping services are not yet open.
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} ParcelLane. Temporary brand for this project.</p>
          <p>Photography is illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
