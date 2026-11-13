"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationLink as Link } from "@/components/navigation-link";
export function EnquiryForm({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="content-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = event.currentTarget;
        const data = new FormData(form);
        try {
          const response = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...Object.fromEntries(data),
              consent: data.get("consent") === "on",
            }),
          });
          const payload = await response.json();
          if (!response.ok) setError(payload.error);
          else {
            setMessage(payload.message);
            form.reset();
          }
        } catch {
          setError("We couldn’t send your enquiry. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-5 text-xl font-extrabold">Send an enquiry.</h2>
      {!enabled && (
        <p className="notice mb-6">
          Online enquiries are closed in this customer preview. Verified contact details will be
          added before launch.
        </p>
      )}
      <fieldset disabled={!enabled || busy} className="space-y-5">
        <label className="form-field">
          Your name
          <Input name="name" required maxLength={150} autoComplete="name" />
        </label>
        <label className="form-field">
          Email address
          <Input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
        <label className="form-field">
          Subject
          <Input name="subject" required minLength={3} maxLength={200} />
        </label>
        <label className="form-field">
          Your message
          <textarea name="message" required minLength={15} maxLength={3000} rows={5} />
        </label>
        <div className="honeypot" aria-hidden="true">
          <input aria-label="Website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="flex items-start gap-3 text-xs leading-6">
          <input type="checkbox" name="consent" required className="mt-1 size-4 accent-primary" />
          <span>
            I agree to the{" "}
            <Link href="/privacy" className="underline">
              privacy notice
            </Link>{" "}
            and to being contacted about this enquiry.
          </span>
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send enquiry"}
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice mt-5">
          {message}
        </p>
      )}
    </form>
  );
}
