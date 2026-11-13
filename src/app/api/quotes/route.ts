import { quoteInputSchema } from "@/lib/domain";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { estimateShipment } from "@/lib/shipping";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await rateLimit("quote", clientKey(request.headers), 20);
    const input = quoteInputSchema.safeParse(await jsonBody(request, 4096));
    if (!input.success) throw new HttpError(400, "Check the locations, weight, and dimensions.");
    const estimate = await estimateShipment(input.data);
    return Response.json(
      {
        estimate: estimate
          ? { amountKobo: estimate.amountKobo, billableKg: estimate.billableKg }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
