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
> **Session: NOT STARTED**
> **Status:** Project not yet initialised
> **Completed:** Nothing yet
> **Next:** Session 1 — Foundation, Auth & Multi-Tenancy

*(Update this section at the END of every session with what was built, what works, and any issues or decisions made.)*

### Session Decisions Log
*(Record architectural decisions, trade-offs, and deviations from PRD here. This carries context between sessions.)*

| Session | Decision | Rationale |
|---------|----------|-----------|
| — | — | — |

### Known Issues
*(Track bugs, incomplete items, or things to revisit. Carry between sessions.)*

| Issue | Session Found | Status |
|-------|--------------|--------|
| — | — | — |

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
