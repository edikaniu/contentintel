# ContentIntel — Product Requirements Document

**Version:** 1.3
**Date:** March 2026
**Status:** Draft for review — Updated for closed beta, waitlist, pricing tiers, and legal pages

---

## 1. Problem Statement

The marketing team currently performs content planning through a fragmented manual process: pulling Search Console data by hand, separately checking GA4 performance, doing ad-hoc keyword research in SEMrush or other tools, and relying on team members' intuition or news scanning for topic ideas. There is no systematic way to:

- Surface new topic opportunities backed by data
- Monitor how existing content is performing and flag what needs attention
- Validate ad-hoc topic ideas quickly against keyword and competitive data
- Present all of this in one place where multiple stakeholders can review and approve

This results in slow topic selection cycles, missed content opportunities, and content refreshes happening reactively (or not at all).

## 2. Solution Overview

**ContentIntel** is a **multi-tenant SaaS platform** (hosted on Vercel) that automates content topic discovery, existing content performance monitoring, and on-demand topic validation. It combines data from DataforSEO (primary), SEMrush (optional enhancement), Google Search Console, GA4, and HubSpot into a unified interface with a simple approval workflow.

Businesses sign up through a public landing page, create an organisation account, and go through a guided onboarding flow to connect their data sources. Each organisation gets an isolated workspace where they manage their own domains, teams, content data, and recommendations.

The platform is designed to be **multi-domain** — within each organisation, users select an active domain from a dropdown, and all data, recommendations, and reports reflect that domain. Initial dogfooding covers **nairacompare.ng** and **betscompare.ng** as the first organisation's domains.

All data source credentials (DataforSEO, Windsor, HubSpot, SEMrush, Anthropic) are configured through the dashboard's settings UI during onboarding — no environment variables beyond infrastructure secrets. This makes the sign-up-to-value path fully self-service.

### Core Capabilities

| Capability | Description |
|---|---|
| **Landing Page & Sign-Up** | Public marketing page with product overview, pricing (future), and sign-up flow |
| **Self-Service Onboarding** | Guided wizard to connect data sources, add domains, and configure the workspace |
| **Topic Discovery Engine** | Weekly automated recommendations for new content topics, ranked by opportunity score |
| **Content Performance Monitor** | Weekly audit of existing content flagging declines, refresh opportunities, and quick wins |
| **On-Demand Topic Validator** | Manual input of a topic idea or news URL → returns a full brief with metrics, angles, competitor analysis, and recommended outline |
| **Approval Workflow** | Simple status pipeline (Pending → Approved → Rejected) with admin-configurable stages |
| **Multi-Domain Support** | Domain selector dropdown; all views scoped to the selected domain |
| **Multi-Tenant Isolation** | Complete data separation between organisations |

---

## 3. Users & Roles

### 3.1 User Journey

```
Landing Page → Sign Up (email + password) → Create Organisation →
Onboarding Wizard (connect data sources, add first domain) → Dashboard
```

Subsequent team members are invited by the org admin via email invite link. They join the existing organisation and skip data source setup.

### 3.2 Roles

Roles are scoped per organisation. A user belongs to exactly one organisation.

| Role | What they do in the tool | Permissions |
|---|---|---|
| **Owner** | Created the organisation. Full control over billing (future), data sources, team management, and all content operations. | Everything |
| **Admin** | Manages data sources, domains, competitors, approval workflow, and team members. Can do everything except delete the organisation or manage billing. | Settings, connections, domains, competitors, team invites, all content operations |
| **Editor** | Reviews weekly recommendations, validates ad-hoc topics, approves/rejects topics, manages content health actions. | View all data, approve/reject topics, run validator, export |
| **Viewer** | Read-only access to dashboards and reports. Cannot approve, reject, or modify anything. | View all data, export |

### 3.3 Typical Team Structure

| Person | Role | Frequency |
|---|---|---|
| **Head of Marketing / Product Owner** | Owner or Admin | Weekly oversight, strategic approvals |
| **Marketing Lead** | Admin or Editor | Weekly reviews, final sign-off on topics |
| **Content Lead** | Editor | Daily — reviews recommendations, validates topics, manages assignments |
| **Content Writers** | Viewer | Weekly — check assigned topics, reference briefs |

---

## 4. Data Architecture

### 4.1 Data Sources & Roles

**DataforSEO (Primary — Direct API)**
This is the workhorse. DataforSEO handles:

