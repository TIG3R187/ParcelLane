import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const serviceType = pgEnum("service_type", [
  "express-delivery",
  "nationwide-shipping",
  "international-cargo",
]);
export const shipmentStatus = pgEnum("shipment_status", [
  "pending_review",
  "confirmed",
  "collected",
  "in_transit",
  "delivered",
  "exception",
  "cancelled",
]);
export const paymentStatus = pgEnum("payment_status", [
  "not_required",
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const enquiryStatus = pgEnum("enquiry_status", ["new", "in_progress", "closed"]);

export const priceRules = pgTable(
  "price_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    service: serviceType("service").notNull(),
    originZone: varchar("origin_zone", { length: 100 }).notNull(),
    destinationZone: varchar("destination_zone", { length: 100 }).notNull(),
    basePriceKobo: integer("base_price_kobo").notNull(),
    perKgKobo: integer("per_kg_kobo").notNull(),
    volumetricDivisor: integer("volumetric_divisor").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("prices_nonnegative", sql`${t.basePriceKobo} >= 0 AND ${t.perKgKobo} >= 0`),
    check(
      "pricing_positive_version_and_divisor",
      sql`${t.version} > 0 AND ${t.volumetricDivisor} > 0`,
    ),
    check("pricing_ngn_currency", sql`${t.currency} = 'NGN'`),
    index("price_rules_route_idx").on(t.service, t.originZone, t.destinationZone, t.active),
    uniqueIndex("price_rules_active_route_unique")
      .on(t.service, t.originZone, t.destinationZone)
      .where(sql`${t.active} = true`),
  ],
);

// No predictable default identifier: Phase 2 must generate random tracking tokens.
// This table is NEVER returned wholesale by public tracking.
export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackingNumber: varchar("tracking_number", { length: 40 }).notNull().unique(),
    service: serviceType("service").notNull(),
    status: shipmentStatus("status").default("pending_review").notNull(),
    paymentStatus: paymentStatus("payment_status").default("not_required").notNull(),
    originCity: varchar("origin_city", { length: 100 }).notNull(),
    destinationCity: varchar("destination_city", { length: 100 }).notNull(),
    destinationCountry: varchar("destination_country", { length: 2 }).notNull().default("NG"),
    quotedPriceKobo: integer("quoted_price_kobo"),
    priceRuleId: uuid("price_rule_id").references(() => priceRules.id, { onDelete: "restrict" }),
    priceRuleVersion: integer("price_rule_version"),
    requestKind: varchar("request_kind", { length: 12 }).notNull().default("booking"),
    accessTokenHash: varchar("access_token_hash", { length: 64 }),
    pickupDate: varchar("pickup_date", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check(
      "shipment_price_nonnegative",
      sql`${t.quotedPriceKobo} IS NULL OR ${t.quotedPriceKobo} >= 0`,
    ),
    index("shipments_status_created_idx").on(t.status, t.createdAt),
  ],
);

// Kept separate from public shipment progress; these fields contain private data.
export const shipmentDetails = pgTable(
  "shipment_details",
  {
    shipmentId: uuid("shipment_id")
      .primaryKey()
      .references(() => shipments.id, { onDelete: "restrict" }),
    senderName: varchar("sender_name", { length: 150 }).notNull(),
    senderEmail: varchar("sender_email", { length: 254 }).notNull(),
    senderPhone: varchar("sender_phone", { length: 30 }).notNull(),
    pickupAddress: text("pickup_address").notNull(),
    recipientName: varchar("recipient_name", { length: 150 }).notNull(),
    recipientPhone: varchar("recipient_phone", { length: 30 }).notNull(),
    destinationAddress: text("destination_address").notNull(),
    packageType: varchar("package_type", { length: 80 }).notNull(),
    contents: text("contents").notNull(),
    weightGrams: integer("weight_grams").notNull(),
    lengthMm: integer("length_mm").notNull(),
    widthMm: integer("width_mm").notNull(),
    heightMm: integer("height_mm").notNull(),
    deliveryInstructions: text("delivery_instructions"),
  },
  (t) => [
    check(
      "package_measurements_positive",
      sql`${t.weightGrams} > 0 AND ${t.lengthMm} > 0 AND ${t.widthMm} > 0 AND ${t.heightMm} > 0`,
    ),
  ],
);

export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "restrict" }),
    status: shipmentStatus("status").notNull(),
    publicLocation: varchar("public_location", { length: 100 }),
    // Internal notes must never be included in the future public projection.
    internalNote: text("internal_note"),
    actorUserId: text("actor_user_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("shipment_events_timeline_idx").on(t.shipmentId, t.occurredAt)],
);

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    status: enquiryStatus("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("enquiries_status_created_idx").on(t.status, t.createdAt)],
);

// Updated atomically on the database server. Raw IP addresses are never stored.
export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    scope: varchar("scope", { length: 50 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.keyHash] }),
    check("rate_limit_count_nonnegative", sql`${t.count} >= 0`),
    index("rate_limit_expiry_idx").on(t.resetAt),
  ],
);

// Sensitive mutations append audit records in the same transaction/statement.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: text("entity_id").notNull(),
    // Only approved non-sensitive change metadata; never payloads or secrets.
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_entity_created_idx").on(t.entityType, t.entityId, t.createdAt)],
);

export const user = pgTable(
  "auth_user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("auth_role_allowed", sql`${t.role} IN ('admin', 'staff')`)],
);

export const session = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("auth_session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("auth_account_user_idx").on(t.userId),
    uniqueIndex("auth_account_provider_unique").on(t.providerId, t.accountId),
  ],
);

export const verification = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_verification_identifier_idx").on(t.identifier)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "restrict" }),
    reference: varchar("reference", { length: 80 }).notNull().unique(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
    status: paymentStatus("status").notNull().default("pending"),
    authorizationUrl: text("authorization_url"),
    providerTransactionId: text("provider_transaction_id").unique(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("payment_positive_amount", sql`${t.amountKobo} > 0`),
    check("payment_currency_ngn", sql`${t.currency} = 'NGN'`),
    check("payment_allowed_status", sql`${t.status} IN ('pending', 'paid', 'failed')`),
    uniqueIndex("payment_one_pending_per_shipment")
      .on(t.shipmentId)
      .where(sql`${t.status} = 'pending'`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "restrict" }),
    recipient: varchar("recipient", { length: 254 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    body: text("body").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notification_status_idx").on(t.status, t.createdAt),
    check(
      "notification_status_allowed",
      sql`${t.status} IN ('pending', 'sending', 'sent', 'failed')`,
    ),
  ],
);
