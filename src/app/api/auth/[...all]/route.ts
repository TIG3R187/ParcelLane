import { getAuth } from "@/lib/auth";
import { apiError, HttpError, jsonBody, requireSameOrigin } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace("/api/auth/", "");
    const allowed =
      request.method === "GET"
        ? path === "get-session"
        : ["sign-in/email", "sign-out"].includes(path);
    if (!allowed) throw new HttpError(404, "Not found.");
    await rateLimit("auth", clientKey(request.headers), 30);
    if (request.method === "POST") requireSameOrigin(request);
    if (path === "sign-in/email") {
      const body = z
        .object({
          email: z
            .email()
            .max(254)
            .transform((v) => v.toLowerCase()),
          password: z.string().min(1).max(128),
          rememberMe: z.boolean().optional(),
          callbackURL: z.literal("/admin").optional(),
        })
        .safeParse(await jsonBody(request, 2048));
      if (!body.success) throw new HttpError(400, "Check your email and password.");
      await rateLimit("login-ip", clientKey(request.headers), 5);
      await rateLimit("login-account", body.data.email, 5);
      request = new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(body.data),
      });
    }
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
export const GET = handle;
export const POST = handle;
