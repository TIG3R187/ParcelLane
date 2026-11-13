import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { ArrowRight, Clock3, Package, Truck, MessageCircle, Plus } from "lucide-react";
import { getDb } from "@/db";
import { shipments } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { ShipmentTable } from "@/components/admin-table";
import { Button } from "@/components/ui/button";
import { publicRequestsEnabled } from "@/lib/site-config";
export default async function Dashboard() {
  const user = await adminPageUser();
  const db = getDb();
  const [counts, recent] = await Promise.all([
    db.execute(
      sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'pending_review')::int AS review, count(*) FILTER (WHERE status IN ('collected', 'in_transit'))::int AS moving, (SELECT count(*)::int FROM enquiries WHERE status = 'new') AS enquiries FROM shipments`,
    ),
    db.select().from(shipments).orderBy(desc(shipments.createdAt)).limit(8),
  ]);
  const values = counts.rows[0];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">YOUR OPERATIONS AT A GLANCE</p>
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p>A clear view of what’s moving and what needs your attention.</p>
        </div>
        <Button asChild>
          <Link href="/admin/shipments/new">
            <Plus /> Create shipment
          </Link>
        </Button>
      </div>
      {!publicRequestsEnabled() && (
        <p className="notice mb-7">
          Customer preview mode. Public booking and enquiry submission are closed until verified
          business details and approved service terms are configured. Administrator tools remain
          available.
        </p>
      )}
      <div className="admin-metrics">
        {[
          { label: "Total shipments", value: values?.total, icon: Package },
          { label: "Awaiting review", value: values?.review, icon: Clock3 },
          { label: "On the move", value: values?.moving, icon: Truck },
          { label: "New enquiries", value: values?.enquiries, icon: MessageCircle },
        ].map((metric) => (
          <div key={metric.label}>
            <span className="icon-tile">
              <metric.icon />
            </span>
            <p>{metric.label}</p>
            <strong>{String(metric.value ?? 0)}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <h2>Recent requests</h2>
          <Link className="text-link" href="/admin/shipments">
            All shipments <ArrowRight size={15} />
          </Link>
        </div>
        <ShipmentTable rows={recent} />
      </section>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <div className="content-card">
          <p className="eyebrow">A USEFUL NEXT STEP</p>
          <h2 className="mt-3 text-xl font-extrabold">Keep the quote clear.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Review a request, confirm the agreed price, and update its progress as it moves.
            Payments never automatically mark a shipment delivered.
          </p>
        </div>
        <div className="content-card">
          <p className="eyebrow">YOUR SHIPPING RATES</p>
          <h2 className="mt-3 text-xl font-extrabold">Pricing you can explain.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Configure route prices in integer kobo. Each change creates a new version and keeps an
            audit trail.
          </p>
          <Link href="/admin/pricing" className="text-link mt-4">
            Manage shipping prices →
          </Link>
        </div>
      </div>
    </>
  );
}
