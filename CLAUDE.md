# ⚙️ ELITE DEV PROTOCOL — ABSOLUTE RULES

> Channeling Torvalds' precision, Carmack's discipline, Pike's simplicity, and Knuth's correctness.
> Read this fully before making any changes. No exceptions.

---

## 🔒 RULE 0 — READ EVERYTHING FIRST
- Before touching **any** code, read the **entire relevant file(s)** top to bottom.
- Trace the **full execution path** of the problem before forming a solution.
- Never assume — **verify** by reading actual code, not memory of it.
- If a file was already shown earlier in the conversation, **re-read it anyway** — things change.

---

## 🎯 RULE 1 — SCOPE LOCK
- You are given a task. Fix **only that task**. Nothing else exists.
- Do NOT refactor, rename, reformat, reorganize, or "clean up" **anything** not directly causing the reported problem.
- Do NOT change files that were not explicitly mentioned or shown to be part of the bug.
- Resist every instinct to improve — **improvement is scope creep unless asked.**

---

## 🔬 RULE 2 — MINIMAL DIFF PRINCIPLE *(Torvalds Law)*
- The best fix is the **smallest fix** that fully solves the problem.
- If you can fix it in 1 line, do not write 5.
- If you can fix it in 5 lines, do not rewrite the function.
- Every line you add is a line that can break something. Respect that.

---

## 🧠 RULE 3 — DIAGNOSE BEFORE YOU PRESCRIBE *(Knuth's Correctness First)*
- State the **root cause** of the bug in plain English before writing any code.
- Do not jump to a fix until the diagnosis is confirmed.
- If two possible causes exist, **identify both** and explain which one you're fixing and why.
- A wrong fix applied confidently is worse than no fix at all.

---

## 🚫 RULE 4 — SYNTAX CLOSURE IS NON-NEGOTIABLE
- Every opening `{`, `(`, `[`, `<tag>` **must** have a verified closing counterpart.
- After every edit, mentally (or literally) trace brackets/tags from **outer to inner**.
- Never submit code where you haven't confirmed all syntax is closed and balanced.
- Missing a closing bracket is not a small mistake — it cascades and kills everything downstream.

---

## 🔗 RULE 5 — PRESERVE INTERFACES *(Pike's Simplicity)*
- Do NOT change function signatures, prop names, exported types, or API contracts unless the fix **explicitly** requires it.
- If a fix requires changing an interface, **stop and flag it** before proceeding.
- Changing an interface without telling the developer breaks things they can't see.

---

## ⚠️ RULE 6 — UNCERTAINTY = STOP, ASK, DON'T GUESS *(Carmack's Discipline)*
- If you are **not 100% certain** a change is safe, do not make it.
- If you see two ways to fix something and both have trade-offs, **present both** and ask.
- Guessing in codebases causes bugs that take hours to find. It is never worth it.
- The phrase *"this should work"* is banned. Either it works and you can prove it, or you ask.

---

## 📋 RULE 7 — SHOW YOUR WORK
- For every fix, provide:
  - 📁 **File path**
  - 🔢 **Line numbers affected**
  - ❌ **Before** (exact original code)
  - ✅ **After** (exact replacement code)
  - 💬 **Why** this fixes the root cause
- No summaries without diffs. No diffs without explanations.

---

## 🔄 RULE 8 — VERIFY AFTER EVERY CHANGE
- After each individual fix, confirm:
  - [ ] File still compiles / no syntax errors
  - [ ] No imports broken
  - [ ] No other functions affected
  - [ ] Server/app still starts
- Do NOT batch multiple fixes and verify at the end. Verify **each one** independently.

---

## 🧱 RULE 9 — RESPECT THE ARCHITECTURE *(Jeff Dean's Systems Thinking)*
- Understand **why** the code was written the way it was before changing it.
- Do not introduce a pattern that conflicts with the existing architecture.
- If the existing architecture is part of the problem, **flag it separately** — don't silently work around it in ways that create hidden technical debt.

---

## 🪶 RULE 10 — LESS IS MORE *(Van Rossum's Readability)*
- Prefer **readable over clever**.
- Prefer **explicit over implicit**.
- Prefer **simple and correct** over complex and slightly faster.
- The next person reading this code (including you, tomorrow) should understand it in 30 seconds.

