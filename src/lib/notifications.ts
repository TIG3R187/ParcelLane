import "server-only";
import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getDb } from "@/db";

const smtpSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1),
  from: z.email(),
});
export async function deliverNotification(id: string) {
  if (process.env.EMAIL_ADAPTER !== "smtp") return { sent: false, reason: "disabled" };
  const settings = smtpSchema.safeParse({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
  });
  if (!settings.success) return { sent: false, reason: "configuration" };
  const claimed = await getDb().execute(
    sql`UPDATE notifications SET status = 'sending', attempts = attempts + 1, updated_at = now() WHERE id = ${id}::uuid AND (status IN ('pending', 'failed') OR (status = 'sending' AND updated_at < now() - interval '10 minutes')) AND attempts < 5 RETURNING recipient, subject, body`,
  );
  const item = claimed.rows[0];
  if (!item) return { sent: false, reason: "not_pending" };
  const smtp = settings.data;
  try {
    const transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      requireTLS: smtp.port !== 465,
      auth: { user: smtp.user, pass: smtp.password },
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({
      from: smtp.from,
      to: String(item.recipient),
      subject: String(item.subject),
      text: String(item.body),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await getDb().execute(
      sql`UPDATE notifications SET status = 'sent', updated_at = now() WHERE id = ${id}::uuid`,
    );
    return { sent: true, reason: "sent" };
  } catch {
    await getDb().execute(
      sql`UPDATE notifications SET status = 'failed', updated_at = now() WHERE id = ${id}::uuid`,
    );
    return { sent: false, reason: "delivery_failed" };
  }
}
