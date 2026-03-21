ALTER TABLE "content_alerts" ADD COLUMN "enrichment_json" jsonb;--> statement-breakpoint
ALTER TABLE "content_alerts" ADD COLUMN "last_enriched_at" timestamp;