export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-20 pb-12 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "800px",
          background: "radial-gradient(ellipse at center, rgba(45,27,105,0.2) 0%, transparent 70%)",
        }}
      />
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 sm:p-10">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-8 text-sm text-amber-400 font-body">
            TEMPLATE — To be reviewed by legal counsel before public launch
          </div>

          <h1 className="text-3xl font-headline font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-8 font-body">Last updated: March 2026</p>

          <div className="space-y-8 text-gray-400 leading-relaxed font-body">
            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">1. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-500">
                <li>Account information: name, email address, and password when you register</li>
                <li>Organisation information: company name and configuration preferences</li>
                <li>Data source credentials: API keys and authentication tokens for connected services (stored encrypted)</li>
                <li>Usage data: how you interact with the Service, including pages viewed and features used</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-500">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process and analyse your content and SEO data from connected sources</li>
                <li>Generate topic recommendations and content health alerts</li>
                <li>Send you transactional emails (invitations, password resets, notifications)</li>
                <li>Respond to your requests and provide customer support</li>
                <li>Monitor and analyse usage trends to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">3. Data Storage & Security</h2>
              <p>
                We take the security of your data seriously. All data source credentials (API keys,
                passwords, tokens) are encrypted using AES-256-GCM before storage and are never logged
                or exposed in plain text. Our infrastructure uses industry-standard security practices
                including encrypted connections (TLS), secure session management, and regular security
                reviews.
              </p>
              <p className="mt-2">
                Your data is stored on secure servers and is isolated per organisation using
                multi-tenant access controls. No organisation can access another organisation&apos;s data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">4. Third-Party Services</h2>
              <p>
                ContentIntel integrates with the following third-party services to provide its
                functionality. Data is shared with these services only as necessary to deliver the
                Service:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-500">
                <li>
                  <strong className="text-gray-300">DataforSEO</strong> — Used for keyword research, SERP analysis, and
                  competitor data. We send search queries and receive keyword metrics.
                </li>
                <li>
                  <strong className="text-gray-300">Windsor.ai</strong> — Used to retrieve Google Search Console and Google
                  Analytics 4 data. We access your connected analytics properties.
                </li>
                <li>
                  <strong className="text-gray-300">HubSpot</strong> — Used to sync your content inventory from HubSpot CMS.
                  We read blog post data from your HubSpot account.
                </li>
                <li>
                  <strong className="text-gray-300">Anthropic (Claude)</strong> — Used for AI-powered topic angle generation,
                  content outlines, and news analysis. We send anonymised content data for processing.
                </li>
                <li>
                  <strong className="text-gray-300">Resend</strong> — Used for sending transactional emails (invitations,
                  password resets, waitlist confirmations). We share recipient email addresses and
                  names.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-500">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate personal data</li>
                <li>Request deletion of your personal data and account</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for data processing where applicable</li>
                <li>Object to processing of your personal data</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, contact us at the email address provided below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">6. Cookies</h2>
              <p>
                We use essential cookies to maintain your session and authentication state. These
                cookies are strictly necessary for the Service to function and cannot be disabled.
                We do not use tracking cookies or third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">7. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the updated policy on the Service and updating the
                &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">8. Contact</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please
                contact us at{" "}
                <a href="mailto:privacy@contentintel.app" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 transition-colors">
                  privacy@contentintel.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
