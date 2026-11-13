"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowRight, PackageSearch, Search, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackingNumberSchema } from "@/lib/validation";

export function TrackingForm({
  defaultValue = "",
  standalone = false,
}: {
  defaultValue?: string;
  standalone?: boolean;
}) {
  const [error, setError] = useState("");
  const router = useRouter();
  const form = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const result = trackingNumberSchema.safeParse(
          new FormData(event.currentTarget).get("number"),
        );
        if (!result.success) {
          setError(result.error.issues[0]?.message ?? "Check your tracking number.");
          return;
        }
        setError("");
        router.push(`/track?number=${encodeURIComponent(result.data)}`);
      }}
    >
      <label className="sr-only" htmlFor={standalone ? "tracking-page-number" : "tracking-number"}>
        Tracking number
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-4 left-3.5 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            id={standalone ? "tracking-page-number" : "tracking-number"}
            name="number"
            defaultValue={defaultValue}
            placeholder="Enter your tracking number"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={40}
            required
            aria-invalid={!!error}
            aria-describedby={error ? "tracking-error" : "tracking-hint"}
          />
        </div>
        <Button type="submit">
          Track parcel <ArrowRight />
        </Button>
      </div>
      {error && (
        <p id="tracking-error" role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <p id="tracking-hint" className="mt-3 text-[11px] leading-5 text-muted-foreground">
        Use the shipment number supplied by the business. Personal details stay private.
      </p>
    </form>
  );

  if (standalone) return form;
  return (
    <div className="tracking-panel">
      <Tabs defaultValue="track">
        <TabsList aria-label="Shipment tools">
          <TabsTrigger value="track" aria-label="Track a parcel">
            <PackageSearch /> <span className="sm:hidden">Track parcel</span>
            <span className="hidden sm:inline">Track a parcel</span>
          </TabsTrigger>
          <TabsTrigger value="quote" aria-label="Request a quote">
            <Calculator /> <span className="sm:hidden">Get a quote</span>
            <span className="hidden sm:inline">Request a quote</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="track">{form}</TabsContent>
        <TabsContent value="quote">
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            A small parcel or a bigger shipment? Let’s work out the details.
          </p>
          <Button asChild className="w-full">
            <Link href="/quote">
              Plan your shipment <ArrowRight />
            </Link>
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Check available rates. No payment required for an estimate.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
