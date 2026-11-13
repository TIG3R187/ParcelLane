import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2, PackageSearch, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { TrackingForm } from "@/components/tracking-form";
import { trackingNumberSchema } from "@/lib/validation";
import { statusLabels } from "@/lib/domain";
import { publicTracking } from "@/lib/shipping";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/http";
export const metadata: Metadata = { title: "Track a shipment" };
export const dynamic = "force-dynamic";
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const number = trackingNumberSchema.safeParse(params.number);
  let shipment: Awaited<ReturnType<typeof publicTracking>> = null;
  let message = "";
  if (number.success) {
    try {
      await rateLimit("tracking", clientKey(await headers()), 30);
      shipment = await publicTracking(number.data);
      if (!shipment)
        message =
          "We couldn’t find a shipment with that number. Check the number supplied by the business.";
    } catch (error) {
      message =
        error instanceof HttpError && error.status === 429
          ? error.message
          : "Tracking is temporarily unavailable. Please try again later.";
    }
  }
  return (
    <>
      <PageIntro
        title="Follow the things that matter."
        eyebrow="SHIPMENT TRACKING"
        breadcrumb="Track a shipment"
        description="One shipment number. A clearer view of the journey. Your private contact and payment details stay private."
      />
      <section className="shell section-space">
        <div className="mx-auto max-w-2xl">
          <div className="content-card">
            <span className="icon-tile mb-6">
              <PackageSearch />
            </span>
            <h2 className="mb-6 text-2xl font-extrabold">Track your parcel.</h2>
            <TrackingForm
              key={number.success ? number.data : "empty"}
              standalone
              defaultValue={number.success ? number.data : ""}
            />
            {message && (
              <p className="notice mt-6" role="status">
                {message}
              </p>
            )}
            {params.number !== undefined && !number.success && (
              <p role="alert" className="mt-5 text-sm text-destructive">
                That tracking number format isn’t valid. Use 6–40 letters, numbers, or hyphens.
              </p>
            )}
          </div>
          {shipment && (
            <div className="content-card mt-6">
              <div className="mb-7 border-b border-border pb-6">
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {shipment.trackingNumber}
                </p>
                <h2 className="mt-3 text-2xl font-extrabold">{statusLabels[shipment.status]}</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {shipment.service.replaceAll("-", " ")}
                </p>
              </div>
              <ol className="tracking-timeline">
                {shipment.history.map((event, i) => (
                  <li key={`${event.occurredAt.toISOString()}-${i}`}>
                    <CheckCircle2 size={21} />
                    <div>
                      <h3 className="text-sm font-extrabold">{statusLabels[event.status]}</h3>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {new Intl.DateTimeFormat("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Africa/Lagos",
                        }).format(event.occurredAt)}{" "}
                        WAT
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="mt-6 flex items-start gap-3 text-xs leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            Public tracking shows progress only. Addresses, phone numbers, internal notes, and
            payment details are never included.
          </p>
        </div>
      </section>
    </>
  );
}
