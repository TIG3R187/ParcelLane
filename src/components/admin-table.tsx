import { NavigationLink as Link } from "@/components/navigation-link";
import { PackageOpen, ArrowUpRight } from "lucide-react";
import { formatMoney, statusLabels, type ShipmentStatus } from "@/lib/domain";
export function ShipmentTable({
  rows,
}: {
  rows: {
    id: string;
    trackingNumber: string;
    originCity: string;
    destinationCity: string;
    status: ShipmentStatus;
    quotedPriceKobo: number | null;
    requestKind: string;
    createdAt: Date;
  }[];
}) {
  if (!rows.length)
    return (
      <div className="admin-empty">
        <PackageOpen size={40} strokeWidth={1.3} />
        <h2>No shipments here yet.</h2>
        <p>New bookings and quote requests will appear here.</p>
        <Link href="/admin/shipments/new" className="text-link mt-5">
          Create a shipment <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Shipment</th>
            <th>Route</th>
            <th>Status</th>
            <th>Quote</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link
                  href={`/admin/shipments/${row.id}`}
                  className="font-mono text-xs font-bold text-primary-dark"
                >
                  {row.trackingNumber}
                </Link>
                <span className="mt-1 block text-[10px] capitalize text-muted-foreground">
                  {row.requestKind} request
                </span>
              </td>
              <td>
                {row.originCity}
                <span className="mx-2 text-muted-foreground">→</span>
                {row.destinationCity}
              </td>
              <td>
                <span className={`status-pill status-${row.status}`}>
                  {statusLabels[row.status]}
                </span>
              </td>
              <td>{formatMoney(row.quotedPriceKobo)}</td>
              <td className="whitespace-nowrap">
                {new Intl.DateTimeFormat("en-NG", {
                  dateStyle: "medium",
                  timeZone: "Africa/Lagos",
                }).format(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
