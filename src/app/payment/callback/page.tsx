import Link from "next/link";
import { headers } from "next/headers";
import { PageIntro } from "@/components/page-intro";
import { paymentReferenceSchema } from "@/lib/payment-validation";
import { confirmPayment } from "@/lib/payments";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export default async function PaymentCallback({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const input = paymentReferenceSchema.safeParse((await searchParams).reference);
  let verified = false;
  if (input.success) {
    try {
      await rateLimit("payment-verify", clientKey(await headers()), 10);
      verified = await confirmPayment(input.data);
    } catch {
      /* Never treat a redirect alone as payment confirmation. */
    }
  }
  return (
    <>
      <PageIntro
        title={verified ? "Test payment verified." : "Payment verification pending."}
        eyebrow="PAYSTACK · TEST MODE"
        breadcrumb="Payment confirmation"
        description={
          verified
            ? "The backend has verified this test transaction. No shipment status was changed."
            : "We have not confirmed this payment. Please contact the business with your payment reference before trying again."
        }
      />
      <section className="shell section-space">
        <Link href="/track" className="text-link">
          Back to shipment tracking →
        </Link>
      </section>
    </>
  );
}
