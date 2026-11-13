import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, MessageCircle, PackageCheck } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "About us" };
export default function AboutPage() {
  return (
    <>
      <PageIntro
        title={"Your parcel has a story.\nWe care where it goes."}
        eyebrow="GET TO KNOW PARCELLANE"
        description="A shipping experience built around people, clear conversations, and the details that make a difference."
        breadcrumb="About us"
      />
      <section className="shell section-space">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/4] overflow-hidden rounded-2xl">
            <Image
              src="/images/parcel-lane-hero.webp"
              alt="A shipping professional ready to handle a carefully packed parcel"
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-cover object-[80%_center]"
            />
          </div>
          <div className="prose-content">
            <h2>Shipping should feel personal.</h2>
            <p>
              There is always more to a shipment than the box. A customer waiting for an order. A
              family expecting a gift. A business getting something important to the right place.
            </p>
            <p>
              ParcelLane is the working name for a small Nigerian logistics business’s new website.
              This project brings express delivery, nationwide shipping, and international cargo
              information together in one clear, useful place.
            </p>
            <p>
              Our guiding approach is to keep arrangements understandable, confirm availability
              before making promises, and treat the details of every shipment with care.
            </p>
            <p className="notice mt-6">
              This is a website preview. Company registration details, verified contact information,
              operating coverage, and final service terms must be confirmed before launch. The
              photography is illustrative.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Care in the details",
              text: "Clear information about your parcel, its requirements, and the people waiting for it.",
            },
            {
              icon: MessageCircle,
              title: "Clear conversations",
              text: "An agreed quote and delivery arrangement before a shipment gets moving.",
            },
            {
              icon: PackageCheck,
              title: "Practical solutions",
              text: "A suitable shipping approach for documents, parcels, and larger cargo enquiries.",
            },
          ].map((v) => (
            <div key={v.title} className="content-card">
              <v.icon className="mb-5 text-primary" size={25} />
              <h2 className="text-lg font-extrabold">{v.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
