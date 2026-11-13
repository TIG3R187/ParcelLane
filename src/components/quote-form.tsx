"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, quoteInputSchema } from "@/lib/domain";
import { services } from "@/lib/services";
export function QuoteForm({
  service = "nationwide-shipping",
  from = "Lagos",
  to = "Abuja",
}: {
  service?: string;
  from?: string;
  to?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [selectedService, setSelectedService] = useState(service);
  const [error, setError] = useState("");
  const [result, setResult] = useState<
    { amountKobo: number; billableKg: number } | null | undefined
  >();
  return (
    <form
      className="content-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setResult(undefined);
        const input = quoteInputSchema.safeParse(
          Object.fromEntries(new FormData(event.currentTarget)),
        );
        if (!input.success) {
          setError("Check your locations, dimensions, and weight.");
          return;
        }
        setBusy(true);
        setSelectedService(input.data.service);
        try {
          const response = await fetch("/api/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input.data),
          });
          const payload = await response.json();
          if (!response.ok) setError(payload.error || "The estimate is unavailable.");
          else setResult(payload.estimate);
        } catch {
          setError("We couldn’t reach the service. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-section-title">
        <Calculator />
        <div>
          <span>PLAN BEFORE YOU SEND</span>
          <h2>Get a shipping estimate.</h2>
        </div>
      </div>
      <div className="form-grid">
        <label className="form-field">
          Shipping service
          <select name="service" defaultValue={service}>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Destination country code
          <Input name="destinationCountry" defaultValue="NG" required maxLength={2} />
        </label>
        <label className="form-field">
          Sending from
          <Input
            name="originCity"
            defaultValue={from === "Other location" ? "" : from}
            required
            maxLength={80}
          />
        </label>
        <label className="form-field">
          Sending to
          <Input
            name="destinationCity"
            defaultValue={["Other location", "Outside Nigeria"].includes(to) ? "" : to}
            required
            maxLength={80}
          />
        </label>
        {[
          ["Weight (kg)", "weightKg", "0.001"],
          ["Length (cm)", "lengthCm", "0.1"],
          ["Width (cm)", "widthCm", "0.1"],
          ["Height (cm)", "heightCm", "0.1"],
        ].map(([label, name, step]) => (
          <label className="form-field" key={name}>
            {label}
            <Input
              name={name}
              type="number"
              required
              min={step}
              max={name === "weightKg" ? "10000" : "1000"}
              step={step}
            />
          </label>
        ))}
      </div>
      <p className="form-help mt-5">
        Use packed dimensions. Estimates use the greater of actual and volumetric weight, rounded up
        to a whole kilogram. Availability and final charges require confirmation.
      </p>
      <Button type="submit" className="mt-6" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Calculator />} Calculate estimate
      </Button>
      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {result !== undefined && (
        <div role="status" className="notice mt-6">
          {result ? (
            <>
              <p className="text-xs">ESTIMATED SHIPPING</p>
              <p className="mt-2 text-3xl font-extrabold text-foreground">
                {formatMoney(result.amountKobo)}
              </p>
              <p className="mt-2">Billable weight: {result.billableKg} kg. Subject to review.</p>
            </>
          ) : (
            <>
              <strong>An individual quote is needed.</strong>
              <p>
                No active rate matches this route, or this shipment needs an international cargo
                review.
              </p>
            </>
          )}
          <Link className="text-link mt-4" href={`/book?kind=quote&service=${selectedService}`}>
            Request a reviewed quote <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </form>
  );
}
