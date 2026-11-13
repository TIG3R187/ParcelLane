import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { EnquiryForm } from "@/components/enquiry-form";
import { businessConfig } from "@/lib/site-config";
export const metadata: Metadata = { title: "Contact us" };
export default function ContactPage() {
  const b = businessConfig();
  return (
    <>
      <PageIntro
        title="Let’s talk about your shipment."
        eyebrow="HERE TO HELP"
        breadcrumb="Contact us"
        description="A few useful details make it easier to find the right shipping arrangement. Tell us what you have in mind."
      />
      <section className="shell section-space grid items-start gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">A conversation starts here.</h2>
          {b.email || b.phone ? (
            <dl className="mt-7 space-y-6 text-sm">
              {b.email && (
                <div>
                  <dt className="mb-2 text-xs text-muted-foreground">Email</dt>
                  <dd>
                    <a className="text-link" href={`mailto:${b.email}`}>
                      {b.email}
                    </a>
                  </dd>
                </div>
              )}
              {b.phone && (
                <div>
                  <dt className="mb-2 text-xs text-muted-foreground">Phone</dt>
                  <dd>{b.phone}</dd>
                </div>
              )}
              {b.address && (
                <div>
                  <dt className="mb-2 text-xs text-muted-foreground">Business address</dt>
                  <dd className="leading-7">{b.address}</dd>
                </div>
              )}
              {b.coverage && (
                <div>
                  <dt className="mb-2 text-xs text-muted-foreground">Service coverage</dt>
                  <dd className="leading-7">{b.coverage}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="notice mt-6">
              Verified business contact details are being finalised for launch. This is a customer
              preview; no fictional phone number or office address has been published.
            </p>
          )}
          <p className="mt-7 text-sm leading-7 text-muted-foreground">
            Have the origin and destination, contents, dimensions, weight, and preferred collection
            date ready. Never send card details, passwords, or unnecessary identity documents.
          </p>
          <Link href="/faqs" className="text-link mt-6">
            Find answers in our help centre →
          </Link>
        </div>
        <EnquiryForm enabled={b.live} />
      </section>
    </>
  );
}
