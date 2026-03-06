# ContentIntel — Claude Code Session Prompting Guide

## How This Works

Your project has two persistent files that Claude Code reads automatically:
- **`CLAUDE.md`** — Dev rules + project-specific context. Lives in project root. Claude Code reads this every session.
- **`contentintel-prd-v1_3.md`** — The PRD. Place it in the project root (or a `/docs` folder). Reference it in prompts.

**Before each session:**
1. Make sure `CLAUDE.md` is in the project root and up to date (especially the "Current Session" section)
2. Make sure the PRD is accessible in the project
3. Paste the session prompt below

**After each session:**
1. Ask Claude Code: "Update the Current Session section in CLAUDE.md with what was built, what works, and any issues."
2. Review the update and confirm
3. Commit everything to git with a clear message

---

## Pre-Session 1: Project Initialisation

Before your first session, you need the project to exist. Run this manually:

```bash
npx create-next-app@latest contentintel --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd contentintel
git init
```

Then place these files in the project root:
- `CLAUDE.md` (the updated version)
- `contentintel-prd-v1_3.md` (or in `/docs/`)

Now you're ready.

---

## Session 1: Foundation, Auth & Multi-Tenancy

```
Read CLAUDE.md and contentintel-prd-v1_3.md fully before starting.

This is Session 1. Build the foundation, auth system, and multi-tenancy layer. Scope is defined in PRD Section 8, "Session 1." Do not build anything from Sessions 2–6.

Here is what to build, in this order:

1. INSTALL DEPENDENCIES (only these):
   - drizzle-orm, drizzle-kit, @vercel/postgres (or pg + @types/pg if using Supabase)
   - next-auth
   - resend
   - bcryptjs + @types/bcryptjs
   - shadcn/ui init (follow their Next.js setup)

2. DATABASE SCHEMA (lib/db/schema.ts):
   Build the full Drizzle schema matching PRD Section 6.3 exactly. All tables:
   - organisations, users, invites, sessions, waitlist
   - data_source_credentials
   - domains, competitors
   - content_inventory, content_snapshots
   - topic_recommendations, content_alerts
   - approval_stages, weekly_batches
   Create the migration files. Do NOT run migrations yet — just generate them.

3. MULTI-TENANT FOUNDATION:
   - Create a Drizzle query helper that automatically applies org_id filtering to every query. No raw query should ever skip org_id.
   - Create middleware (lib/auth/middleware.ts) that extracts org_id from the authenticated session and injects it into the request context.

4. AUTH SYSTEM:
   - NextAuth.js config (lib/auth/config.ts) with credentials provider
   - Sign-up API route: Creates user (Owner role) + organisation in one transaction. Password hashed with bcrypt.
   - Login API route: Email + password validation
   - Logout
   - Password reset: Generate token → send email via Resend → reset page validates token → updates password
   - Session includes: user.id, user.org_id, user.role, user.name, user.email

5. TEAM INVITES:
   - API route to generate invite (requires Admin or Owner role): creates invite record with token, sends email via Resend
   - Invite accept page (/invite/[token]): Validates token → shows form (name, password) → creates user in the existing org with assigned role
   - Invites have expiry (7 days) and can only be used once

6. ROLE-BASED ACCESS CONTROL:
   - Middleware helper: requireRole('admin') or requireRole('editor', 'admin', 'owner')
   - Roles: owner > admin > editor > viewer (permissions per PRD Section 3.2)
   - Apply to API routes as decorators/wrappers

7. ENCRYPTION HELPERS (lib/credentials/encryption.ts):
   - encrypt(plaintext: string): string — AES-256-GCM using ENCRYPTION_KEY env var
   - decrypt(ciphertext: string): string
   - Store IV + auth tag + ciphertext together in the encrypted blob

8. CREDENTIAL STORE (lib/credentials/credential-store.ts):
   - CRUD operations for data_source_credentials table
   - Always encrypts before write, decrypts after read
   - Scoped by org_id (uses the multi-tenant query helper)

9. CONNECTION TESTER (lib/credentials/connection-tester.ts):
   - Test function per provider: testDataforSEO(creds), testWindsor(creds), testHubSpot(creds), testAnthropic(creds), testSemrush(creds)
   - Each makes a lightweight API call to verify credentials are valid
   - Returns { success: boolean, error?: string, metadata?: object } (metadata = balance, account info, etc.)

10. VERIFY:
    - Run `npm run build` — must compile with no errors
    - Run `npx drizzle-kit generate` — migrations generate cleanly
    - All auth flows are testable (sign-up → login → session → logout)

After completing everything above, update the "Current Session" section in CLAUDE.md with what was built, any decisions made, and any issues encountered.
```

