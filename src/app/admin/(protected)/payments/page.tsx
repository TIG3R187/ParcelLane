import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { payments } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { formatMoney } from "@/lib/domain";
import { AdminForm } from "@/components/admin-controls";
export default async function PaymentsPage() {
  await adminPageUser();
  const rows = await getDb().select().from(payments).orderBy(desc(payments.createdAt)).limit(50);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">PAYSTACK · TEST MODE ONLY</p>
          <h1>Payment records</h1>
          <p>Shipment status and payment status are managed independently.</p>
        </div>
      </div>
      <p className="notice mb-7">
        Live keys are rejected. A pending initialization must be reconciled by its reference before
        retrying. A successful checkout redirect alone never confirms payment.
      </p>
      <section className="admin-panel">
        {!rows.length ? (
          <div className="admin-empty">
            <h2>No test transactions yet.</h2>
            <p>Payment remains optional. Approved quotes can use offline arrangements.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Confirmed</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="break-all font-mono text-xs">{p.reference}</td>
                    <td>{formatMoney(p.amountKobo)}</td>
                    <td>{p.status}</td>
                    <td>
                      {p.paidAt?.toLocaleString("en-NG", { timeZone: "Africa/Lagos" }) ||
                        "Not confirmed"}
                    </td>
                    <td>
                      {p.status === "pending" ? (
                        <AdminForm
                          operation="verify-payment"
                          button="Verify with Paystack"
                          fields={[
                            {
                              name: "reference",
                              label: "Reference",
                              value: p.reference,
                              type: "hidden",
                            },
                          ]}
                        />
                      ) : (
                        "Verified"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
