import { z } from "zod";

export const trackingNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(6, "Enter at least 6 characters.")
  .max(40, "Use no more than 40 characters.")
  .regex(/^[A-Z0-9-]+$/, "Use letters, numbers, and hyphens only.");

export const quotePreviewSchema = z.object({
  service: z
    .enum(["express-delivery", "nationwide-shipping", "international-cargo"])
    .default("nationwide-shipping"),
  from: z.enum(["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Other location"]).default("Lagos"),
  to: z
    .enum(["Abuja", "Lagos", "Port Harcourt", "Ibadan", "Other location", "Outside Nigeria"])
    .default("Abuja"),
  weight: z
    .enum(["Under 2 kg", "2–5 kg", "5–10 kg", "10–25 kg", "Over 25 kg"])
    .default("Under 2 kg"),
});

export type QuotePreview = z.infer<typeof quotePreviewSchema>;