---

## Session 2: Landing Page, Waitlist, Onboarding & Settings

```
Read CLAUDE.md (especially the Current Session and Decisions Log from Session 1) and the PRD before starting.

This is Session 2. Build the landing page, waitlist system, onboarding wizard, and settings pages. Scope is PRD Section 8, "Session 2." Do not build anything from Sessions 3–6.

IMPORTANT: For the landing page and UI components, I will provide Stitch-generated code (HTML/CSS/React) for some screens. When I provide Stitch code:
- Use it as the starting point for that screen's UI
- Preserve the design system exactly (colours, spacing, typography, component styles)
- Connect it to the backend APIs and data built in Session 1
- Replace static/dummy data with actual state and API calls
If I haven't provided Stitch code for a screen yet, build a functional version using shadcn/ui components following the design system from the Stitch prompts doc (indigo #3730A3 primary, emerald #059669 accent, slate neutrals).

Here is what to build, in this order:

1. LANDING PAGE (app/page.tsx):
   - Public page, no auth required
   - Hero section, features, how-it-works, pricing display, waitlist CTA form
   - Match PRD Section 5.6 for content and structure
   - If Stitch code is provided, integrate it. Otherwise build with shadcn/ui + Tailwind.

2. WAITLIST SYSTEM:
   - Waitlist form component: captures name + email, POSTs to /api/waitlist
   - API route (api/waitlist/route.ts): Validates, stores in waitlist table, sends confirmation email via Resend
   - Success state: "You're on the list!" message
   - Duplicate email handling: friendly error message

3. ADMIN WAITLIST MANAGEMENT (/admin/waitlist):
   - Protected route: only accessible if user.email === ADMIN_EMAIL env var
   - Table showing all waitlist entries (name, email, date, status)
   - Actions: Approve (sends beta invite email with sign-up link containing invite token), Reject, Bulk approve
   - API routes for approve/reject

4. CLOSED BETA SIGN-UP GATING:
   - Sign-up page (/signup) checks for ?invite=[token] query param
   - If OPEN_SIGNUP=false and no valid token: show "We're in closed beta. Join the waitlist." with link
   - If valid token: show sign-up form (name, email pre-filled from waitlist, password, org name)
   - Sign-up creates user + org (reuses Session 1 auth), marks invite token as used

5. LEGAL PAGES:
   - /terms — placeholder Terms of Service page
   - /privacy — placeholder Privacy Policy page
   - Both clearly marked as templates to be reviewed by legal

6. ONBOARDING WIZARD (app/(app)/onboarding/page.tsx):
   - 7-step flow matching PRD Section 5.9 exactly
   - Each step: form fields, "Test Connection" button (calls connection tester from Session 1), status indicator (connected/error/not configured)
   - Step 1: DataforSEO (login + password) — required
   - Step 2: Windsor.ai (API key) — required for content performance
   - Step 3: HubSpot (private app token) — required for content inventory
   - Step 4: Anthropic (API key) — required for AI features
   - Step 5: SEMrush (API key) — optional, skip allowed
   - Step 6: Domain setup (domain URL, display name, vertical, country/language, map Windsor accounts, map HubSpot blog, add competitors, content categories)
   - Step 7: Invite team — optional, skip allowed
   - Progress indicator across top
   - Saves credentials to DB (encrypted) on each step's "Continue"
   - Completion screen: "You're all set!" → redirect to dashboard

7. SETTINGS PAGES (app/(app)/settings/):
   - Settings > Connections (/settings/connections): Edit credentials, test connections, status badges. Same forms as onboarding but for editing.
   - Settings > Domains (/settings/domains): List domains, add/edit domain config, manage competitors (add/remove up to 10), content categories
   - Settings > Team (/settings/team): List members with roles, invite new members, remove members, change roles. Role change requires confirmation.
   - All settings pages use the same app shell layout (sidebar nav) — build the layout component if not already built

8. DATA SOURCE API CLIENTS (lib/data-sources/):
   - dataforseo.ts: Client that reads creds from DB per org, makes API calls. Include at least: testConnection(), getAccountBalance()
   - windsor.ts: Client that reads creds from DB. Include: testConnection(), listConnectedAccounts()
   - hubspot.ts: Client that reads creds from DB. Include: testConnection(), listBlogs()
   - semrush.ts: Client that reads creds from DB. Include: testConnection(), getUnitBalance(). Behind semrush_enabled flag.
   - Each client handles "not configured" gracefully

9. VERIFY:
   - `npm run build` compiles clean
   - Landing page renders at /
   - Waitlist form submits and stores in DB
   - Sign-up with invite token works end-to-end
   - Onboarding wizard navigates all steps and saves credentials
   - Settings pages load and display correct data
   - Connection testing works for at least one provider (DataforSEO)

Update CLAUDE.md "Current Session" and "Session Decisions Log" when done.
```