---

## 🛑 RULE 11 — HARD STOPS (Never violate these)
- ❌ Never delete code unless deletion is the fix itself
- ❌ Never change working code adjacent to broken code
- ❌ Never assume a bug is in the frontend if you haven't ruled out the backend (and vice versa)
- ❌ Never make changes across 3+ files for a fix that should touch 1
- ❌ Never add dependencies or packages unless explicitly asked

---

## 📌 PROJECT-SPECIFIC RULES — ContentIntel

### Project Overview
ContentIntel is a **multi-tenant SaaS platform** for content intelligence — topic discovery, content health monitoring, and on-demand topic validation. It combines data from DataforSEO, Google Search Console (via Windsor.ai), GA4 (via Windsor.ai), HubSpot, and optionally SEMrush into a unified dashboard with an approval workflow.

### Source of Truth
- **PRD:** `contentintel-prd-v1_3.md` — This file is the definitive product specification. When in doubt about any feature, data model, API endpoint, or business logic, read the PRD. Do NOT invent features, fields, or flows not described in it.
- **UI Screens:** Stitch-generated HTML/CSS/React code will be provided for dashboard screens. When integrating UI, preserve the design system (colours, spacing, components) exactly as exported. Do not restyle.

### Stack (DO NOT DEVIATE)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) with TypeScript | Use `app/` directory structure per PRD Section 6.2 |
| Styling | Tailwind CSS + shadcn/ui | Do NOT install other UI libraries |
| Database | PostgreSQL (Vercel Postgres or Supabase) | Use Drizzle ORM for schema and queries |
| Auth | NextAuth.js (credentials provider) | JWT sessions. No OAuth in v1. |
| Email | Resend (free tier) | For invites, password reset, waitlist confirmation |
| Data APIs | DataforSEO (direct REST), Windsor.ai (REST), HubSpot (REST), Anthropic (REST) | SEMrush is OPTIONAL — behind feature flag |
| AI | Anthropic API (Claude) | For topic angles, outlines, news analysis |
| Hosting | Vercel (Hobby plan for beta) | Serverless functions, Vercel Cron |
| Encryption | AES-256-GCM (Node.js crypto) | For credential storage in DB |

### Directory Structure
Follow PRD Section 6.2 exactly. Key paths:
```
contentintel/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── (public)/                   # Auth pages — no login required
│   ├── (app)/                      # Dashboard — login required
│   │   ├── dashboard/
│   │   ├── topics/
│   │   ├── content-health/
│   │   ├── validate/
│   │   └── settings/
│   └── (admin)/                    # Platform admin — super-admin only
├── components/
├── lib/
│   ├── data-sources/               # API clients (DataforSEO, Windsor, HubSpot)
│   ├── analysis/                   # Scoring, clustering, auditing
│   ├── ai/                         # Anthropic integration
│   ├── auth/                       # NextAuth config, middleware, invites
│   ├── credentials/                # Encryption, credential store, connection tester
│   ├── email/                      # Resend transactional emails
│   └── db/                         # Drizzle schema, queries, migrations
└── api/                            # Route handlers
```

### Multi-Tenancy — CRITICAL
- **Every** database query MUST include `org_id` filtering.
- The auth middleware injects `org_id` into request context from the session.
- Individual API routes and queries should NEVER handle tenant isolation manually — use the Drizzle ORM helper that enforces `org_id` scoping automatically.
- **Never** allow a query that could return another organisation's data. This is a hard security boundary.

### Credential Storage — CRITICAL
- All data source API keys/passwords are stored **encrypted** in the `data_source_credentials` table using AES-256-GCM.
- The only env var for encryption is `ENCRYPTION_KEY` (32-byte hex).
- Credentials are **never** logged, never returned in API responses in plain text, never exposed to the frontend.
- API clients read credentials from DB at runtime, decrypting per-request.

