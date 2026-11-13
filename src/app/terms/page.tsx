import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Terms of service — preview draft" };
export default function TermsPage() {
  return (
    <>
      <PageIntro
        title="Clear expectations. A better journey."
        eyebrow="TERMS OF SERVICE · PREVIEW DRAFT"
        description="Information about using this website preview. Final shipping terms will be confirmed before the service opens."
        breadcrumb="Terms of service"
      />
      <section className="shell section-space">
        <div className="prose-content">
          <div className="notice mb-8">
            This draft requires business and legal review. It does not establish final carriage
            terms, liability limits, cancellation rules, claims procedures, or consumer rights.
          </div>
          <h2>About this preview</h2>
          <p>
            ParcelLane is a temporary project name for a shipping and logistics website being
            developed for a Nigerian business. This release presents service information and
            shipment planning tools. It does not accept bookings, create shipping contracts, confirm
            collections, or process payments.
          </p>
          <h2>Service descriptions and availability</h2>
          <p>
            Express delivery, nationwide shipping, and international cargo describe the intended
            service categories. Locations, routes, collection arrangements, transit times, and
            package eligibility require confirmation before any shipment can be accepted. Website
            illustrations are not evidence of operational capacity or a service guarantee.
          </p>
          <h2>Quotes and payment</h2>
          <p>
            Configured estimates are indicative, not binding quotes. No payment collection is
            enabled in this preview. A written quote must identify applicable charges, currency,
            service conditions, and excluded taxes or duties before an operating booking is
            accepted. International cargo always requires individual review.
          </p>
          <h2>Package preparation and restricted items</h2>
          <p>
            Any future shipping arrangement must require accurate content declarations, suitable
            packaging, and compliance with origin and destination rules. Restricted goods require
            review and cannot be assumed eligible. See the <Link href="/faqs">help centre</Link> for
            planning guidance.
          </p>
          <h2>Before launch</h2>
          <p>
            Final approved terms must identify the legal operator and provide service-specific rules
            covering acceptance, prohibited items, collection, delivery attempts, customs,
            cancellation, refunds, claims, liability, complaints, and applicable rights. Do not rely
            on this draft as a shipping agreement.
          </p>
          <h2>Using the website</h2>
          <p>
            Use the preview for evaluation and shipment planning only. Do not submit sensitive
            information or attempt to gain unauthorised access. Please refer to the{" "}
            <Link href="/privacy">privacy notice</Link> for information about this preview.
          </p>
        </div>
      </section>
    </>
  );
}
