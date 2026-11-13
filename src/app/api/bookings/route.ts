import { bookingSchema } from "@/lib/domain";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createShipment } from "@/lib/shipping";
import { publicRequestsEnabled } from "@/lib/site-config";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!publicRequestsEnabled())
      throw new HttpError(
        503,
        "Online requests are not open yet. Please use the published business contact details.",
      );
    await rateLimit("booking", clientKey(request.headers), 5);
    const input = bookingSchema.safeParse(await jsonBody(request));
    if (!input.success)
      throw new HttpError(400, input.error.issues[0]?.message || "Check your shipment details.");
    const result = await createShipment(input.data);
    return Response.json(
      {
        trackingNumber: result.trackingNumber,
        accessToken: result.accessToken,
        estimatedAmountKobo: result.estimatedAmountKobo,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