### Data Source API Clients
- Each client (`lib/data-sources/dataforseo.ts`, `windsor.ts`, `hubspot.ts`, `semrush.ts`) reads credentials from the encrypted credential store, scoped by `org_id`.
- If a data source is not configured for an org, the client returns a clear "not configured" response — never throws unhandled errors.
- SEMrush is behind a feature flag (`semrush_enabled` per domain). If not enabled, skip all SEMrush calls. The system must function fully without SEMrush.

### Environment Variables (ONLY these 8)
```
DATABASE_URL
ENCRYPTION_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY
CRON_SECRET
OPEN_SIGNUP=false
ADMIN_EMAIL
```
Everything else (DataforSEO, Windsor, HubSpot, SEMrush, Anthropic credentials) is stored in the database per organisation. Do NOT add more env vars.

### Database Schema
Follow PRD Section 6.3 exactly. Core tables:
- `organisations`, `users`, `invites`, `sessions` — multi-tenant foundation
- `waitlist` — beta access management
- `data_source_credentials` — encrypted API credentials per org
- `domains`, `competitors` — domain configuration
- `content_inventory`, `content_snapshots` — content data
- `topic_recommendations`, `content_alerts` — outputs
- `approval_stages`, `weekly_batches` — workflow and job tracking

### Build Sessions
This project is built across 6 sessions. Each session has a defined scope in PRD Section 8. **Do not build ahead.** Complete the current session's scope fully before moving to the next. Each session prompt will specify exactly what to build.

### Current Session
> **Session: 6 — COMPLETED (v1 COMPLETE)**
> **Status:** All features built, polished, and compiling. Project is v1 complete.
> **Completed:**
> - Topic Validator API (`app/api/topics/validate/route.ts`) — POST endpoint accepts topic text + domainId, fetches keyword data + SERP + related keywords from DataforSEO in parallel, checks competitors against SERP, checks content_inventory for cannibalisation, generates AI analysis via Anthropic (angles, outline, content type, opportunity score, verdict), returns full brief object, falls back to heuristic scoring if AI unavailable
> - Brief Display component (`components/brief-display.tsx`) — SVG circular score gauge (green/amber/red), keyword metrics cards with trend indicator, related keywords table, SERP landscape table with feature badges, competitor check card, cannibalisation check card, AI recommendations with numbered outline, "Add to Recommendations" button, "Export Brief" markdown download
> - Validate Topic page (`app/(app)/validate/page.tsx`) — text input tab (active) + URL input tab (disabled with "Coming in v1.1" tooltip), domain-aware form, multi-step animated progress indicator, error state with retry, full brief display on success
> - Topics POST endpoint (`app/api/topics/route.ts`) — added POST handler to create topic recommendations from validator, source="validator", status="pending"
> - Vercel cron config (`vercel.json`) — weekly batch Monday 5:00 UTC, endpoint /api/cron/weekly-batch
> - Mobile responsiveness polish: topics page header/filters/rows stack on mobile, content-health summary grid 2-col on mobile, filter bars wrap on small screens, column headers hidden on mobile
> - All pages verified for: loading states (skeletons/spinners), empty states, error handling, "no domain selected" states
> - `npm run build` passes with zero errors (43 routes)

### Session Decisions Log

