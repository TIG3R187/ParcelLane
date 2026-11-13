import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="shell py-24 text-center">
      <PackageOpen size={50} strokeWidth={1.4} className="mx-auto mb-7 text-primary" />
      <p className="eyebrow">404 · A SMALL DETOUR</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">This page isn’t on our route.</h1>
      <p className="mt-5 text-sm text-muted-foreground">
        Let’s get you back to somewhere familiar.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          Back to home <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
