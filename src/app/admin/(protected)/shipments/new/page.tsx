import { adminPageUser } from "@/lib/admin-page";
import { ShipmentForm } from "@/components/shipment-form";
export default async function CreateShipmentPage() {
  await adminPageUser();
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">A NEW JOURNEY</p>
          <h1>Create a shipment</h1>
          <p>Record a customer’s request. Confirm the quote separately after review.</p>
        </div>
      </div>
      <ShipmentForm enabled admin />
    </>
  );
}