| Session | Decision | Rationale |
|---------|----------|-----------|
| 1 | Added `password_reset_tokens` table (not in PRD schema) | Needed for password reset flow; tokens must be stored with expiry and used-at tracking |
| 1 | Used `next-auth@4` (not v5) | v4 is stable with App Router support via `getServerSession`; v5 (Auth.js) has breaking changes and is less documented |
| 1 | Resend client lazily initialized via `getResend()` | Resend constructor throws if API key is missing; lazy init allows build without env vars set |
| 1 | Used Next.js middleware (withAuth) for route protection | Deprecated in Next.js 16 in favour of "proxy" but still functional; will evaluate migration in future session |
| 1 | `useSearchParams` wrapped in Suspense boundaries | Required by Next.js for static generation of pages using client-side search params |
| 2 | Stitch designs not accessible via URL — built with design system colors | Used indigo #3730A3 primary, emerald #059669 accent, slate neutrals as fallback per instructions |
| 2 | Onboarding saves + tests credentials in one step | Better UX: user clicks Continue, credentials are saved then tested, only proceeds on success |
| 2 | Admin routes use ADMIN_EMAIL env var check (not role) | Platform admin is separate from org-level roles per PRD; checked in both middleware and admin layout |
| 3 | Windsor API used for both GSC and GA4 data pulls | Per PRD, GSC and GA4 are accessed via Windsor.ai REST API, not direct Google APIs |
| 3 | URL matching uses path normalization for snapshot building | GSC/GA4 may return full URLs or paths; extractPath() normalizes for matching against content_inventory URLs |
| 3 | Pipeline continues on partial data source failures | If HubSpot/GSC/GA4 not configured or fails, that step is skipped and logged; other steps proceed |
| 4 | Used claude-haiku-4-5 for AI topic angle generation | Cost-effective for bulk generation (up to 30 topics per batch); model ID `claude-haiku-4-5-20251001` |
| 4 | Seed clusters capped at top 3 seeds per cluster for API calls | Limits DataforSEO API credit consumption per batch while still getting good keyword coverage |
| 4 | Competitor gap keywords get +10 score boost | Per PRD: "These get a score boost (they represent proven demand our competitors are capturing)" |
| 4 | Keyword clustering uses shared significant words (2+) | Stop words filtered out; substring matching as fallback; max 5 supporting keywords per cluster |
| 5 | SVG-based charts instead of recharts library | PRD mentions recharts but CLAUDE.md prohibits installing unlisted packages; inline SVG achieves same visual without dependency |
| 5 | Domain context via React context + localStorage | Selected domain persists across page navigations and browser sessions; DomainProvider wraps AppShell |
| 5 | Stitch designs successfully fetched via MCP | Used Stitch MCP tools to get screen HTML, then adapted to React/Next.js components with lucide-react icons |
| 5 | All dashboard API queries run in parallel via Promise.all | Dashboard stats endpoint runs 8 queries simultaneously for fast page load |
| 5 | Topic status history tracked as JSONB array | Each approve/reject appends to statusHistoryJson with changedBy, changedAt, and optional rejectionReason |
| 6 | Used claude-haiku-4-5 for validator AI analysis | Same model as batch topic generation; cost-effective for on-demand validation with 800 max_tokens |
| 6 | Fallback heuristic scoring when AI unavailable | Simple volume/difficulty formula gives approximate score if Anthropic credentials missing or API fails |
| 6 | DataforSEO calls parallelized in validator | keyword suggestions, SERP results, and related keywords fetched via Promise.all for faster response |
| 6 | Cannibalisation check uses first 3 words of topic | ilike query with first 3 keyword words joined by % wildcard matches against content_inventory titles |
| 6 | Vercel cron set to Monday 5:00 UTC | Equals 6:00 AM WAT (West Africa Time) per PRD requirement |

### Known Issues

| Issue | Session Found | Status |
|-------|--------------|--------|
| Next.js 16 deprecates `middleware` in favour of `proxy` convention | 1 | Monitor — middleware still works, evaluate migration later |
| Stitch design URLs could not be resolved | 2 | Resolved in Session 5 — Stitch MCP tools used to fetch HTML, designs integrated |

---

### DO NOT:
- ❌ Install packages not listed in the stack above without asking
- ❌ Use `WidthType.PERCENTAGE` — not relevant here, but respect similar platform constraints
- ❌ Add environment variables beyond the 8 listed
- ❌ Build features from future sessions (no building ahead)
- ❌ Store credentials in env vars (they go in the database, encrypted)
- ❌ Write queries without `org_id` scoping
- ❌ Skip connection testing when building API clients
- ❌ Use OAuth/social login (v2, not v1)
- ❌ Implement Stripe billing (v2, not v1)
- ❌ Build URL input for topic validator (v1.1, not v1)

### ALWAYS:
- ✅ Read the PRD section relevant to your current task before writing code
- ✅ Use Drizzle ORM for all database operations
- ✅ Encrypt credentials before DB writes, decrypt after DB reads
- ✅ Include `org_id` in every query
- ✅ Handle "data source not configured" gracefully (skip, show status in UI)
- ✅ Validate invite tokens before allowing sign-up
- ✅ Test that the app starts and compiles after every change
- ✅ Update the "Current Session" and "Session Decisions Log" sections above when asked or at session end
