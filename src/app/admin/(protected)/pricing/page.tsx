import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { priceRules } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { AdminForm } from "@/components/admin-controls";
import { services } from "@/lib/services";
import { formatMoney } from "@/lib/domain";
export default async function PricingPage() {
  await adminPageUser();
  const rows = await getDb()
    .select()
    .from(priceRules)
    .orderBy(desc(priceRules.createdAt))
    .limit(100);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">CLEAR, CONFIGURABLE PRICING</p>
          <h1>Shipping prices</h1>
          <p>No demonstration rates are enabled. Add only business-approved prices.</p>
        </div>
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[1fr_1.6fr]">
        <section className="content-card">
          <h2 className="mb-5 text-xl font-extrabold">Create a rate version</h2>
          <AdminForm
            operation="price"
            button="Save active rate"
            fields={[
              {
                name: "service",
                label: "Service",
                options: services.map((s) => ({ value: s.slug, label: s.name })),
              },
              { name: "originZone", label: "Origin city or town" },
              { name: "destinationZone", label: "Destination city or town" },
              {
                name: "basePriceKobo",
                label: "Base price (kobo)",
                type: "number",
                min: 0,
                max: 100000000,
              },
              {
                name: "perKgKobo",
                label: "Per billable kg (kobo)",
                type: "number",
                min: 0,
                max: 10000000,
              },
              {
                name: "volumetricDivisor",
                label: "Volumetric divisor (cm³/kg)",
                type: "number",
                min: 1000,
                max: 10000,
              },
            ]}
          />
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            100 kobo = ₦1. Estimate = base + rounded-up billable kg × per-kg rate. Billable weight
            uses the greater of actual and volumetric weight. International cargo always requires
            review. Saving replaces the active route rate and preserves prior versions.
          </p>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>Rate history</h2>
          </div>
          {!rows.length ? (
            <div className="admin-empty">
              <h2>No configured rates yet.</h2>
              <p>Requests can still be reviewed and quoted individually.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Rate</th>
                    <th>Version</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="capitalize">
                        {row.originZone} → {row.destinationZone}
                        <span className="mt-2 block text-[10px]">{row.service}</span>
                      </td>
                      <td>
                        {formatMoney(row.basePriceKobo)} + {formatMoney(row.perKgKobo)}/kg
                      </td>
                      <td>{row.version}</td>
                      <td>{row.active ? "Active" : "Archived"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
