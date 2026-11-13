import "server-only";
import { siteOrigin } from "@/lib/site-config";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== siteOrigin())
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function jsonBody(request: Request, limit = 16_384): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new HttpError(415, "Use a JSON request.");
  if (Number(request.headers.get("content-length") || "0") > limit)
    throw new HttpError(413, "Request is too large.");
  if (!request.body) throw new HttpError(400, "A request body is required.");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.length;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(next.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}
export function apiError(error: unknown) {
  const status = error instanceof HttpError ? error.status : 503;
  return Response.json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "This service is temporarily unavailable. Please try again shortly.",
    },
    {
      status,
      headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
    },
  );
}
