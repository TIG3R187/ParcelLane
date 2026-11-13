import { PageIntro } from "@/components/page-intro";
import { PaymentForm } from "@/components/payment-form";
export default function PaymentPage() {
  return (
    <>
      <PageIntro
        title="One final detail."
        eyebrow="OPTIONAL PAYMENT · TEST MODE"
        breadcrumb="Test payment"
        description="Pay an approved quote through Paystack’s hosted test checkout. Live payments are not enabled."
      />
      <section className="shell section-space">
        <PaymentForm
          enabled={
            process.env.PAYSTACK_ENABLED === "true" &&
            !!process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_")
          }
        />
      </section>
    </>
  );
}
