"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bookingSchema, formatMoney, serviceSchema } from "@/lib/domain";
import { services } from "@/lib/services";

export function ShipmentForm({
  enabled,
  admin = false,
  kind = "booking",
  service,
}: {
  enabled: boolean;
  admin?: boolean;
  kind?: "booking" | "quote";
  service?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    trackingNumber: string;
    accessToken: string;
    estimatedAmountKobo: number | null;
  } | null>(null);
  const selected = serviceSchema.safeParse(service);
  if (result)
    return (
      <div className="content-card" role="status">
        <CheckCircle2 className="mb-6 size-12 text-green-700" />
        <p className="eyebrow">REQUEST RECEIVED</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
          A good start to your journey.
        </h2>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Your request is awaiting review. Collection and final charges must be confirmed. No
          payment has been taken.
        </p>
        <dl className="mt-7 space-y-5 rounded-xl bg-muted p-5">
          <div>
            <dt className="text-xs text-muted-foreground">Tracking number</dt>
            <dd className="mt-2 break-all font-mono text-sm font-bold">{result.trackingNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Initial estimate, subject to review</dt>
            <dd className="mt-2 font-bold">{formatMoney(result.estimatedAmountKobo)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Private payment code — save securely; never share publicly
            </dt>
            <dd className="mt-2 break-all font-mono text-xs">{result.accessToken}</dd>
          </div>
        </dl>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/track?number=${result.trackingNumber}`}>
              Track your request <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/payment">Optional test payment</Link>
          </Button>
        </div>
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          A test payment requires an approved quote and this private code. Email delivery depends on
          the configured notification service.
        </p>
      </div>
    );
  return (
    <form
      className="shipment-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const data = new FormData(event.currentTarget);
        const parsed = bookingSchema.safeParse({
          ...Object.fromEntries(data),
          consent: data.get("consent") === "on",
          requestKind: kind,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message || "Check your shipment details.");
          return;
        }
        setBusy(true);
        try {
          const response = await fetch(admin ? "/api/admin" : "/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...parsed.data, ...(admin ? { operation: "create" } : {}) }),
          });
          const payload = await response.json();
          if (!response.ok) setError(payload.error || "Unable to save your request.");
          else setResult(payload);
        } catch {
          setError("We couldn’t reach the service. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {!enabled && (
        <div className="notice mb-7">
          <strong>Customer preview.</strong>
          <p>
            The request form is shown below. Submission is closed while business details and service
            terms are being finalised.
          </p>
        </div>
      )}
      <fieldset disabled={!enabled || busy} className="space-y-7">
        <section className="form-section">
          <div className="form-section-title">
            <UserRound />
            <div>
              <span>01 · THE PEOPLE</span>
              <h2>Who’s sending and receiving?</h2>
            </div>
          </div>
          <div className="form-grid">
            <Field
              label="Sender’s full name"
              name="senderName"
              autoComplete="name"
              maxLength={150}
            />
            <Field
              label="Sender’s email"
              name="senderEmail"
              type="email"
              autoComplete="email"
              maxLength={254}
            />
            <Field
              label="Sender’s phone"
              name="senderPhone"
              type="tel"
              autoComplete="tel"
              maxLength={30}
            />
            <Field label="Recipient’s full name" name="recipientName" maxLength={150} />
            <Field label="Recipient’s phone" name="recipientPhone" type="tel" maxLength={30} />
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-title">
            <MapPin />
            <div>
              <span>02 · THE JOURNEY</span>
              <h2>Where are we heading?</h2>
            </div>
          </div>
          <div className="form-grid">
            <Field
              label="Pickup city or town"
              name="originCity"
              placeholder="e.g. Lagos"
              maxLength={80}
            />
            <Field
              label="Destination city or town"
              name="destinationCity"
              placeholder="e.g. Abuja"
              maxLength={80}
            />
            <label className="form-field">
              Complete pickup address
              <textarea
                name="pickupAddress"
                required
                minLength={10}
                maxLength={800}
                rows={3}
                autoComplete="street-address"
              />
            </label>
            <label className="form-field">
              Complete delivery address
              <textarea
                name="destinationAddress"
                required
                minLength={10}
                maxLength={800}
                rows={3}
              />
            </label>
            <Field
              label="Destination country code"
              name="destinationCountry"
              defaultValue="NG"
              maxLength={2}
              pattern="[A-Za-z]{2}"
            />
            <Field
              label="Preferred collection date"
              name="pickupDate"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <p className="form-help mt-4">
            NG = Nigeria. Use the two-letter country code and international cargo for overseas
            destinations. Collection is subject to confirmation.
          </p>
        </section>
        <section className="form-section">
          <div className="form-section-title">
            <Box />
            <div>
              <span>03 · THE PACKAGE</span>
              <h2>A little detail makes a difference.</h2>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              Shipping service
              <select
                name="service"
                defaultValue={selected.success ? selected.data : "nationwide-shipping"}
              >
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Package type
              <select name="packageType">
                {["Documents", "Parcel", "Cargo", "Personal effects"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <Field
              label="Package contents"
              name="contents"
              placeholder="Describe what you’re sending"
              maxLength={500}
            />
            <Field
              label="Packed weight (kg)"
              name="weightKg"
              type="number"
              min="0.001"
              max="10000"
              step="0.001"
            />
            <Field
              label="Length (cm)"
              name="lengthCm"
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
            />
            <Field
              label="Width (cm)"
              name="widthCm"
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
            />
            <Field
              label="Height (cm)"
              name="heightCm"
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
            />
            <label className="form-field">
              Delivery instructions (optional)
              <textarea
                name="deliveryInstructions"
                maxLength={1000}
                rows={3}
                placeholder="Access or handling instructions"
              />
            </label>
          </div>
        </section>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="form-section">
          <label className="flex items-start gap-3 text-xs leading-6">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            <span>
              {admin
                ? "I have permission to record these details and have confirmed acceptance of the "
                : "I have read the "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy notice
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="underline underline-offset-2">
                shipping conditions
              </Link>
              . The contents are accurately described. I understand the request needs review before
              collection.
            </span>
          </label>
          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={17} className="text-primary" /> Private details stay private.
            </span>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" /> Saving request…
                </>
              ) : (
                <>
                  {kind === "quote" ? "Request a quote" : "Submit shipment request"} <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="form-field">
      {label}
      <Input required {...props} />
    </label>
  );
}
