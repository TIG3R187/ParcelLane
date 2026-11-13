import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Privacy notice — preview draft" };
export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        title="Your information deserves care, too."
        eyebrow="PRIVACY NOTICE · PREVIEW DRAFT"
        description="This notice describes the current website preview. It is not a final privacy notice for an operating shipping service."
        breadcrumb="Privacy notice"
      />
      <section className="shell section-space">
        <div className="prose-content">
          <div className="notice mb-8">
            Draft for business and legal review before launch. The operator’s legal name, contact
            details, retention periods, processors, and applicable privacy obligations must be
            completed and approved.
          </div>
          <h2>What this preview collects</h2>
          <p>
            Public bookings, enquiries, registration, and payment collection are disabled for this
            customer preview. Tracking numbers are checked against shipment records and estimates
            use configured shipping rates. Administrators can create fictional demonstration
            shipments. Do not enter real customer information while evaluating this preview.
          </p>
          <p>
            Planner selections and a tracking number you enter may appear in the page URL, browser
            history, and server access logs. Do not enter real customer details, addresses, phone
            numbers, or payment information into the preview.
          </p>
          <h2>Technical information</h2>
          <p>
            A web server may process technical request information, such as IP address, request
            path, browser information, and request time, to deliver the website and diagnose faults.
            Hosting uses Vercel and shipment records use Neon PostgreSQL. Retention arrangements
            must be approved before launch. Administrator sign-in uses essential, secure session
            cookies. Persistent request limits store keyed hashes rather than raw IP addresses. No
            analytics, advertising trackers, or marketing cookies have been added to this preview.
          </p>
          <h2>When online shipping opens</h2>
          <p>
            A final notice must explain what sender and recipient information is needed, why it is
            processed, who receives it, how long it is retained, and how people can exercise
            applicable rights. Any payment or email provider and any international transfer
            arrangement must be identified before those features are enabled.
          </p>
          <h2>Tracking privacy</h2>
          <p>
            Public tracking is limited to shipment progress. It does not expose private addresses,
            contact numbers, administrator information, internal notes, or payment details.
          </p>
          <h2>Questions and updates</h2>
          <p>
            Verified privacy contact details will be published before launch. The{" "}
            <Link href="/contact">contact page</Link> explains the current preview status. Revisit
            this notice when the operating service is announced.
          </p>
        </div>
      </section>
    </>
  );
}
