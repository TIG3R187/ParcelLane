"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function PaymentForm({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="content-card mx-auto max-w-xl"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/payments/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
          });
          const payload = await response.json();
          if (!response.ok) setError(payload.error);
          else {
            const url = new URL(payload.authorizationUrl);
            if (url.origin !== "https://checkout.paystack.com") throw new Error("Invalid checkout");
            window.location.assign(url.href);
          }
        } catch {
          setError("The payment service is unavailable. Please try later.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-5 text-xl font-extrabold">Approved shipping quote.</h2>
      {!enabled && (
        <p className="notice mb-6">
          Optional Paystack test payments are not enabled for this preview.
        </p>
      )}
      <fieldset disabled={!enabled || busy} className="space-y-5">
        <label className="form-field">
          Tracking number
          <Input name="trackingNumber" required maxLength={40} autoComplete="off" />
        </label>
        <label className="form-field">
          Private payment code
          <Input
            name="accessToken"
            type="password"
            required
            minLength={64}
            maxLength={64}
            autoComplete="off"
          />
        </label>
        <p className="form-help">
          Use the private code saved when you submitted the request. Your quote must be approved
          first. The code is never shown in public tracking.
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? "Preparing checkout…" : "Continue to test checkout"}
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
