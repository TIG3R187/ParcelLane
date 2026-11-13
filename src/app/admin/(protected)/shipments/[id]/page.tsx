import { notFound } from "next/navigation";
import { NavigationLink as Link } from "@/components/navigation-link";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { shipmentDetails, shipmentEvents, shipments } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { canTransition, formatMoney, statusLabels, statusSchema } from "@/lib/domain";
import { AdminForm } from "@/components/admin-controls";
export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPageUser();
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const [record] = await getDb()
    .select()
    .from(shipments)
    .innerJoin(shipmentDetails, eq(shipments.id, shipmentDetails.shipmentId))
    .where(eq(shipments.id, parsed.data))
    .limit(1);
  if (!record) notFound();
  const s = record.shipments;
  const d = record.shipment_details;
  const history = await getDb()
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, s.id))
    .orderBy(asc(shipmentEvents.occurredAt));
  const next = statusSchema.options.filter(
    (value) => value !== "confirmed" && canTransition(s.status, value),
  );
  return (
    <>
      <Link href="/admin/shipments" className="text-link mb-6">
        ← All shipments
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">SHIPMENT DETAILS · PRIVATE</p>
          <h1 className="break-all font-mono !text-2xl">{s.trackingNumber}</h1>
          <p>
            {s.originCity} → {s.destinationCity} · {s.service}
          </p>
        </div>
        <span className={`status-pill status-${s.status}`}>{statusLabels[s.status]}</span>
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-7">
          <section className="content-card">
            <h2 className="mb-6 text-xl font-extrabold">People & places</h2>
            <div className="grid gap-7 text-sm sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-extrabold">Sender</h3>
                <p>{d.senderName}</p>
                <p className="mt-2 break-all text-muted-foreground">{d.senderEmail}</p>
                <p className="mt-2 text-muted-foreground">{d.senderPhone}</p>
                <p className="mt-3 whitespace-pre-wrap leading-7">{d.pickupAddress}</p>
              </div>
              <div>
                <h3 className="mb-3 font-extrabold">Recipient</h3>
                <p>{d.recipientName}</p>
                <p className="mt-2 text-muted-foreground">{d.recipientPhone}</p>
                <p className="mt-3 whitespace-pre-wrap leading-7">{d.destinationAddress}</p>
                <p className="mt-3 text-muted-foreground">Country: {s.destinationCountry}</p>
              </div>
            </div>
          </section>
          <section className="content-card">
            <h2 className="mb-5 text-xl font-extrabold">Package & arrangements</h2>
            <dl className="detail-grid">
              {[
                ["Type", d.packageType],
                ["Contents", d.contents],
                ["Packed weight", `${d.weightGrams / 1000} kg`],
                ["Dimensions", `${d.lengthMm / 10} × ${d.widthMm / 10} × ${d.heightMm / 10} cm`],
                ["Preferred pickup", s.pickupDate || "Not specified"],
                ["Quote", formatMoney(s.quotedPriceKobo)],
                ["Payment status", s.paymentStatus],
                ["Instructions", d.deliveryInstructions || "None"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="content-card">
            <h2 className="mb-6 text-xl font-extrabold">Shipment history</h2>
            <ol className="tracking-timeline">
              {history.map((event) => (
                <li key={event.id}>
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-primary" />
                  <div>
                    <h3 className="text-sm font-extrabold">{statusLabels[event.status]}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.occurredAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
                    </p>
                    {event.internalNote && (
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
                        Internal: {event.internalNote}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="space-y-7">
          {["pending_review", "confirmed"].includes(s.status) &&
            !["paid", "pending"].includes(s.paymentStatus) && (
              <section className="content-card">
                <h2 className="mb-3 text-lg font-extrabold">Confirm the reviewed quote</h2>
                <p className="mb-5 text-xs leading-6 text-muted-foreground">
                  Use the agreed final price in kobo. Confirming approves the request; it does not
                  charge a payment.
                </p>
                <AdminForm
                  operation="quote"
                  id={s.id}
                  button="Confirm shipping quote"
                  fields={[
                    {
                      name: "amountKobo",
                      label: "Agreed price (kobo)",
                      type: "number",
                      value: s.quotedPriceKobo || undefined,
                      min: 100,
                      max: 100000000,
                    },
                  ]}
                />
              </section>
            )}
          {next.length > 0 && (
            <section className="content-card">
              <h2 className="mb-5 text-lg font-extrabold">Update progress</h2>
              <AdminForm
                operation="status"
                id={s.id}
                fields={[
                  {
                    name: "status",
                    label: "Next status",
                    options: next.map((value) => ({ value, label: statusLabels[value] })),
                  },
                  {
                    name: "internalNote",
                    label: "Internal note (private)",
                    type: "textarea",
                    required: false,
                  },
                ]}
              />
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Cancellation does not issue a payment refund. Private notes never appear in public
                tracking.
              </p>
            </section>
          )}
          <p className="notice">
            Customer details are administrator-only. Public tracking shows shipment progress without
            addresses, contacts, internal notes, or payment information.
          </p>
        </aside>
      </div>
    </>
  );
}
