import { NavigationLink as Link } from "@/components/navigation-link";
import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { shipments } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { statusLabels, statusSchema } from "@/lib/domain";
import { ShipmentTable } from "@/components/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await adminPageUser();
  const params = await searchParams;
  const status = statusSchema.safeParse(params.status);
  const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(params.page);
  const q = z
    .string()
    .trim()
    .toUpperCase()
    .max(40)
    .regex(/^[A-Z0-9-]*$/)
    .catch("")
    .parse(params.q);
  const filters: SQL[] = [];
  if (status.success) filters.push(eq(shipments.status, status.data));
  if (q) filters.push(like(shipments.trackingNumber, `%${q}%`));
  if (params.kind === "quote" || params.kind === "booking")
    filters.push(eq(shipments.requestKind, params.kind));
  const rows = await getDb()
    .select()
    .from(shipments)
    .where(and(...filters))
    .orderBy(desc(shipments.createdAt))
    .limit(25)
    .offset((page - 1) * 25);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">FROM REQUEST TO ARRIVAL</p>
          <h1>Shipments & bookings</h1>
          <p>Review requests, confirm quotes, and keep the journey up to date.</p>
        </div>
        <Button asChild>
          <Link href="/admin/shipments/new">+ Create shipment</Link>
        </Button>
      </div>
      <form className="admin-filter" method="get">
        <label className="form-field">
          Tracking number
          <Input name="q" defaultValue={q} placeholder="Search tracking number" maxLength={40} />
        </label>
        <label className="form-field">
          Status
          <select name="status" defaultValue={status.success ? status.data : ""}>
            <option value="">All statuses</option>
            {statusSchema.options.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Request type
          <select name="kind" defaultValue={typeof params.kind === "string" ? params.kind : ""}>
            <option value="">All requests</option>
            <option value="booking">Bookings</option>
            <option value="quote">Quote requests</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>
      <section className="admin-panel">
        <ShipmentTable rows={rows} />
      </section>
      <div className="mt-6 flex justify-between text-xs">
        {page > 1 ? (
          <Link
            href={`?page=${page - 1}&q=${encodeURIComponent(q)}&status=${status.success ? status.data : ""}`}
          >
            ← Previous page
          </Link>
        ) : (
          <span />
        )}
        <span>Page {page}</span>
        {rows.length === 25 ? (
          <Link
            href={`?page=${page + 1}&q=${encodeURIComponent(q)}&status=${status.success ? status.data : ""}`}
          >
            Next page →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