---

## Session 3: Data Pipeline

```
Read CLAUDE.md (Current Session, Decisions Log, Known Issues from Sessions 1-2) and PRD Sections 5.1, 5.2, and 4.2 before starting.

This is Session 3. Build the weekly data pipeline — the batch job that pulls data from all connected sources, creates content snapshots, and generates alerts. Scope is PRD Section 8, "Session 3." Do not build anything from Sessions 4–6.

Here is what to build:

1. WEEKLY BATCH JOB FRAMEWORK (api/cron/weekly-batch.ts):
   - API route triggered by Vercel Cron (secured with CRON_SECRET header check)
   - Iterates all active organisations
   - For each org: runs the per-org pipeline (steps 2-6 below)
   - Records batch in weekly_batches table (status, timestamps, counts, error log)
   - If a data source is not connected for an org, SKIP that step gracefully — log it, continue

2. CONTENT INVENTORY SYNC:
   - Pull all published blog posts from HubSpot via the hubspot.ts client
   - Upsert into content_inventory table (matched by hubspot_id or URL)
   - Fields: url, title, slug, publish_date, last_updated, category, author, word_count
   - This is the foundation — everything else references content_inventory records

3. GSC DATA PULL (via Windsor.ai):
   - Pull query-level data for the domain's GSC property
   - Metrics: impressions, clicks, CTR, average position per page
   - Store as part of content_snapshots (matched by URL to content_inventory)
   - Pull last 4 weeks of data for trend comparison

4. GA4 DATA PULL (via Windsor.ai):
   - Pull page-level performance for the domain's GA4 property
   - Metrics: sessions, users, engagement_rate, bounce_rate, conversions (nc_apply, nc_calculate_repayment, nc_openaccount)
   - Store as part of content_snapshots

5. CONTENT SNAPSHOT STORAGE:
   - For each content piece: create a content_snapshots row with this week's date
   - Combine GSC + GA4 data into one snapshot record per content piece per week
   - Primary query identification: the GSC query with highest clicks for each page

6. ALERT GENERATION (all 6 types from PRD Section 5.2):
   - Compare current snapshot vs previous week and vs 4 weeks ago
   - Generate content_alerts for any content matching these criteria:
     a. Declining traffic: >20% drop in organic sessions over 4-week window
     b. Position slipping: Average position dropped by 3+ places for primary keyword
     c. Striking distance: Ranking positions 4–15 for keywords with >500 monthly volume
     d. Stale content: Published >12 months ago, never updated, still getting traffic
     e. High impressions, low CTR: Impressions >1000/week but CTR <2%
     f. Conversion drop: Content that previously drove conversions but has stopped
   - Each alert gets a priority score (PRD Section 5.2 "Refresh priority scoring")
   - Alert status defaults to "open"

7. MANUAL RE-RUN:
   - Add an API endpoint that allows triggering the batch for a single org (for the "Run Manual Batch" button in the dashboard)
   - Requires Admin or Owner role

8. VERIFY:
   - Batch job runs without errors when triggered manually via API
   - Content inventory populates from HubSpot (or gracefully skips if not connected)
   - Snapshots are created with combined GSC + GA4 data
   - Alerts generate correctly for test data
   - weekly_batches table records the run with correct counts
   - `npm run build` compiles clean

Update CLAUDE.md when done.
```

