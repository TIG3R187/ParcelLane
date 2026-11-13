import { requireAdmin } from "@/lib/auth";
import { adminOperation } from "@/lib/admin-service";
import { adminOperationSchema, bookingSchema } from "@/lib/domain";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { createShipment } from "@/lib/shipping";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await requireAdmin(request.headers);
    await rateLimit("admin-write", actor.id + clientKey(request.headers), 60);
    const raw = await jsonBody(request);
    if (raw && typeof raw === "object" && "operation" in raw && raw.operation === "create") {
      const input = bookingSchema.safeParse(raw);
      if (!input.success)
        throw new HttpError(400, input.error.issues[0]?.message || "Check the shipment details.");
      const result = await createShipment(input.data, actor.id);
      revalidatePath("/admin");
      return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const input = adminOperationSchema.safeParse(raw);
    if (!input.success)
      throw new HttpError(400, input.error.issues[0]?.message || "Check the update.");
    await adminOperation(input.data, actor);
    revalidatePath("/admin", "layout");
    return Response.json(
      { message: "Update saved." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
