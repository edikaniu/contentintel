# ContentIntel — Privacy Policy

**Last updated:** [Date]

*IMPORTANT: This is a placeholder template. This policy should be reviewed and customised by a qualified legal professional before public launch, particularly to ensure compliance with applicable data protection laws (GDPR, NDPR, CCPA, etc.).*

---

## 1. Introduction

This Privacy Policy describes how [Company Name] ("we," "us," or "our") collects, uses, stores, and protects information when you use ContentIntel ("the Service").

We are committed to protecting your privacy and handling your data responsibly.

## 2. Information We Collect

### 2.1 Account Information
When you sign up, we collect:
- Name
- Email address
- Password (stored as a salted hash, never in plain text)
- Organisation name

### 2.2 Third-Party API Credentials
To operate the Service, you provide API keys and credentials for third-party platforms including:
- DataforSEO (login and password)
- Windsor.ai (API key)
- HubSpot (private app access token)
- SEMrush (API key) — optional
- Anthropic (API key) — for AI features

These credentials are encrypted using AES-256-GCM before storage and are only used to make API calls on your behalf.

### 2.3 Marketing and Analytics Data
Through your connected third-party accounts, the Service processes:
- Keyword and search data (search volumes, rankings, SERP data)
- Website analytics data (page views, sessions, engagement metrics)
- Content inventory data (blog post titles, URLs, publish dates, categories)
- Search Console data (queries, impressions, clicks, positions)

This data is fetched from your third-party accounts using the credentials you provide and is stored in our database to power the Service's features.

### 2.4 Usage Data
We may collect information about how you use the Service, including:
- Pages visited within the dashboard
- Features used (topic validation, exports, etc.)
- Timestamps of activity

### 2.5 Waitlist Information
If you join our waitlist, we collect your name and email address.

## 3. How We Use Your Information

We use the information we collect to:
- Provide and maintain the Service
- Authenticate your identity and manage your account
- Fetch data from third-party platforms on your behalf
- Generate content recommendations, topic briefs, and performance alerts
- Send transactional emails (invites, password resets, waitlist updates)
- Improve the Service based on usage patterns
- Communicate with you about the Service, including updates and changes

We do **not** use your data to:
- Sell to third parties
- Train AI models
- Target you with advertising
- Share with other ContentIntel users or organisations

## 4. Data Storage and Security

### 4.1 Infrastructure
- The Service is hosted on Vercel (frontend and serverless functions)
- Data is stored in a PostgreSQL database hosted by [Vercel Postgres / Supabase — to be confirmed]
- All data is stored in [region — to be confirmed]

### 4.2 Encryption
- API credentials are encrypted at rest using AES-256-GCM
- All data in transit is encrypted via TLS/HTTPS
- Passwords are hashed using bcrypt

### 4.3 Multi-Tenant Isolation
Each organisation's data is logically isolated at the database level. All queries are scoped by organisation ID, and middleware enforces this scoping on every request. No organisation can access another organisation's data.

### 4.4 Access Controls
- Role-based access control within each organisation (Owner, Admin, Editor, Viewer)
- Only authorised team members can access your organisation's data

## 5. Third-Party Services

The Service integrates with the following third-party services. Your use of these services is subject to their respective privacy policies:

| Service | Purpose | Their Privacy Policy |
|---|---|---|
| DataforSEO | Keyword and SERP data | https://dataforseo.com/privacy-policy |
| Windsor.ai | GA4 and Search Console data | https://windsor.ai/privacy-policy |
| HubSpot | Content inventory and CRM data | https://legal.hubspot.com/privacy-policy |
| SEMrush | Competitor analysis (optional) | https://www.semrush.com/company/legal/privacy-policy/ |
| Anthropic | AI-generated content analysis | https://www.anthropic.com/privacy |
| Resend | Transactional emails | https://resend.com/legal/privacy-policy |
| Vercel | Hosting and serverless functions | https://vercel.com/legal/privacy-policy |

We do not control these third-party services and are not responsible for their privacy practices.

## 6. Data Retention

- **Account data:** Retained for the duration of your account. Upon account deletion, your data is permanently deleted within 30 days.
- **Analytics and content data:** Retained for the duration of your account. Historical snapshots are kept to support trend analysis.
- **API credentials:** Deleted immediately upon disconnection of a data source or account deletion.
- **Waitlist data:** Retained until you sign up, request removal, or 12 months — whichever comes first.
- **Transactional email logs:** Retained for up to 90 days for debugging purposes.

## 7. Your Rights

Depending on your jurisdiction, you may have the following rights:

- **Access:** Request a copy of the personal data we hold about you
- **Correction:** Request correction of inaccurate personal data
- **Deletion:** Request deletion of your personal data and account
- **Data portability:** Request your data in a structured, machine-readable format
- **Objection:** Object to certain processing of your personal data
- **Withdraw consent:** Withdraw consent where processing is based on consent

To exercise any of these rights, contact us at [contact email — to be added].

### For Nigerian Users (NDPR)
If you are located in Nigeria, your data is processed in accordance with the Nigeria Data Protection Regulation (NDPR). You have the right to access, rectify, and delete your personal data.

### For EU/EEA Users (GDPR)
If you are located in the EU/EEA, we process your data based on: (a) your consent, (b) performance of our contract with you, or (c) our legitimate interests in providing and improving the Service.

## 8. Cookies

The Service uses essential cookies for:
- Authentication (session management)
- User preferences (selected domain, UI settings)

We do not use tracking cookies or third-party advertising cookies.

## 9. Children's Privacy

The Service is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. The "Last updated" date at the top of this page indicates when this policy was last revised.

## 11. Contact Us

For questions or concerns about this Privacy Policy or our data practices, contact us at:

[Contact email — to be added]

---

*This document is a template and does not constitute legal advice. Please consult a qualified legal professional to ensure this policy complies with all applicable data protection regulations in your jurisdictions.*
