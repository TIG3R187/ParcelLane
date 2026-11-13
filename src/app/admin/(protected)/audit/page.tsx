import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
export default async function AuditPage() {
  await adminPageUser();
  const rows = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">A RECORD OF THE DETAILS</p>
          <h1>Audit history</h1>
          <p>The latest 100 sensitive changes. No editing or deletion is offered.</p>
        </div>
      </div>
      <section className="admin-panel">
        {!rows.length ? (
          <div className="admin-empty">
            <h2>No recorded changes yet.</h2>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td>
                    <td>{row.action}</td>
                    <td className="break-all text-xs">
                      {row.entityType} · {row.entityId}
                    </td>
                    <td className="break-all text-xs">{row.actorUserId}</td>
                    <td className="break-all font-mono text-[10px]">
                      {JSON.stringify(row.metadata || {})}
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
