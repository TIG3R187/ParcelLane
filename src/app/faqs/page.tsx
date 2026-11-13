import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { faqs } from "@/lib/faqs";

export const metadata: Metadata = { title: "Help centre and FAQs" };
export default function FaqsPage() {
  const categories = [...new Set(faqs.map((f) => f.category))];
  return (
    <>
      <PageIntro
        title="A little clarity goes a long way."
        eyebrow="THE HELP CENTRE"
        description="A few useful answers about planning, packing, and getting your shipment ready."
        breadcrumb="Help centre"
      />
      <div className="shell section-space grid gap-12 md:grid-cols-[230px_1fr]">
        <aside>
          <p className="text-sm font-extrabold">Find your answer</p>
          <nav aria-label="FAQ categories" className="mt-5 space-y-4">
            {categories.map((c, i) => (
              <a
                className="block text-sm text-muted-foreground hover:text-primary-dark"
                href={`#faq-${i}`}
                key={c}
              >
                {c}
              </a>
            ))}
          </nav>
          <Link href="/contact" className="text-link mt-8">
            More questions? <ArrowRight size={15} />
          </Link>
        </aside>
        <div>
          {categories.map((c, i) => (
            <section id={`faq-${i}`} key={c} className="mb-10 scroll-mt-8">
              <h2 className="mb-5 text-xl font-extrabold tracking-tight">{c}</h2>
              {faqs
                .filter((f) => f.category === c)
                .map((f) => (
                  <details className="faq-item" key={f.question}>
                    <summary>
                      {f.question}
                      <span className="faq-plus" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