- Keyword research: search volume, keyword difficulty, CPC, trends, seasonal patterns
- SERP analysis: current top-ranking pages, SERP features (featured snippets, PAA, etc.)
- Keyword suggestions & related keywords (for topic expansion)
- Competitor organic keywords (what competitors rank for that we don't)
- Backlink data: referring domains, domain authority metrics (replaces Ahrefs)
- Ranked keywords for our domains (what we currently rank for and where)
- Google Trends integration (trending topics in our verticals)

**Confirmed plan access:** SERP API, Keywords Data API, DataForSEO Labs API, Domain Analytics API, On-Page API, Content Analysis API, Business Data API, Backlinks API, AI Optimization API. Credit limit is expandable as needed.

API endpoints we'll use:

- `/v3/keywords_data/google_ads/search_volume/live` — bulk search volume lookups
- `/v3/keywords_data/google_ads/keywords_for_keywords/live` — keyword suggestions
- `/v3/serp/google/organic/live/regular` — SERP analysis
- `/v3/dataforseo_labs/google/keyword_suggestions/live` — broader keyword ideas
- `/v3/dataforseo_labs/google/related_keywords/live` — semantically related terms
- `/v3/dataforseo_labs/google/competitors_domain/live` — competitor discovery
- `/v3/dataforseo_labs/google/domain_intersection/live` — keyword gap analysis
- `/v3/dataforseo_labs/google/ranked_keywords/live` — our current rankings
- `/v3/backlinks/summary/live` — domain authority and backlink overview
- DataforSEO Trends API — trending searches in finance/betting verticals

**SEMrush (Optional Enhancement — Direct API / MCP)**
Used selectively for capabilities where it adds value beyond DataforSEO:

- Topic authority / topical map scoring (SEMrush's proprietary metric)
- Keyword gap analysis across multiple competitors simultaneously (more refined UI)
- Traffic analytics estimates for competitor domains
- Keyword magic tool data for topic cluster generation

SEMrush is treated as an **optional module**. The tool must function fully without it. When present, it enriches recommendations with additional signals. The architecture uses a provider abstraction so SEMrush calls are only made when a SEMrush API key is configured.

**API budget management:** 50,000 standard units/month. The system tracks unit consumption per call and shows remaining budget in the admin panel. Weekly batch jobs are estimated at ~5,000-8,000 units; on-demand validations at ~200-500 units each.

**Google Search Console (via Windsor.ai)**
To be connected before build starts. Provides:

- Query-level data: impressions, clicks, CTR, average position per page
- "Striking distance" identification (keywords ranking positions 4-20 where improvement is realistic)
- Click/impression trend data for existing content (detecting declines)
- New query discovery (queries we're appearing for but haven't deliberately targeted)

**GA4 (via Windsor.ai — Already Connected)**
Account: Nairacompare.ng (ID: 336058071). Provides:

- Page-level traffic metrics: sessions, users, pageviews, engagement rate
- Bounce rate and average session duration per content page
- Conversion events per page (nc_apply, nc_calculate_repayment, nc_openaccount, etc.)
- Traffic source breakdown per page (organic vs direct vs referral)
- Engagement signals: scroll depth, time on page

**HubSpot (Direct MCP Connection)**
Source of truth for content inventory. Provides:

- Complete blog post catalog: titles, URLs, publish dates, authors, categories/tags
- Content metadata: last updated date, current status
- Internal content categorisation (topic clusters, product categories)
- CRM conversion data tied to content (if attribution is set up)

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WEEKLY BATCH JOB (Monday 6am)            │
│                                                             │
│  DataforSEO ──┐                                             │
│  GSC/Windsor ──┼──→ Data Ingestion ──→ Analysis Engine ──→  │
│  GA4/Windsor ──┤         Layer            (Node.js)         │
│  HubSpot ─────┘                              │              │
│                                              ▼              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              PostgreSQL Database                  │       │
│  │  • Content inventory + performance snapshots      │       │
│  │  • Keyword opportunities (scored & ranked)        │       │
│  │  • Content alerts (declines, refresh candidates)  │       │
│  │  • Topic recommendations + approval status        │       │
│  │  • Historical trends                              │       │
│  └──────────────────────────────────────────────────┘       │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     Dashboard UI      On-Demand API      Export (CSV)
     (React/Vercel)    (Topic Validator)   (Google Sheets)
```

### 4.3 Domain Configuration

Each domain is stored as a configuration object in the database (created and edited through the Settings UI):

```json
{
  "domain": "nairacompare.ng",
  "display_name": "NairaCompare",
  "vertical": "finance",
  "gsc_property": "sc-domain:nairacompare.ng",
  "ga4_account_id": "336058071",
  "hubspot_blog_id": "...",
  "dataforseo_location": 2566,
  "dataforseo_language": 1000,
  "competitors": [
    "nairametrics.com",
    "compareremit.com",
    ...
  ],
  "content_categories": ["loans", "investments", "pension", "insurance", "crypto", "forex", "diaspora-banking"],
  "semrush_enabled": true,
  "semrush_database": "ng"
}
```

Data source credentials are stored separately in the `data_source_credentials` table (encrypted at rest) and linked at the organisation level — so all domains under one deployment share the same DataforSEO, Windsor, and Anthropic credentials, while domain-specific mappings (which GA4 account, which HubSpot blog, which GSC property) are stored per domain.

Competitors are editable from the admin panel (add/remove, up to 10 per domain).

---

## 5. Feature Specifications

### 5.1 Topic Discovery Engine

**Trigger:** Automated weekly batch (Monday 6:00 AM WAT), plus manual re-run from dashboard.

**Process:**

1. **Seed keyword generation**
   - Pull current top-performing queries from GSC (top 200 by clicks)
   - Pull current ranked keywords from DataforSEO for the domain
   - Extract content categories from HubSpot blog taxonomy
   - Combine into seed keyword list

2. **Keyword expansion**
   - For each seed cluster, call DataforSEO keyword suggestions + related keywords
   - Filter by: location = Nigeria (2566), language = English, minimum search volume threshold (configurable, default 100/month)
   - If SEMrush is enabled: supplement with keyword magic tool results for deeper long-tail coverage

3. **Opportunity scoring**
   Each keyword/topic gets a composite score (0-100) based on:
   - **Search volume** (weighted 25%) — higher is better
   - **Keyword difficulty** (weighted 25%) — lower is better (easier to rank)
   - **Relevance to vertical** (weighted 20%) — AI classification against domain categories
   - **Content gap** (weighted 15%) — do we already have content targeting this? (checked against HubSpot inventory)
   - **Trend momentum** (weighted 15%) — is search interest growing? (DataforSEO Trends)

4. **Deduplication & clustering**
   - Group related keywords into topic clusters (e.g., "best savings account Nigeria", "high interest savings account", "savings account comparison" → single topic)
   - Present the cluster as one recommendation with the primary keyword + supporting keywords

5. **Competitor gap overlay**
   - DataforSEO domain intersection: keywords competitors rank for in top 20 that we don't rank for at all
   - These get a score boost (they represent proven demand our competitors are capturing)

**Output:** Ranked list of 15-30 topic recommendations per week, each containing:

- Primary keyword + search volume + keyword difficulty
- Supporting keywords (3-5) with individual metrics
- Opportunity score (0-100) with breakdown
- Competitor presence (which competitors rank, at what position)
- SERP features present (featured snippet opportunity, PAA, etc.)
- Suggested content type (blog post, comparison page, guide, tool)
- AI-generated topic angle (1-2 sentences on the recommended approach)
- Status: Pending (default)

### 5.2 Content Performance Monitor

**Trigger:** Automated weekly batch (same Monday job), plus manual re-run.

**Process:**

1. **Content inventory sync**
   - Pull all published blog posts from HubSpot (URL, title, publish date, last updated, category)
   - Match each post to its GSC and GA4 data by URL/page path

2. **Performance snapshot**
   For each content piece, capture current-week vs previous-week vs 4-weeks-ago:
   - Organic clicks & impressions (GSC)
   - Average position for primary query (GSC)
   - Sessions & users (GA4)
   - Engagement rate & bounce rate (GA4)
   - Conversions — nc_apply, nc_calculate_repayment, nc_openaccount (GA4)

3. **Alert generation**
   Flag content that meets any of these criteria:
   - **Declining traffic:** >20% drop in organic sessions over 4-week window
   - **Position slipping:** Average position dropped by 3+ places for primary keyword
   - **Striking distance:** Ranking positions 4-15 for keywords with >500 monthly volume (refresh could push to top 3)
   - **Stale content:** Published >12 months ago, never updated, still getting traffic (refresh candidate)
   - **High impressions, low CTR:** Impressions >1000/week but CTR <2% (title/meta description needs work)
   - **Conversion drop:** Content that previously drove conversions but has stopped

4. **Refresh priority scoring**
   Each flagged piece gets a priority score based on:
   - Current traffic level (higher traffic = higher priority to protect)
   - Decline severity
   - Keyword difficulty of primary keyword (easier keywords = quicker win)
   - Conversion potential (does this page drive business actions?)

**Output:** Prioritised action list with:

- Content title + URL
- Alert type (declining, striking distance, stale, low CTR, conversion drop)
- Current metrics vs historical
- Primary keyword + current position
- Suggested action (update content, rewrite title/meta, add internal links, consolidate with similar content)
- Priority score (High / Medium / Low)

### 5.3 On-Demand Topic Validator

**Trigger:** User submits a topic idea (text) or news URL via dashboard form.

**Input types:**
- **Text input:** e.g., "best personal loans for salary earners in Nigeria"
- **URL input:** e.g., link to a news article about CBN policy changes

**Process:**

For text input:
1. Extract core keyword(s) from the input
2. Pull search volume, keyword difficulty, CPC, and trend data from DataforSEO
3. Pull SERP results for the primary keyword — who ranks, what content type, what SERP features
4. Check against existing HubSpot content inventory for overlap/cannibalisation risk
5. Generate AI analysis: suggested angles, subtopics to cover, recommended outline, content type, estimated difficulty to rank

For URL input:
1. Fetch and parse the article content
2. AI extraction: identify the core news/trend, extract relevant keywords
3. Run the same keyword analysis pipeline as text input
4. Additionally: assess timeliness (is this a trending topic with a window?), generate 3-5 derivative topic ideas from the news
5. Generate AI analysis with full brief

**Output (Full Brief):**

- **Keyword metrics:** Primary keyword volume, difficulty, CPC; related keywords table
- **SERP landscape:** Top 5 current results with their domain authority, content type, word count estimates
- **Competitor check:** Are any of our defined competitors ranking? Where?
- **Cannibalisation check:** Do we already have content targeting this or similar keywords? If yes, should we update existing content instead?
- **Recommended angles:** 2-3 suggested angles for the content, with rationale
- **Recommended outline:** Section-by-section outline for the content piece
- **Opportunity assessment:** Score (0-100) + plain-language verdict ("Strong opportunity — low competition, growing trend" or "Caution — we already rank #4 for this, consider refreshing existing content instead")
- **Timeliness flag** (for URL inputs): "Time-sensitive — publish within X days" or "Evergreen — no urgency"

### 5.4 Approval Workflow

**Default statuses:** Pending → Approved → Rejected

**Behaviour:**
- All AI-generated recommendations enter as "Pending"
- Any user with review access can move topics to Approved or Rejected
- Approved topics can be further marked as "Assigned" (with assignee name) and "Published" (with published URL)
- Rejected topics can have a rejection reason (free text)
- All status changes are timestamped with the user who made the change

**Admin configurability:**
- Admin can add intermediate stages (e.g., "Content Lead Approved" → "Marketing Lead Approved") via the admin settings panel
- Each stage has: a name, required role, and position in the sequence
- The system enforces that topics move through stages in order
- V1 ships with the simple three-status flow; the admin UI for adding stages is built into the settings but the feature is intentionally simple

**Dashboard views:**
- Default view shows "Pending" topics (this week's new recommendations)
- Filter tabs: All | Pending | Approved | Rejected | Assigned | Published
- Sort by: Opportunity score, search volume, keyword difficulty, date added
- Bulk actions: Approve selected, Reject selected

### 5.5 Export

- Export any filtered view as CSV
- Export a topic brief (from the validator) as a formatted document (PDF or markdown)
- Future (v2): Direct push to Google Sheets, or creation of a HubSpot draft blog post

### 5.6 Landing Page & Sign-Up

The public-facing pages live at the root of the application. These are accessible without authentication.

**Landing page (`/`)**
- Hero section: clear value proposition — "Know exactly what to write next. AI-powered content intelligence for marketing teams."
- How it works: 3-step visual (Sign up → Connect your data → Get weekly recommendations)
- Feature highlights: Topic Discovery, Content Health, On-Demand Validation
- Social proof section (placeholder for testimonials/logos — populated as customers onboard)
- Pricing section (see 5.9 Pricing Structure below)
- Primary CTA: **"Join the Waitlist"** → collects name + email, stores in `waitlist` table
- Footer: Terms of Service, Privacy Policy links
- Waitlist confirmation: "You're on the list! We'll be in touch soon."

**Waitlist management (admin-side):**
- Admin can view all waitlist entries in a simple admin panel (`/admin/waitlist`)
- Admin can approve waitlist entries individually or in bulk → sends invite email with a sign-up link (`/signup?invite=[token]`)
- The sign-up page is only accessible via an invite token during closed beta. Direct `/signup` without a token shows a message: "We're currently in closed beta. Join the waitlist to get early access."
- A feature flag (`OPEN_SIGNUP=false`) controls whether sign-up requires an invite token. When set to `true` for public launch, anyone can sign up directly.

**Sign-up page (`/signup?invite=[token]`)**
- Validates the invite token (checks it exists, hasn't expired, hasn't been used)
- Fields: Name, Email (pre-filled from waitlist), Password, Organisation Name
- Creates the user (Owner role) and the organisation in one step
- Email verification (v1: optional, can be added later; v1 uses immediate access)
- After sign-up: redirect to onboarding wizard

**Login page (`/login`)**
- Email + password
- "Forgot password" flow
- After login: redirect to dashboard (or onboarding if not yet completed)

**Team invite flow**
- Owner/Admin invites team members via email from Settings > Team
- Invitee receives link → lands on invite accept page (`/invite/[token]`) → sets password → joins the existing organisation with assigned role
- Invited users skip onboarding (data sources already configured by the admin)
- Team invites are separate from waitlist invites — they use a different token type and join an existing org rather than creating a new one

**Legal pages**
- **Terms of Service (`/terms`)** — placeholder page with standard SaaS terms (data processing, acceptable use, liability limitations, termination). Clearly marked as a template to be reviewed by legal counsel.
- **Privacy Policy (`/privacy`)** — placeholder page covering data collection (account info, API credentials, analytics data), data storage (encrypted credentials, PostgreSQL), third-party services (DataforSEO, Windsor, HubSpot, Anthropic, Resend), user rights (data export, deletion), and cookie usage. Clearly marked as a template.

### 5.7 Dashboard Layout (Authenticated)

**Global header:**
- Organisation name
- Domain selector dropdown (NairaCompare | BetsCompare | + Add Domain)
- Date range for performance data (default: last 4 weeks)
- User menu (profile, switch org — future, logout)

**Navigation tabs:**

1. **Overview** — Summary cards: new topics this week, content alerts count, top opportunities, performance trend charts
2. **Topic Recommendations** — The weekly discovery output, filterable and sortable, with approval actions
3. **Content Health** — The performance monitor output, filterable by alert type and priority
4. **Validate Topic** — On-demand form (text or URL input) with results display
5. **Settings** — Data source connections (with test buttons and status indicators), domain configuration, competitor management, approval workflow stages, API budget monitoring, team management (invite/remove users, assign roles)

### 5.8 Pricing Structure

Pricing is a hybrid of per-seat, per-domain, and usage-based (API credits). Billing is not implemented in v1 but the tiers are displayed on the landing page and the schema supports enforcement.

**Tier 1: Starter**
- 1 domain
- 2 seats (users)
- X API credits/month (covers ~4 weekly batches + ~20 on-demand validations)
- Core features: Topic Discovery, Content Health, Topic Validator, CSV export

**Tier 2: Growth**
- 3 domains
- 5 seats
- 3× API credits vs Starter
- Everything in Starter + SEMrush integration, configurable approval workflow

**Tier 3: Scale**
- 10 domains
- Unlimited seats
- 10× API credits vs Starter
- Everything in Growth + priority support, custom integrations

**Add-ons:**
- Additional domains: $X/domain/month
- Additional API credits: $X per credit pack
- Additional seats: $X/seat/month

*Exact pricing TBD before public launch. During closed beta, all features are available to beta users without charge.*

The database tracks usage (API credits consumed per org per month via the `weekly_batches` table) so enforcement can be added when billing goes live.

### 5.9 Onboarding & Credential Management

**Trigger:** After sign-up, the Owner lands on the onboarding wizard. The dashboard is inaccessible until at least one data source is connected and one domain is configured. A progress indicator shows which steps are completed.

**Step 1: DataforSEO (Required)**
- Fields: Login email, Password
- On submit: API call to DataforSEO to validate credentials and fetch account balance
- Success: Shows credit balance, marks as connected (green indicator)
- Failure: Shows error message, allows retry

**Step 2: Windsor.ai (Required for content performance features)**
- Fields: API Key
- On submit: API call to Windsor to fetch connected accounts
- Success: Displays discovered connectors (e.g., "GA4 — Nairacompare.ng", "Google Search Console — sc-domain:nairacompare.ng"). User selects which accounts to map to their first domain.
- Failure: Shows error, allows retry or skip (content performance features will be unavailable)

**Step 3: HubSpot (Required for content inventory)**
- Fields: Private App Access Token (with link to HubSpot docs for creating one)
- On submit: API call to HubSpot to validate and fetch blog list
- Success: Displays blogs found. User selects which blog maps to their first domain.
- Failure: Shows error, allows retry or skip

**Step 4: Anthropic API Key (Required for AI features)**
- Fields: API Key
- On submit: Lightweight validation call
- Success: Marks as connected
- Failure: Shows error. If skipped, AI-generated angles and outlines are disabled; keyword metrics and scoring still work.

**Step 5: SEMrush (Optional)**
- Fields: API Key
- Toggle: Enable/disable per domain
- On submit: Validates key, shows unit balance
- Can be skipped entirely

**Step 6: Domain Setup**
- Add first domain (name, URL, vertical, country/language for DataforSEO)
- Map Windsor accounts (GA4 property, GSC property) to this domain
- Map HubSpot blog to this domain
- Add competitors (up to 10)
- Set content categories

**Step 7: Invite Team (Optional)**
- Invite team members by email with role assignment (Admin, Editor, Viewer)
- Can be skipped and done later from Settings

**After onboarding:** The Settings page provides the same forms for editing credentials, testing connections, adding domains, and managing all configuration. Each data source shows a status badge (Connected / Error / Not configured) and a "Test Connection" button.

**Credential storage:** All API keys and passwords are encrypted using AES-256-GCM before being written to the database. The encryption key is the only secret that lives as an environment variable (`ENCRYPTION_KEY`). This means:
- Credentials are never visible in plain text in the database
- Credentials can be updated through the UI at any time
- Each organisation's credentials are completely isolated from other organisations

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React (Next.js) on Vercel | Fast deployment, serverless-friendly, team can iterate UI via Stitch |
| **Backend API** | Next.js API routes (serverless functions on Vercel) | Co-located with frontend, no separate server to manage |
| **Database** | PostgreSQL (Vercel Postgres or Supabase) | Structured data, good for time-series snapshots, multi-tenant isolation via org_id foreign keys |
| **Job scheduler** | Vercel Cron Jobs (or GitHub Actions as fallback) | Triggers weekly batch — iterates over all active organisations |
| **Data: Keywords & SERP** | DataforSEO REST API (direct) | Primary keyword data source, cost-effective for bulk lookups |
| **Data: Competitor enrichment** | SEMrush API (direct, optional) | Supplementary, behind feature flag |
| **Data: Search performance** | Google Search Console via Windsor.ai | Query-level impressions, clicks, CTR, position |
| **Data: Site analytics** | GA4 via Windsor.ai | Page-level traffic, engagement, conversions |
| **Data: Content inventory** | HubSpot API (direct MCP or REST) | Blog posts, metadata, content status |
| **AI layer** | Anthropic API (Claude) | Topic angle generation, outline creation, news article analysis, relevance scoring |
| **Auth** | NextAuth.js with credentials provider | Sign-up, login, password reset, invite-based team joining. Session-based with JWT. Role-based access control per organisation. |
| **Email (transactional)** | Resend or Postmark (v1: Resend free tier) | Sign-up confirmation, password reset, team invite emails |

### 6.2 Directory Structure (Claude Code Build)

```
contentintel/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page (public)
│   ├── (public)/                  # Public routes (no auth required)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx        # Requires invite token during closed beta
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── invite/[token]/page.tsx  # Team invite accept page
│   │   ├── terms/page.tsx         # Terms of Service
│   │   └── privacy/page.tsx       # Privacy Policy
│   ├── (app)/                     # Authenticated routes (require login + org)
│   │   ├── layout.tsx             # App shell: sidebar nav, domain selector, user menu
│   │   ├── onboarding/
│   │   │   └── page.tsx           # Post-signup setup wizard
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Overview dashboard
│   │   ├── topics/
│   │   │   └── page.tsx           # Topic recommendations list + approval
│   │   ├── content-health/
│   │   │   └── page.tsx           # Content performance monitor
│   │   ├── validate/
│   │   │   └── page.tsx           # On-demand topic validator
│   │   └── settings/
│   │       ├── page.tsx           # Settings overview
│   │       ├── connections/
│   │       │   └── page.tsx       # Data source connection management
│   │       ├── domains/
│   │       │   └── page.tsx       # Domain + competitor management
│   │       ├── team/
│   │       │   └── page.tsx       # Team members, invites, roles
│   │       └── workflow/
│   │           └── page.tsx       # Approval stage configuration
│   └── (admin)/                   # Platform admin routes (super-admin only)
│       └── admin/
│           ├── layout.tsx         # Admin shell
│           ├── waitlist/
│           │   └── page.tsx       # View waitlist, approve/reject, send invites
│           └── orgs/
│               └── page.tsx       # View all organisations (for platform monitoring)
├── components/
│   ├── landing/                   # Landing page components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── how-it-works.tsx
│   │   ├── pricing.tsx
│   │   └── waitlist-form.tsx      # Email capture form
│   ├── domain-selector.tsx
│   ├── topic-card.tsx
│   ├── approval-actions.tsx
│   ├── content-alert-card.tsx
│   ├── brief-display.tsx
│   ├── score-badge.tsx
│   ├── connection-status-badge.tsx
│   ├── credential-form.tsx
│   ├── onboarding/
│   │   ├── step-dataforseo.tsx
│   │   ├── step-windsor.tsx
│   │   ├── step-hubspot.tsx
│   │   ├── step-anthropic.tsx
│   │   ├── step-semrush.tsx
│   │   ├── step-domain-setup.tsx
│   │   └── step-invite-team.tsx
│   └── charts/
│       ├── trend-chart.tsx
│       └── performance-chart.tsx
├── lib/
│   ├── data-sources/
│   │   ├── dataforseo.ts          # DataforSEO API client (reads creds from DB per org)
│   │   ├── semrush.ts             # SEMrush API client (optional)
│   │   ├── windsor.ts             # Windsor.ai client (GSC + GA4)
│   │   └── hubspot.ts             # HubSpot API client
│   ├── analysis/
│   │   ├── topic-scorer.ts
│   │   ├── content-auditor.ts
│   │   ├── keyword-clusterer.ts
│   │   └── gap-analyzer.ts
│   ├── ai/
│   │   ├── topic-generator.ts
│   │   └── news-analyzer.ts
│   ├── auth/
│   │   ├── config.ts              # NextAuth configuration
│   │   ├── middleware.ts           # Route protection + org context + beta gate
│   │   └── invite.ts              # Invite token generation + validation (waitlist + team)
│   ├── credentials/
│   │   ├── encryption.ts
│   │   ├── credential-store.ts
│   │   └── connection-tester.ts
│   ├── email/
│   │   └── transactional.ts       # Invite, password reset, waitlist confirmation, beta invite
│   ├── db/
│   │   ├── schema.ts
│   │   ├── queries.ts
│   │   └── migrations/
│   └── config/
│       └── domains.ts
├── api/
│   ├── auth/
│   │   └── [...nextauth]/route.ts
│   ├── waitlist/
│   │   └── route.ts              # POST: join waitlist. GET: list (admin only)
│   ├── waitlist/approve/
│   │   └── route.ts              # POST: approve waitlist entry, send beta invite
│   ├── cron/
│   │   └── weekly-batch.ts
│   ├── topics/
│   │   ├── route.ts
│   │   └── validate/route.ts
│   ├── content/
│   │   └── route.ts
│   ├── connections/
│   │   ├── route.ts
│   │   └── test/route.ts
│   ├── team/
│   │   ├── route.ts
│   │   └── invite/route.ts
│   ├── onboarding/
│   │   └── route.ts
│   └── admin/
│       └── route.ts
├── .env.local                     # Infrastructure secrets ONLY (see Section 9)
├── package.json
└── vercel.json
```

### 6.3 Database Schema (Core Tables)

```
# === Multi-Tenant Foundation ===

organisations
  id, name, slug (unique, URL-friendly),
  plan (starter | growth | scale | beta), 
  max_domains, max_seats, monthly_api_credits,
  onboarding_completed_at, created_at, updated_at

users
  id, org_id (FK), email (unique globally), password_hash,
  name, role (owner | admin | editor | viewer),
  email_verified_at, created_at, updated_at

invites
  id, org_id (FK), email, role (admin | editor | viewer),
  token (unique), invited_by (FK → users.id),
  accepted_at, expires_at, created_at

sessions
  id, user_id (FK), session_token (unique), expires_at

# === Waitlist & Beta Access ===

waitlist
  id, name, email (unique), source (landing_page | referral),
  status (waiting | invited | signed_up | rejected),
  invite_token (unique, nullable), invited_at, signed_up_at,
  created_at

# === Data Source Credentials (per organisation) ===

data_source_credentials
  id, org_id (FK), provider (dataforseo | windsor | hubspot | semrush | anthropic),
  credentials_encrypted (TEXT — AES-256-GCM encrypted JSON blob),
  is_connected (BOOLEAN), last_tested_at, last_test_status (success | error),
  last_test_error, created_at, updated_at

  # The encrypted blob contains provider-specific fields:
  # dataforseo: { "login": "...", "password": "..." }
  # windsor: { "api_key": "..." }
  # hubspot: { "access_token": "..." }
  # semrush: { "api_key": "..." }
  # anthropic: { "api_key": "..." }

# === Domain Configuration ===

domains
  id, org_id (FK), domain, display_name, vertical,
  gsc_property, ga4_account_id, hubspot_blog_id,
  dataforseo_location, dataforseo_language,
  semrush_enabled, semrush_database,
  content_categories_json, is_active, created_at

competitors
  id, domain_id (FK), competitor_domain, added_at

# === Content Data (all scoped via domain → org) ===

content_inventory
  id, domain_id (FK), hubspot_id, url, title, slug, publish_date,
  last_updated, category, author, word_count, synced_at

content_snapshots
  id, content_id (FK), snapshot_date, organic_clicks, organic_impressions,
  avg_position, primary_query, sessions, users, engagement_rate,
  bounce_rate, conversions_json, ctr

# === Recommendations & Workflow ===

topic_recommendations
  id, domain_id (FK), batch_date, primary_keyword, supporting_keywords_json,
  search_volume, keyword_difficulty, opportunity_score, score_breakdown_json,
  competitor_data_json, serp_features_json, suggested_content_type,
  ai_angle, ai_outline, source (discovery | validator | manual),
  status (pending | approved | rejected | assigned | published),
  assigned_to, rejection_reason, status_changed_by (FK → users.id),
  status_history_json, created_at, updated_at

content_alerts
  id, content_id (FK), batch_date, alert_type, severity,
  current_metrics_json, previous_metrics_json, suggested_action,
  priority_score, status (open | acknowledged | resolved), created_at

approval_stages
  id, domain_id (FK), stage_name, required_role, position, is_active

# === Job Tracking ===

weekly_batches
  id, domain_id (FK), batch_date, status (running | completed | failed),
  topics_generated, alerts_generated, dataforseo_units_used,
  semrush_units_used, started_at, completed_at, error_log
```

**Multi-tenancy approach:** Row-level isolation via `org_id` foreign keys. Every database query includes an `org_id` filter derived from the authenticated user's session. The middleware injects `org_id` into the request context automatically — individual API routes never need to handle tenant isolation manually. This is enforced at the query layer (Drizzle ORM helper) so it's impossible to accidentally fetch another org's data.

### 6.4 API Budget Management

**DataforSEO cost estimation per weekly batch:**

| Operation | Est. calls | Est. cost per batch |
|---|---|---|
| Ranked keywords for domain | 1 | ~0.05 credits |
| Keyword suggestions (10 seed clusters × 1 call) | 10 | ~0.5 credits |
| Related keywords | 10 | ~0.5 credits |
| Search volume (bulk, up to 700 keywords) | 1-2 | ~0.35 credits |
| SERP analysis (top 30 opportunities) | 30 | ~1.5 credits |
| Domain intersection (vs 5 competitors) | 5 | ~2.5 credits |
| Backlink summary | 1 | ~0.02 credits |
| Google Trends | 5 | ~0.25 credits |

Total estimated: ~6 credits per weekly batch (DataforSEO uses a credit system, not unit-based like SEMrush — actual costs depend on plan).

**SEMrush budget (if enabled):** Target <2,000 units per weekly batch, reserving ~30,000 units/month for on-demand validations and ad-hoc queries.

The admin panel shows:
- DataforSEO credit balance + usage this month
- SEMrush units remaining + usage this month
- Per-batch breakdown

---

## 7. MVP Scope (v1) — Target: 3-4 Week Build (6 Claude Code Sessions)

### What's in v1:

- **Landing page** with product overview, pricing display, and waitlist CTA
- **Waitlist system** — email capture, admin approval, beta invite emails
- **Closed beta gating** — sign-up requires invite token (controlled by OPEN_SIGNUP feature flag)
- **Sign-up flow** (email + password + org name → creates organisation + Owner user)
- **Login, logout, forgot/reset password**
- **Terms of Service and Privacy Policy** placeholder pages
- Self-service onboarding wizard (connect data sources, add first domain, invite team)
- **Team invites** (email-based, role assignment: Admin, Editor, Viewer)
- **Role-based access control** (Owner, Admin, Editor, Viewer)
- **Platform admin panel** — waitlist management, org overview
- Multi-tenant data isolation (all queries scoped by org_id)
- Encrypted credential storage in database (AES-256-GCM)
- Single domain per org for launch, multi-domain architecture built in
- Topic Discovery Engine (full pipeline: DataforSEO keywords → scoring → clustering → AI angles)
- Content Performance Monitor (GSC + GA4 + HubSpot inventory sync → alerts)
- On-Demand Topic Validator (text input only; URL input is v1.1)
- Simple approval workflow (Pending → Approved → Rejected)
- Dashboard with all four main views (Overview, Topics, Content Health, Validate)
- Settings page with connection management, domain config, competitor management, team management
- CSV export
- Connection health monitoring (status badges, test buttons)
- Weekly cron job that iterates all active organisations

### What's deferred to v1.1:

- URL input for topic validator (news link parsing + AI extraction)
- Multi-domain support per org (add second, third domain)
- SEMrush integration (DataforSEO handles everything in v1)
- Teams/email notifications on new weekly recommendations
- Brief export as PDF
- Admin-configurable approval stages (backend schema supports it, UI is v1.1)
- Historical trend charts (data is captured from week 1, charts built later)
- Email verification on sign-up

### What's v2:

- **Stripe billing integration** (subscription management, plan enforcement, usage metering, upgrade/downgrade, invoices)
- **Open sign-up** (flip OPEN_SIGNUP to true, remove waitlist gate)
- **Google OAuth sign-up/login** (in addition to email/password)
- Automated content calendar integration (approved topics → HubSpot draft posts)
- Slack/Teams notifications on new recommendations
- Google Sheets sync
- Content cannibalisation detection (cross-content keyword overlap analysis)
- AI-generated first drafts triggered from approved topics
- Clarity integration (behavioural data overlay on content performance)
- Multi-user activity log and audit trail
- Org switching (user belongs to multiple orgs)
- Public API for integrations
- Plan enforcement (domain limits, seat limits, API credit caps)

---

## 8. Build Order (Claude Code Sessions)

**Session 1: Foundation, Auth & Multi-Tenancy**
- Next.js project setup with TypeScript, Tailwind, Vercel config
- Database schema + migrations (Drizzle + Postgres)
- Multi-tenant foundation: organisations table, org_id scoping middleware
- Auth system: sign-up (creates user + org), login, logout, password reset (NextAuth.js)
- Team invites: generate invite token → send email (Resend) → accept invite page → join org
- Role-based access control middleware (Owner, Admin, Editor, Viewer)
- AES-256-GCM encryption helpers for credential storage
- Credential store: CRUD for encrypted credentials scoped by org_id
- Connection tester: validate credentials against each API

**Session 2: Landing Page, Waitlist, Onboarding & Settings**
- Landing page: hero, features, how-it-works, pricing display, waitlist CTA
- Waitlist system: email capture form → DB storage → confirmation email
- Admin waitlist management page (`/admin/waitlist`): view, approve, send beta invites
- Closed beta sign-up gating: sign-up requires invite token, OPEN_SIGNUP feature flag
- Terms of Service and Privacy Policy placeholder pages
- Onboarding wizard UI (7-step flow: DataforSEO → Windsor → HubSpot → Anthropic → SEMrush → Domain → Invite Team)
- Settings > Connections page (edit credentials, test connections, status badges)
- Settings > Domains page (add/edit domains, manage competitors)
- Settings > Team page (list members, invite new, remove, change roles)
- All data source API clients built to read credentials from DB at runtime per org

**Session 3: Data Pipeline**
- Weekly batch job: iterates all active organisations, runs per-org pipeline
- Content inventory sync from HubSpot
- GSC data pull (queries, pages, metrics) via Windsor
- GA4 data pull (page-level performance) via Windsor
- Content snapshot storage (week-over-week)
- Alert generation logic (all 6 alert types)
- Graceful handling when a data source is not connected (skip, show "not configured" in UI)

**Session 4: Topic Discovery**
- Seed keyword extraction from GSC + existing content
- DataforSEO keyword expansion pipeline
- Opportunity scoring algorithm
- Keyword clustering logic
- Competitor gap analysis
- Claude AI integration for topic angles

**Session 5: Dashboard UI**
- App shell layout: sidebar nav, domain selector, org name, user menu
- Overview page with summary cards
- Topic Recommendations page with approval actions
- Content Health page with alert cards
- Settings page: approval workflow config, API budget monitoring
- CSV export

**Session 6: Topic Validator + Polish + Deploy**
- On-demand validation form + API endpoint
- Brief display component
- Cron job configuration (Vercel cron iterating all orgs)
- End-to-end testing with real data (NairaCompare as first org)
- Deploy to Vercel
- Verify multi-tenant isolation

---

## 9. Environment Variables Required

Only infrastructure-level secrets are stored as environment variables. All data source credentials (DataforSEO, Windsor, HubSpot, SEMrush, Anthropic) are managed through the UI and stored encrypted in the database.

```
# Database
DATABASE_URL=              # PostgreSQL connection string (Vercel Postgres or Supabase)

# Encryption (for securing credentials stored in DB)
ENCRYPTION_KEY=            # 32-byte hex string for AES-256-GCM — generate with: openssl rand -hex 32

# Auth
NEXTAUTH_SECRET=           # Session signing key — generate with: openssl rand -hex 32
NEXTAUTH_URL=              # Deployment URL (e.g., https://contentintel.vercel.app)

# Transactional email (for invites, password reset, waitlist)
RESEND_API_KEY=            # Resend.com API key (free tier: 3,000 emails/month)

# Cron security (prevents unauthorized batch triggers)
CRON_SECRET=               # Shared secret for Vercel cron job authentication

# Beta control
OPEN_SIGNUP=false          # Set to "true" for public launch. When "false", sign-up requires a waitlist invite token.

# Platform admin
ADMIN_EMAIL=               # Email address for the platform super-admin (can access /admin routes)
```

That's it — 8 environment variables to deploy. Everything else (DataforSEO, Windsor, HubSpot, SEMrush, Anthropic) is configured by each organisation through the Settings UI after sign-up.

---

## 10. Success Metrics

**Internal (dogfooding with NairaCompare):**

| Metric | Target |
|---|---|
| Time from "what should we write?" to approved topic | <10 minutes (down from hours) |
| Content refresh opportunities identified per week | 10-20 flagged automatically |
| Topic recommendations accepted per week | >30% of AI recommendations approved |
| Data freshness | All dashboards updated every Monday by 7am WAT |
| Team adoption | All 3 internal reviewers using the dashboard within 2 weeks of launch |

**SaaS (post-launch):**

| Metric | Target |
|---|---|
| Sign-up to first data source connected | <15 minutes |
| Onboarding completion rate | >70% of sign-ups complete onboarding |
| Weekly active orgs (using dashboard at least once/week) | Track from launch |
| Churn (orgs that stop using after first month) | <30% |

---

## 11. Open Questions

### Resolved

| # | Question | Resolution |
|---|---|---|
| 1 | Product name | **ContentIntel** |
| 2 | Launch strategy | Closed beta with waitlist → invite-based sign-up. OPEN_SIGNUP flag for public launch. |
| 3 | Pricing model | Hybrid: per-seat + per-domain + usage-based API credits. Three tiers (Starter, Growth, Scale) + add-ons. Billing implementation deferred to v2; pricing displayed on landing page in v1. |
| 4 | Custom domain | TBD — will be acquired for ContentIntel. Deploy to Vercel subdomain initially. |
| 5 | DataforSEO plan | Full access confirmed: SERP, Keywords Data, Labs, Domain Analytics, On-Page, Content Analysis, Business Data, Backlinks, AI Optimization APIs. Credits expandable. |
| 6 | Vercel plan | Hobby plan for beta (2-3 orgs). Will upgrade to Pro after launch. Hobby supports 2 cron jobs — sufficient for v1. |
| 7 | HubSpot private app | Exists with `content` scope. `crm.objects.contacts.read` to be added (update in HubSpot → Settings → Private Apps → Scopes). |
| 8 | Transactional email | Resend. Verified domain needed — will set up with product domain once acquired. |
| 9 | Terms / Privacy | Placeholder pages included in v1. To be reviewed by legal counsel before public launch. |
| 10 | Beta users | 4 businesses confirmed for closed beta, plus additional waitlist invites. |

### Still Open

1. **Custom domain acquisition** — need to register a domain for ContentIntel (e.g., contentintel.io, contentintel.app). Blocks: production deployment URL, email sender setup.
2. **HubSpot scope update** — add `crm.objects.contacts.read` to the existing private app. Then share the access token for verification during build.
3. **Landing page design** — user will share design direction from Stitch. Landing page copy drafted (see separate document).
4. **DataforSEO API credit cost mapping** — need to map exact credit costs per endpoint to set accurate API credit budgets for each pricing tier. Will do this during Session 3 when building the data pipeline.
