import type { Metadata } from "next";
import { NavigationLink as Link } from "@/components/navigation-link";
import { PageIntro } from "@/components/page-intro";
import { QuoteForm } from "@/components/quote-form";
import { quotePreviewSchema } from "@/lib/validation";
export const metadata: Metadata = { title: "Shipping estimates and quotes" };
export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selection = quotePreviewSchema.safeParse(params);
  return (
    <>
      <PageIntro
        title="A clearer picture of your shipment."
        eyebrow="SHIPPING ESTIMATES & QUOTES"
        breadcrumb="Shipping quote"
        description="The route, packed size, and weight tell the story. Get an estimate from configured rates, or request an individual review."
      />
      <section className="shell section-space grid items-start gap-10 lg:grid-cols-[1.5fr_0.8fr]">
        <div>
          {!selection.success && (
            <p role="alert" className="mb-5 text-sm text-destructive">
              Some selections weren’t recognised. Choose your details below.
            </p>
          )}
          <QuoteForm
            service={selection.success ? selection.data.service : undefined}
            from={selection.success ? selection.data.from : undefined}
            to={selection.success ? selection.data.to : undefined}
          />
        </div>
        <aside className="rounded-xl bg-muted p-7">
          <p className="eyebrow">NO SURPRISES</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
            The right details.
            <br />A more useful quote.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            An estimate is a starting point. Special handling, remote destinations, and
            international cargo may need a reviewed quote. No rates are invented when a route is not
            configured.
          </p>
          <Link href="/book?kind=quote" className="text-link mt-6">
            Request an individual quote →
          </Link>
        </aside>
      </section>
    </>
  );
}
