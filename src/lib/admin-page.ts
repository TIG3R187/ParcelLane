import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/http";
export async function adminPageUser() {
  try {
    return await requireAdmin(await headers());
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect("/admin/login");
    throw error;
  }
}
