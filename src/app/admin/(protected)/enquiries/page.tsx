import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { adminPageUser } from "@/lib/admin-page";
import { AdminForm } from "@/components/admin-controls";
export default async function EnquiriesPage() {
  await adminPageUser();
  const rows = await getDb().select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(50);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">KEEP THE CONVERSATION MOVING</p>
          <h1>Customer enquiries</h1>
          <p>The 50 most recent enquiries, with their review status.</p>
        </div>
      </div>
      <div className="space-y-5">
        {!rows.length && (
          <div className="admin-empty content-card">
            <h2>No enquiries yet.</h2>
            <p>Customer messages will appear here when submissions open.</p>
          </div>
        )}
        {rows.map((row) => (
          <section key={row.id} className="content-card grid gap-7 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                {row.name} · {row.email}
              </p>
              <h2 className="text-lg font-extrabold">{row.subject}</h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                {row.message}
              </p>
            </div>
            <AdminForm
              operation="enquiry"
              id={row.id}
              fields={[
                {
                  name: "status",
                  label: "Review status",
                  value: row.status,
                  options: [
                    { value: "new", label: "New" },
                    { value: "in_progress", label: "In progress" },
                    { value: "closed", label: "Closed" },
                  ],
                },
              ]}
            />
          </section>
        ))}
      </div>
    </>
  );
}
