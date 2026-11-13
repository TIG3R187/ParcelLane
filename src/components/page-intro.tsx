import { NavigationLink as Link } from "@/components/navigation-link";
import { ChevronRight } from "lucide-react";

export function PageIntro({
  title,
  eyebrow,
  description,
  breadcrumb,
  parent,
}: {
  title: string;
  eyebrow: string;
  description: string;
  breadcrumb: string;
  parent?: { href: string; label: string };
}) {
  return (
    <section className="page-heading">
      <div className="shell">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          {parent && (
            <>
              <Link href={parent.href}>{parent.label}</Link>
              <ChevronRight size={12} />
            </>
          )}
          <span aria-current="page">{breadcrumb}</span>
        </nav>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="intro">{description}</p>
      </div>
    </section>
  );
}