---

## Session 4: Topic Discovery

```
Read CLAUDE.md and PRD Sections 5.1 and 4.1 (DataforSEO endpoints) before starting.

This is Session 4. Build the Topic Discovery Engine — the pipeline that generates weekly topic recommendations. Scope is PRD Section 8, "Session 4." Do not build anything from Sessions 5–6.

Here is what to build:

1. SEED KEYWORD EXTRACTION (lib/analysis/seed-extractor.ts):
   - Pull current top-performing queries from GSC data (top 200 by clicks) — read from content_snapshots
   - Pull current ranked keywords from DataforSEO for the domain (/v3/dataforseo_labs/google/ranked_keywords/live)
   - Extract content categories from the domain's configuration
   - Combine and deduplicate into a seed keyword list
   - Group seeds into clusters by category

2. KEYWORD EXPANSION (lib/data-sources/dataforseo.ts — extend):
   - For each seed cluster, call DataforSEO:
     - /v3/dataforseo_labs/google/keyword_suggestions/live
     - /v3/dataforseo_labs/google/related_keywords/live
   - Filter by: location (from domain config), language, minimum search volume (configurable, default 100/month)
   - Return: keyword, search_volume, keyword_difficulty, cpc, trend_data

3. OPPORTUNITY SCORING (lib/analysis/topic-scorer.ts):
   - Score each keyword 0–100 based on PRD Section 5.1 weights:
     - Search volume: 25%
     - Keyword difficulty (inverted — lower is better): 25%
     - Relevance to vertical (AI classification): 20%
     - Content gap (checked against content_inventory): 15%
     - Trend momentum: 15%
   - Store the score breakdown as JSON in score_breakdown_json

4. KEYWORD CLUSTERING (lib/analysis/keyword-clusterer.ts):
   - Group related keywords into topic clusters
   - Logic: keywords sharing 2+ words, or semantically related (use DataforSEO related_keywords data)
   - Each cluster becomes one topic recommendation with a primary keyword + supporting keywords

5. COMPETITOR GAP ANALYSIS (lib/analysis/gap-analyzer.ts):
   - Call DataforSEO domain_intersection for the domain vs each competitor
   - Find keywords competitors rank for in top 20 that the domain doesn't rank for
   - These keywords get a score boost in the opportunity scoring
   - Store competitor data in competitor_data_json per recommendation

6. CLAUDE AI INTEGRATION (lib/ai/topic-generator.ts):
   - For each top-scoring topic cluster (top 30), call Anthropic API:
     - Input: primary keyword, supporting keywords, vertical context, competitor data
     - Output: suggested topic angle (1-2 sentences), suggested content type, recommended outline (section headers)
   - Store in ai_angle and ai_outline fields on topic_recommendations

7. INTEGRATE INTO WEEKLY BATCH:
   - Add the topic discovery pipeline to the existing weekly batch job (after content snapshot + alerts)
   - Save results as topic_recommendations with status "pending", source "discovery"
   - Track DataforSEO credits used in the weekly_batches record

8. SERP ANALYSIS for top recommendations:
   - For the top 30 scored topics, call DataforSEO SERP API
   - Capture: top 5 results (title, URL, domain), SERP features present (featured snippet, PAA, video, etc.)
   - Store in serp_features_json

9. VERIFY:
   - Topic discovery pipeline runs as part of the weekly batch
   - Generates 15–30 topic recommendations with scores, keywords, competitor data, and AI angles
   - DataforSEO API calls succeed (or gracefully handle rate limits/errors)
   - AI angles are generated for top topics
   - `npm run build` compiles clean

Update CLAUDE.md when done.
```

---

## Session 5: Dashboard UI

