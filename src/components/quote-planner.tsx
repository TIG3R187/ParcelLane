import { ArrowRight, MapPin, Package, Scale, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/services";
import type { QuotePreview } from "@/lib/validation";

export function QuotePlanner({ values }: { values?: QuotePreview }) {
  return (
    <form
      action="/quote"
      method="get"
      className="grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="field-label">
        Shipping service
        <div className="select-wrap">
          <Truck />
          <select name="service" defaultValue={values?.service ?? "nationwide-shipping"}>
            {services.map((s) => (
              <option value={s.slug} key={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </label>
      <label className="field-label">
        Sending from
        <div className="select-wrap">
          <MapPin />
          <select name="from" defaultValue={values?.from ?? "Lagos"}>
            {["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Other location"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </label>
      <label className="field-label">
        Sending to
        <div className="select-wrap">
          <MapPin />
          <select name="to" defaultValue={values?.to ?? "Abuja"}>
            {["Abuja", "Lagos", "Port Harcourt", "Ibadan", "Other location", "Outside Nigeria"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </div>
      </label>
      <label className="field-label">
        Package weight
        <div className="select-wrap">
          <Scale />
          <select name="weight" defaultValue={values?.weight ?? "Under 2 kg"}>
            {["Under 2 kg", "2–5 kg", "5–10 kg", "10–25 kg", "Over 25 kg"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </label>
      <div className="flex items-center gap-2 self-end py-3 text-xs leading-5 text-muted-foreground">
        <Package className="size-5 shrink-0 text-primary" />
        <span>
          Have your packed dimensions
          <br className="hidden xl:block" /> handy for an accurate quote.
        </span>
      </div>
      <Button type="submit" className="self-end">
        Prepare a quote <ArrowRight />
      </Button>
    </form>
  );
}
