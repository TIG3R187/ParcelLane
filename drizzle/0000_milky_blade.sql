CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'in_progress', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('not_required', 'unpaid', 'pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('express-delivery', 'nationwide-shipping', 'international-cargo');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending_review', 'confirmed', 'collected', 'in_transit', 'delivered', 'exception', 'cancelled');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(254) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" "service_type" NOT NULL,
	"origin_zone" varchar(100) NOT NULL,
	"destination_zone" varchar(100) NOT NULL,
	"base_price_kobo" integer NOT NULL,
	"per_kg_kobo" integer NOT NULL,
	"volumetric_divisor" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'NGN' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prices_nonnegative" CHECK ("price_rules"."base_price_kobo" >= 0 AND "price_rules"."per_kg_kobo" >= 0),
	CONSTRAINT "pricing_positive_version_and_divisor" CHECK ("price_rules"."version" > 0 AND "price_rules"."volumetric_divisor" > 0),
	CONSTRAINT "pricing_ngn_currency" CHECK ("price_rules"."currency" = 'NGN')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"scope" varchar(50) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_buckets_scope_key_hash_pk" PRIMARY KEY("scope","key_hash"),
	CONSTRAINT "rate_limit_count_nonnegative" CHECK ("rate_limit_buckets"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipment_details" (
	"shipment_id" uuid PRIMARY KEY NOT NULL,
	"sender_name" varchar(150) NOT NULL,
	"sender_email" varchar(254) NOT NULL,
	"sender_phone" varchar(30) NOT NULL,
	"pickup_address" text NOT NULL,
	"recipient_name" varchar(150) NOT NULL,
	"recipient_phone" varchar(30) NOT NULL,
	"destination_address" text NOT NULL,
	"package_type" varchar(80) NOT NULL,
	"contents" text NOT NULL,
	"weight_grams" integer NOT NULL,
	"length_mm" integer NOT NULL,
	"width_mm" integer NOT NULL,
	"height_mm" integer NOT NULL,
	"delivery_instructions" text,
	CONSTRAINT "package_measurements_positive" CHECK ("shipment_details"."weight_grams" > 0 AND "shipment_details"."length_mm" > 0 AND "shipment_details"."width_mm" > 0 AND "shipment_details"."height_mm" > 0)
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"status" "shipment_status" NOT NULL,
	"public_location" varchar(100),
	"internal_note" text,
	"actor_user_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_number" varchar(40) NOT NULL,
	"service" "service_type" NOT NULL,
	"status" "shipment_status" DEFAULT 'pending_review' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'not_required' NOT NULL,
	"origin_city" varchar(100) NOT NULL,
	"destination_city" varchar(100) NOT NULL,
	"destination_country" varchar(2) DEFAULT 'NG' NOT NULL,
	"quoted_price_kobo" integer,
	"price_rule_id" uuid,
	"price_rule_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_tracking_number_unique" UNIQUE("tracking_number"),
	CONSTRAINT "shipment_price_nonnegative" CHECK ("shipments"."quoted_price_kobo" IS NULL OR "shipments"."quoted_price_kobo" >= 0)
);
--> statement-breakpoint
ALTER TABLE "shipment_details" ADD CONSTRAINT "shipment_details_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_price_rule_id_price_rules_id_fk" FOREIGN KEY ("price_rule_id") REFERENCES "public"."price_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "price_rules_route_idx" ON "price_rules" USING btree ("service","origin_zone","destination_zone","active");--> statement-breakpoint
CREATE INDEX "rate_limit_expiry_idx" ON "rate_limit_buckets" USING btree ("reset_at");--> statement-breakpoint
CREATE INDEX "shipment_events_timeline_idx" ON "shipment_events" USING btree ("shipment_id","occurred_at");--> statement-breakpoint
CREATE INDEX "shipments_status_created_idx" ON "shipments" USING btree ("status","created_at");