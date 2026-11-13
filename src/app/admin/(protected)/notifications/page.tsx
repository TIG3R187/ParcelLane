import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { AdminForm } from "@/components/admin-controls";
export default async function NotificationsPage() {
  await adminPageUser();
  const rows = await getDb()
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">CUSTOMER COMMUNICATION</p>
          <h1>Notifications</h1>
          <p>
            Persistent email queue · adapter:{" "}
            {process.env.EMAIL_ADAPTER === "smtp" ? "SMTP" : "disabled"}
          </p>
        </div>
      </div>
      <p className="notice mb-7">
        Disabled adapters leave messages pending. Configure verified SMTP details before sending.
        Delivery failures can be retried up to five times. SMTP retries can occasionally deliver
        duplicates.
      </p>
      <section className="admin-panel">
        {!rows.length ? (
          <div className="admin-empty">
            <h2>No notifications queued.</h2>
            <p>Shipment requests and progress updates create messages here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.subject}</td>
                    <td>{row.recipient}</td>
                    <td>{row.status}</td>
                    <td>{row.attempts}</td>
                    <td>
                      {row.status !== "sent" && (
                        <AdminForm operation="notification" id={row.id} button="Retry email" />
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
