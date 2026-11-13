import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ShipmentForm } from "@/components/shipment-form";
import { publicRequestsEnabled } from "@/lib/site-config";
export const metadata: Metadata = { title: "Book a shipment" };
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = params.kind === "quote" ? "quote" : "booking";
  return (
    <>
      <PageIntro
        title={"Your next shipment.\nOff to a good start."}
        eyebrow={kind === "quote" ? "REQUEST A SHIPPING QUOTE" : "BOOK A SHIPMENT"}
        breadcrumb="Shipment request"
        description="Tell us about the people, the places, and the package. Every request is reviewed before collection and final pricing are confirmed."
      />
      <section className="shell section-space">
        <div className="mx-auto max-w-4xl">
          <ShipmentForm
            enabled={publicRequestsEnabled()}
            kind={kind}
            service={typeof params.service === "string" ? params.service : undefined}
          />
        </div>
      </section>
    </>
  );
}
