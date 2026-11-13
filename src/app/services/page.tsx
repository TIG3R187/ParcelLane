import type { Metadata } from "next";
import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { ServiceCards } from "@/components/service-cards";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "Our shipping services" };
export default function ServicesPage() {
  return (
    <>
      <PageIntro
        title={"Near. Far.\nHandled with care."}
        eyebrow="OUR SHIPPING SERVICES"
        description="Documents, everyday parcels, or a bigger cargo shipment. Find the service that fits, then confirm the details before you send."
        breadcrumb="Our services"
      />
      <section className="shell section-space">
        <ServiceCards />
        <div className="mt-12 grid gap-10 rounded-xl bg-muted p-7 md:grid-cols-2 md:p-10">
          <div>
            <p className="eyebrow">NOT SURE WHERE TO START?</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Good advice starts with good details.
            </h2>
            <Link href="/quote" className="text-link mt-5">
              Prepare your quote details <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="space-y-4">
            {[
              "Pickup and destination locations",
              "A clear description of what you’re sending",
              "Packed dimensions and actual weight",
              "Your preferred collection date",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
