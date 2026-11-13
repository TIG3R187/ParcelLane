import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, PackageCheck } from "lucide-react";
import { services } from "@/lib/services";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";

export const dynamicParams = false;
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  return { title: service?.name ?? "Service not found", description: service?.description };
}
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  return (
    <>
      <PageIntro
        title={service.headline}
        eyebrow={service.eyebrow}
        description={service.intro}
        breadcrumb={service.name}
        parent={{ href: "/services", label: "Our services" }}
      />
      <section className="shell section-space">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">A service for your shipment.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This service is designed for:
            </p>
            <ul className="mt-5 space-y-5">
              {service.items.map((item) => (
                <li className="flex items-start gap-3 text-sm" key={item}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-2xl font-extrabold tracking-tight">
              Before we get it moving.
            </h2>
            <ol className="mt-6 space-y-5">
              {service.details.map((detail, i) => (
                <li
                  key={detail}
                  className="flex items-start gap-4 text-sm leading-7 text-muted-foreground"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {i + 1}
                  </span>
                  {detail}
                </li>
              ))}
            </ol>
            <p className="notice mt-8">{service.note}</p>
          </div>
          <aside className="content-card h-fit bg-muted/50">
            <span className="icon-tile mb-6">
              <PackageCheck />
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Let’s work out the details.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Have the origin, destination, contents, and packed weight ready. We’ll need them to
              prepare the right shipping arrangement.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href={`/quote?service=${service.slug}`}>
                Prepare a quote <ArrowRight />
              </Link>
            </Button>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Online quotes and bookings are not yet open. This website is a service preview.
            </p>
            <Link href="/faqs" className="text-link mt-5">
              Shipping questions? <ArrowRight size={15} />
            </Link>
          </aside>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
