"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="shell py-24 text-center">
      <p className="eyebrow">A SMALL INTERRUPTION</p>
      <h1 className="mt-4 text-3xl font-extrabold">We couldn’t load this page.</h1>
      <p className="mt-5 text-sm text-muted-foreground">Please try again in a moment.</p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
