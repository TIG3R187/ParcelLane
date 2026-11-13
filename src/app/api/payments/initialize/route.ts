import { z } from "zod";
import { trackingNumberSchema } from "@/lib/validation";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { initializePayment } from "@/lib/payments";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await rateLimit("payment-init", clientKey(request.headers), 5);
    const input = z
      .object({
        trackingNumber: trackingNumberSchema,
        accessToken: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .safeParse(await jsonBody(request, 2048));
    if (!input.success)
      throw new HttpError(400, "Check the tracking number and private payment code.");
    const authorizationUrl = await initializePayment(
      input.data.trackingNumber,
      input.data.accessToken,
    );
    return Response.json({ authorizationUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
