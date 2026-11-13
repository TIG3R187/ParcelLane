import { z } from "zod";

export const serviceSchema = z.enum([
  "express-delivery",
  "nationwide-shipping",
  "international-cargo",
]);
export const statusSchema = z.enum([
  "pending_review",
  "confirmed",
  "collected",
  "in_transit",
  "delivered",
  "exception",
  "cancelled",
]);
export type ShipmentStatus = z.infer<typeof statusSchema>;
export const statusLabels: Record<ShipmentStatus, string> = {
  pending_review: "Awaiting review",
  confirmed: "Confirmed",
  collected: "Collected",
  in_transit: "In transit",
  delivered: "Delivered",
  exception: "Delivery update needed",
  cancelled: "Cancelled",
};
const transitions: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  pending_review: ["confirmed", "cancelled"],
  confirmed: ["collected", "cancelled"],
  collected: ["in_transit", "exception"],
  in_transit: ["delivered", "exception"],
  exception: ["in_transit", "delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
export function canTransition(from: ShipmentStatus, to: ShipmentStatus) {
  return transitions[from].includes(to);
}
export const citySchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[\p{L} .'-]+$/u, "Use a city or town name, without a street address.");
const shortText = z.string().trim().min(2).max(150);
const phone = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9 ()-]+$/, "Enter a valid phone number.");
const positive = z.coerce.number().finite().positive().max(100_000);
export const quoteInputSchema = z.object({
  service: serviceSchema,
  originCity: citySchema,
  destinationCity: citySchema,
  destinationCountry: z
    .string()
    .trim()
    .toUpperCase()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .default("NG"),
  weightKg: positive.min(0.001).max(10_000),
  lengthCm: positive.min(0.1).max(1000),
  widthCm: positive.min(0.1).max(1000),
  heightCm: positive.min(0.1).max(1000),
});
export const bookingSchema = quoteInputSchema.extend({
  requestKind: z.enum(["booking", "quote"]).default("booking"),
  senderName: shortText,
  senderEmail: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  senderPhone: phone,
  recipientName: shortText,
  recipientPhone: phone,
  pickupAddress: z.string().trim().min(10).max(800),
  destinationAddress: z.string().trim().min(10).max(800),
  packageType: z.enum(["Documents", "Parcel", "Cargo", "Personal effects"]),
  contents: z.string().trim().min(3).max(500),
  deliveryInstructions: z.string().trim().max(1000).default(""),
  pickupDate: z.iso
    .date()
    .refine((v) => v >= new Date().toISOString().slice(0, 10), "Choose today or a future date."),
  consent: z.literal(true, { error: "Please confirm the privacy notice and shipping conditions." }),
  website: z.string().max(0).default(""),
});
export type BookingInput = z.infer<typeof bookingSchema>;
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export const enquirySchema = z.object({
  name: shortText,
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(15).max(3000),
  consent: z.literal(true),
  website: z.string().max(0).default(""),
});
export const priceRuleSchema = z.object({
  service: serviceSchema,
  originZone: citySchema,
  destinationZone: citySchema,
  basePriceKobo: z.coerce.number().int().min(0).max(100_000_000),
  perKgKobo: z.coerce.number().int().min(0).max(10_000_000),
  volumetricDivisor: z.coerce.number().int().min(1000).max(10_000),
  active: z.boolean().default(true),
});
export const adminOperationSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("status"),
    id: z.uuid(),
    status: statusSchema,
    internalNote: z.string().trim().max(1000).default(""),
  }),
  z.object({
    operation: z.literal("quote"),
    id: z.uuid(),
    amountKobo: z.coerce.number().int().min(100).max(100_000_000),
  }),
  z.object({ operation: z.literal("price"), ...priceRuleSchema.shape }),
  z.object({
    operation: z.literal("enquiry"),
    id: z.uuid(),
    status: z.enum(["new", "in_progress", "closed"]),
  }),
  z.object({ operation: z.literal("notification"), id: z.uuid() }),
  z.object({
    operation: z.literal("verify-payment"),
    reference: z.string().regex(/^PLPAY-[a-f0-9]{48}$/),
  }),
]);
export function calculatePrice(
  input: QuoteInput,
  rule: { basePriceKobo: number; perKgKobo: number; volumetricDivisor: number },
) {
  if (rule.volumetricDivisor <= 0 || rule.basePriceKobo < 0 || rule.perKgKobo < 0)
    throw new Error("Invalid pricing rule");
  const billableKg = Math.max(
    1,
    Math.ceil(
      Math.max(
        input.weightKg,
        (input.lengthCm * input.widthCm * input.heightCm) / rule.volumetricDivisor,
      ),
    ),
  );
  const amountKobo = rule.basePriceKobo + billableKg * rule.perKgKobo;
  if (!Number.isSafeInteger(amountKobo) || amountKobo > 100_000_000)
    throw new Error("Shipment requires an individual quote");
  return { amountKobo, billableKg };
}
export function formatMoney(amountKobo: number | null) {
  return amountKobo === null
    ? "Quote required"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
      }).format(amountKobo / 100);
}
