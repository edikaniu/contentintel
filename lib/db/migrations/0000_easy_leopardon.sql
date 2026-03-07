CREATE TABLE "approval_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"stage_name" varchar(255) NOT NULL,
	"required_role" varchar(50) NOT NULL,
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"competitor_domain" varchar(255) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"batch_date" timestamp NOT NULL,
	"alert_type" varchar(100) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"current_metrics_json" jsonb,
	"previous_metrics_json" jsonb,
	"suggested_action" text,
	"priority_score" real,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"hubspot_id" varchar(255),
	"url" text NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(500),
	"publish_date" timestamp,
	"last_updated" timestamp,
	"category" varchar(255),
	"author" varchar(255),
	"word_count" integer,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "content_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"organic_clicks" integer,
	"organic_impressions" integer,
	"avg_position" real,
	"primary_query" varchar(500),
	"sessions" integer,
	"users" integer,
	"engagement_rate" real,
	"bounce_rate" real,
	"conversions_json" jsonb,
	"ctr" real
);
--> statement-breakpoint
CREATE TABLE "data_source_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"credentials_encrypted" text NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_tested_at" timestamp,
	"last_test_status" varchar(50),
	"last_test_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"vertical" varchar(100),
	"gsc_property" varchar(255),
	"ga4_account_id" varchar(255),
	"hubspot_blog_id" varchar(255),
	"dataforseo_location" integer DEFAULT 2566,
	"dataforseo_language" integer DEFAULT 1000,
	"semrush_enabled" boolean DEFAULT false NOT NULL,
	"semrush_database" varchar(10),
	"content_categories_json" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"token" varchar(255) NOT NULL,
	"invited_by" uuid NOT NULL,
	"accepted_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"plan" varchar(50) DEFAULT 'beta' NOT NULL,
	"max_domains" integer DEFAULT 1 NOT NULL,
	"max_seats" integer DEFAULT 5 NOT NULL,
	"monthly_api_credits" integer DEFAULT 10000 NOT NULL,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"batch_date" timestamp NOT NULL,
	"primary_keyword" varchar(500) NOT NULL,
	"supporting_keywords_json" jsonb,
	"search_volume" integer,
	"keyword_difficulty" real,
	"opportunity_score" real,
	"score_breakdown_json" jsonb,
	"competitor_data_json" jsonb,
	"serp_features_json" jsonb,
	"suggested_content_type" varchar(100),
	"ai_angle" text,
	"ai_outline" text,
	"source" varchar(50) DEFAULT 'discovery' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"assigned_to" varchar(255),
	"rejection_reason" text,
	"status_changed_by" uuid,
	"status_history_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"source" varchar(50) DEFAULT 'landing_page' NOT NULL,
	"status" varchar(50) DEFAULT 'waiting' NOT NULL,
	"invite_token" varchar(255),
	"invited_at" timestamp,
	"signed_up_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"batch_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'running' NOT NULL,
	"topics_generated" integer,
	"alerts_generated" integer,
	"dataforseo_units_used" real,
	"semrush_units_used" real,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_log" text
);
--> statement-breakpoint
ALTER TABLE "approval_stages" ADD CONSTRAINT "approval_stages_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_alerts" ADD CONSTRAINT "content_alerts_content_id_content_inventory_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_inventory" ADD CONSTRAINT "content_inventory_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_snapshots" ADD CONSTRAINT "content_snapshots_content_id_content_inventory_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_source_credentials" ADD CONSTRAINT "data_source_credentials_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_recommendations" ADD CONSTRAINT "topic_recommendations_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_recommendations" ADD CONSTRAINT "topic_recommendations_status_changed_by_users_id_fk" FOREIGN KEY ("status_changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_batches" ADD CONSTRAINT "weekly_batches_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_stages_domain_idx" ON "approval_stages" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "competitors_domain_idx" ON "competitors" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "alerts_content_idx" ON "content_alerts" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_inv_domain_idx" ON "content_inventory" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "snapshots_content_idx" ON "content_snapshots" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dsc_org_provider_idx" ON "data_source_credentials" USING btree ("org_id","provider");--> statement-breakpoint
CREATE INDEX "domains_org_idx" ON "domains" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "prt_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "topic_rec_domain_idx" ON "topic_recommendations" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "batches_domain_idx" ON "weekly_batches" USING btree ("domain_id");