```
Read CLAUDE.md and PRD Section 5.7 before starting.

This is Session 5. Build all dashboard UI screens. Scope is PRD Section 8, "Session 5." Do not build Session 6 features (topic validator, cron config, deployment).

CRITICAL: I am providing Stitch-generated UI code for the dashboard screens. Use this code as the starting template and connect it to the backend APIs and data from Sessions 1–4.

[PASTE YOUR STITCH CODE HERE OR ATTACH THE FILES]

If Stitch code is not yet provided for a screen, build it using shadcn/ui + Tailwind following the design system: indigo #3730A3 primary, emerald #059669 accent, slate neutrals, Inter font, 8px spacing rhythm, rounded-xl cards.

Here is what to build:

1. APP SHELL LAYOUT (app/(app)/layout.tsx):
   - Sidebar navigation (256px, dark #1E293B background)
   - ContentIntel logo, domain selector dropdown, nav sections (MAIN: Overview, Topics, Content Health, Validate Topic; MANAGE: Settings), user area with avatar + name + role + logout
   - Top header with breadcrumb + date range selector + notifications
   - Active nav item: #3730A3 background, white text, rounded-xl
   - Domain selector reads from the domains table for the user's org
   - Responsive: sidebar collapses to hamburger on mobile

2. OVERVIEW PAGE (app/(app)/dashboard/page.tsx):
   - Summary KPI cards: New Topics this week, Content Alerts count, Avg Opportunity Score, Topics Approved this month
   - Pull data from topic_recommendations and content_alerts tables
   - Organic performance trend chart (line chart, recharts): clicks + impressions over last 8 weeks from content_snapshots
   - Alert breakdown doughnut chart: count by alert type
   - Top 5 topic opportunities table (clickable, links to /topics)
   - Recent activity feed (latest status changes from topic_recommendations)

3. TOPIC RECOMMENDATIONS PAGE (app/(app)/topics/page.tsx):
   - Filter tabs: All / Pending / Approved / Rejected
   - Sort: by opportunity score, search volume, keyword difficulty, date
   - Search: real-time filter by keyword text
   - Bulk actions: select multiple → approve/reject
   - Each topic row: primary keyword, supporting keywords as tags, AI angle preview, opportunity score badge, search volume, KD, content type, status badge
   - Expand to see: full keyword data table, competitor presence, SERP features, AI recommendation, outline
   - Approve/Reject inline actions: PATCH to /api/topics/[id] with new status + user who changed it
   - CSV export button: GET /api/topics?format=csv

4. CONTENT HEALTH PAGE (app/(app)/content-health/page.tsx):
   - Alert type summary cards across top (one per type, clickable to filter)
   - Filter: Open / Acknowledged / Resolved + Priority filter
   - Alert cards: priority colour border, alert type badge, content title + URL, metrics comparison (current vs previous), suggested action
   - Acknowledge / Mark Resolved actions: PATCH to /api/content/alerts/[id]

5. SETTINGS PAGES — enhance what was built in Session 2:
   - Add approval workflow config page (/settings/workflow): Display current pipeline stages, show that custom stages are "coming soon"
   - Add API budget monitoring to settings: Show DataforSEO credit balance, SEMrush units remaining, per-batch usage from weekly_batches table

6. CSV EXPORT:
   - Add export endpoint that accepts current filter params and returns CSV
   - Works for both topic recommendations and content alerts

7. VERIFY:
   - All pages render correctly with data from the database
   - Navigation between pages works, active state updates correctly
   - Filter, sort, and search work on topics and content health pages
   - Approve/reject actions update the database and reflect immediately in UI
   - Domain selector switches context and reloads data for the selected domain
   - `npm run build` compiles clean

Update CLAUDE.md when done.
```

---

## Session 6: Topic Validator + Polish + Deploy

