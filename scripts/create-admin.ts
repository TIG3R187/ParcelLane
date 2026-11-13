import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { account, auditLogs, session, user } from "../src/db/schema";
import { readDatabaseUrl } from "../src/lib/env-schema";

async function main() {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
  const input = z
    .object({
      email: z.email().transform((v) => v.toLowerCase()),
      password: z.string().min(14).max(128),
    })
    .safeParse({
      email: process.env.ADMIN_BOOTSTRAP_EMAIL,
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    });
  if (!input.success)
    throw new Error(
      "Set ADMIN_BOOTSTRAP_EMAIL and a 14–128 character ADMIN_BOOTSTRAP_PASSWORD privately in .env.local.",
    );
  const db = drizzle(neon(readDatabaseUrl(process.env)));
  const [existing] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, input.data.email))
    .limit(1);
  if (existing && !process.argv.includes("--reset-password")) {
    console.log(
      "Administrator account already exists. No changes made. Use the explicit reset command only when needed.",
    );
    return;
  }
  if (existing && existing.role !== "admin")
    throw new Error("An existing non-admin account cannot be promoted by this command.");
  const password = await hashPassword(input.data.password);
  if (existing) {
    await db.batch([
      db
        .update(account)
        .set({ password, updatedAt: new Date() })
        .where(eq(account.userId, existing.id)),
      db.delete(session).where(eq(session.userId, existing.id)),
      db.insert(auditLogs).values({
        actorUserId: existing.id,
        action: "admin.password_reset",
        entityType: "user",
        entityId: existing.id,
      }),
    ]);
    console.log("Administrator password reset; all sessions revoked. No credentials were printed.");
  } else {
    const id = randomUUID();
    await db.batch([
      db.insert(user).values({
        id,
        name: "ParcelLane Administrator",
        email: input.data.email,
        emailVerified: true,
        role: "admin",
      }),
      db.insert(account).values({
        id: randomUUID(),
        accountId: id,
        userId: id,
        providerId: "credential",
        password,
      }),
      db
        .insert(auditLogs)
        .values({ actorUserId: id, action: "admin.provisioned", entityType: "user", entityId: id }),
    ]);
    console.log("Administrator account provisioned successfully. No credentials were printed.");
  }
}
main().catch(() => {
  console.error(
    "Administrator setup failed. Check the private bootstrap values, database connection, and applied migrations. Raw errors were withheld.",
  );
  process.exitCode = 1;
});
