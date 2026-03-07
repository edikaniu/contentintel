import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// === Multi-Tenant Foundation ===

export const organisations = pgTable("organisations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull().default("beta"), // starter | growth | scale | beta
  maxDomains: integer("max_domains").notNull().default(1),
  maxSeats: integer("max_seats").notNull().default(5),
  monthlyApiCredits: integer("monthly_api_credits").notNull().default(10000),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("viewer"), // owner | admin | editor | viewer
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("viewer"), // admin | editor | viewer
    token: varchar("token", { length: 255 }).notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    acceptedAt: timestamp("accepted_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("invites_token_idx").on(table.token)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [uniqueIndex("sessions_token_idx").on(table.sessionToken)]
);

// === Waitlist & Beta Access ===

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull().default("landing_page"), // landing_page | referral
    status: varchar("status", { length: 50 }).notNull().default("waiting"), // waiting | invited | signed_up | rejected
    inviteToken: varchar("invite_token", { length: 255 }),
    invitedAt: timestamp("invited_at"),
    signedUpAt: timestamp("signed_up_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("waitlist_email_idx").on(table.email)]
);

// === Data Source Credentials ===

export const dataSourceCredentials = pgTable(
  "data_source_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // dataforseo | windsor | hubspot | semrush | anthropic
    credentialsEncrypted: text("credentials_encrypted").notNull(),
    isConnected: boolean("is_connected").notNull().default(false),
    lastTestedAt: timestamp("last_tested_at"),
    lastTestStatus: varchar("last_test_status", { length: 50 }), // success | error
    lastTestError: text("last_test_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("dsc_org_provider_idx").on(table.orgId, table.provider),
  ]
);

// === Domain Configuration ===

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    vertical: varchar("vertical", { length: 100 }),
    gscProperty: varchar("gsc_property", { length: 255 }),
    ga4AccountId: varchar("ga4_account_id", { length: 255 }),
    hubspotBlogId: varchar("hubspot_blog_id", { length: 255 }),
    dataforseoLocation: integer("dataforseo_location").default(2566),
    dataforseoLanguage: integer("dataforseo_language").default(1000),
    semrushEnabled: boolean("semrush_enabled").notNull().default(false),
    semrushDatabase: varchar("semrush_database", { length: 10 }),
    contentCategoriesJson: jsonb("content_categories_json"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("domains_org_idx").on(table.orgId)]
);

export const competitors = pgTable(
  "competitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    competitorDomain: varchar("competitor_domain", { length: 255 }).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [index("competitors_domain_idx").on(table.domainId)]
);

// === Content Data ===

export const contentInventory = pgTable(
  "content_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    hubspotId: varchar("hubspot_id", { length: 255 }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 500 }),
    publishDate: timestamp("publish_date"),
    lastUpdated: timestamp("last_updated"),
    category: varchar("category", { length: 255 }),
    author: varchar("author", { length: 255 }),
    wordCount: integer("word_count"),
    syncedAt: timestamp("synced_at"),
  },
  (table) => [index("content_inv_domain_idx").on(table.domainId)]
);

export const contentSnapshots = pgTable(
  "content_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contentInventory.id, { onDelete: "cascade" }),
    snapshotDate: timestamp("snapshot_date").notNull(),
    organicClicks: integer("organic_clicks"),
    organicImpressions: integer("organic_impressions"),
    avgPosition: real("avg_position"),
    primaryQuery: varchar("primary_query", { length: 500 }),
    sessions: integer("sessions"),
    users: integer("users"),
    engagementRate: real("engagement_rate"),
    bounceRate: real("bounce_rate"),
    conversionsJson: jsonb("conversions_json"),
    ctr: real("ctr"),
  },
  (table) => [index("snapshots_content_idx").on(table.contentId)]
);

// === Recommendations & Workflow ===

export const topicRecommendations = pgTable(
  "topic_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    batchDate: timestamp("batch_date").notNull(),
    primaryKeyword: varchar("primary_keyword", { length: 500 }).notNull(),
    supportingKeywordsJson: jsonb("supporting_keywords_json"),
    searchVolume: integer("search_volume"),
    keywordDifficulty: real("keyword_difficulty"),
    opportunityScore: real("opportunity_score"),
    scoreBreakdownJson: jsonb("score_breakdown_json"),
    competitorDataJson: jsonb("competitor_data_json"),
    serpFeaturesJson: jsonb("serp_features_json"),
    suggestedContentType: varchar("suggested_content_type", { length: 100 }),
    aiAngle: text("ai_angle"),
    aiOutline: text("ai_outline"),
    source: varchar("source", { length: 50 }).notNull().default("discovery"), // discovery | validator | manual
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending | approved | rejected | assigned | published
    assignedTo: varchar("assigned_to", { length: 255 }),
    rejectionReason: text("rejection_reason"),
    statusChangedBy: uuid("status_changed_by").references(() => users.id),
    statusHistoryJson: jsonb("status_history_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("topic_rec_domain_idx").on(table.domainId)]
);

export const contentAlerts = pgTable(
  "content_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contentInventory.id, { onDelete: "cascade" }),
    batchDate: timestamp("batch_date").notNull(),
    alertType: varchar("alert_type", { length: 100 }).notNull(),
    severity: varchar("severity", { length: 50 }).notNull(), // high | medium | low
    currentMetricsJson: jsonb("current_metrics_json"),
    previousMetricsJson: jsonb("previous_metrics_json"),
    suggestedAction: text("suggested_action"),
    priorityScore: real("priority_score"),
    status: varchar("status", { length: 50 }).notNull().default("open"), // open | acknowledged | resolved
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("alerts_content_idx").on(table.contentId)]
);

export const approvalStages = pgTable(
  "approval_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    stageName: varchar("stage_name", { length: 255 }).notNull(),
    requiredRole: varchar("required_role", { length: 50 }).notNull(),
    position: integer("position").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [index("approval_stages_domain_idx").on(table.domainId)]
);

// === Job Tracking ===

export const weeklyBatches = pgTable(
  "weekly_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    batchDate: timestamp("batch_date").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("running"), // running | completed | failed
    topicsGenerated: integer("topics_generated"),
    alertsGenerated: integer("alerts_generated"),
    dataforseoUnitsUsed: real("dataforseo_units_used"),
    semrushUnitsUsed: real("semrush_units_used"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    errorLog: text("error_log"),
  },
  (table) => [index("batches_domain_idx").on(table.domainId)]
);

// === Password Reset Tokens ===

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("prt_token_idx").on(table.token)]
);
