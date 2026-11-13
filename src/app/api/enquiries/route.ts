import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { enquirySchema } from "@/lib/domain";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { publicRequestsEnabled } from "@/lib/site-config";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!publicRequestsEnabled()) throw new HttpError(503, "Online enquiries are not open yet.");
    await rateLimit("enquiry", clientKey(request.headers), 5);
    const input = enquirySchema.safeParse(await jsonBody(request, 8192));
    if (!input.success) throw new HttpError(400, "Check your name, email, message, and consent.");
    await getDb().insert(enquiries).values({
      name: input.data.name,
      email: input.data.email,
      subject: input.data.subject,
      message: input.data.message,
    });
    return Response.json(
      { message: "Your enquiry has been received. The team will review it." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