```
Read CLAUDE.md and PRD Sections 5.3, 5.4, and full Section 7 (MVP scope) before starting.

This is Session 6 — the final session. Build the topic validator, configure the cron job, test end-to-end, and deploy. Scope is PRD Section 8, "Session 6."

1. ON-DEMAND TOPIC VALIDATOR:
   - Form UI (app/(app)/validate/page.tsx): Text input for topic/keyword, submit button, loading state with multi-step progress indicator, results display
   - API endpoint (api/topics/validate/route.ts):
     a. Extract core keyword(s) from input
     b. Call DataforSEO: search volume, keyword difficulty, CPC, trend data
     c. Call DataforSEO SERP API: top 5 results, SERP features
     d. Check content_inventory for overlap/cannibalisation risk
     e. Call Anthropic: generate suggested angles (2-3), recommended outline, content type, opportunity assessment
     f. Return full brief object
   - TEXT INPUT ONLY for v1. URL input is v1.1 (show tab but disabled with "Coming soon" tooltip).

2. BRIEF DISPLAY COMPONENT (components/brief-display.tsx):
   - Opportunity score gauge (circular, coloured by score range)
   - Keyword metrics card: primary keyword + volume + KD + CPC + trend
   - Related keywords table
   - SERP landscape: top 5 results table + SERP feature badges
   - Competitor check: which defined competitors rank + positions
   - Cannibalisation check: warning if overlap found, success if clear
   - AI recommendations: angles + outline
   - Actions: "Add to Recommendations" (creates pending topic_recommendation) + "Export Brief" (markdown download)

3. CRON JOB CONFIGURATION:
   - Create/update vercel.json with cron configuration:
     - Weekly batch: runs Monday 5:00 UTC (6:00 AM WAT)
     - Endpoint: /api/cron/weekly-batch
     - Secured with CRON_SECRET
   - Verify the batch job endpoint handles the Vercel cron headers correctly

4. END-TO-END TESTING:
   - Test with NairaCompare as the first org:
     - Sign up → onboarding → connect at least DataforSEO + HubSpot
     - Trigger manual batch run
     - Verify topic recommendations appear on the dashboard
     - Verify content alerts generate from real data
     - Test topic validator with a real keyword (e.g., "best personal loans Nigeria")
     - Approve a topic, verify status changes
     - Export CSV, verify file downloads
   - Test multi-tenant isolation: create a second test org, verify it cannot see first org's data

5. POLISH:
   - Review all pages for loading states (add skeleton loaders where missing)
   - Review all API routes for proper error handling and user-friendly error messages
   - Review all forms for validation feedback
   - Ensure all "not configured" states display correctly when data sources are missing
   - Check mobile responsiveness on key pages (landing, dashboard, topics)

6. DEPLOY TO VERCEL:
   - Ensure vercel.json is configured correctly
   - Set all 8 environment variables in Vercel dashboard
   - Deploy
   - Verify cron job is registered in Vercel dashboard
   - Test the deployed app: landing page → waitlist → sign up (with test invite) → onboarding → dashboard

7. FINAL VERIFICATION CHECKLIST:
   - [ ] Landing page loads at root URL
   - [ ] Waitlist form works
   - [ ] Sign-up with invite token works
   - [ ] Onboarding wizard completes
   - [ ] Dashboard shows data after batch run
   - [ ] Topic recommendations filterable and approvable
   - [ ] Content health alerts display correctly
   - [ ] Topic validator returns valid brief
   - [ ] Settings pages functional
   - [ ] CSV export downloads
   - [ ] Multi-tenant isolation verified
   - [ ] No console errors in production
   - [ ] `npm run build` clean

Update CLAUDE.md with final status. Mark the project as v1 complete.
```

---

## Between-Session Maintenance Prompts

If you need to fix something between sessions:

```
Read CLAUDE.md before starting. This is a maintenance fix, not a new session. Do not build new features.

Bug/Issue: [describe the problem]
Expected: [what should happen]
Actual: [what actually happens]

Fix only this issue. Follow Rules 1-3 (Scope Lock, Minimal Diff, Diagnose Before Prescribe). Update Known Issues in CLAUDE.md when done.
```

---

## How to Handle Stitch UI Code

When you're ready to integrate Stitch-generated screens (likely in Session 2 for landing page, Session 5 for dashboard):

```
I'm providing Stitch-generated UI code for [screen name]. The files are:
- [list files]

Integrate this code into the existing project:
1. Preserve the design system exactly — do not change colours, spacing, typography, or component styles
2. Replace static/dummy data with real state from the database
3. Connect form actions and button clicks to the existing API routes
4. Ensure the component follows our existing patterns (React Server Components where possible, client components only where interactivity requires it)
5. Do not add new dependencies — use shadcn/ui components and recharts as already installed

The Stitch code is the UI source of truth. The backend from previous sessions is the data source of truth.
```
