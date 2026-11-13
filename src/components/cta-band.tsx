import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="shell mb-20">
      <div className="cta-band">
        <div className="flex items-center gap-6">
          <span className="hidden rounded-2xl border border-white/20 p-4 sm:block">
            <PackageOpen size={34} strokeWidth={1.3} />
          </span>
          <div>
            <p className="mb-2 text-xs font-semibold text-white">YOUR NEXT SHIPMENT STARTS HERE</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Let’s get it moving.
            </h2>
          </div>
        </div>
        <Button asChild variant="secondary" size="lg">
          <Link href="/book">
            Plan a shipment <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
