export default function TermsOfServicePage() {
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

          <h1 className="text-3xl font-headline font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-8 font-body">Last updated: March 2026</p>

          <div className="space-y-8 text-gray-400 leading-relaxed font-body">
            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                Welcome to ContentIntel. These Terms of Service (&quot;Terms&quot;) govern your access to and use of
                the ContentIntel platform, including any associated services, features, and content
                (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound
                by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">2. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using the Service, you acknowledge that you have
                read, understood, and agree to be bound by these Terms and our Privacy Policy. If you
                do not agree, you must not use the Service. If you are using the Service on behalf of
                an organisation, you represent that you have authority to bind that organisation to
                these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">3. Account Registration</h2>
              <p>
                To use the Service, you must register for an account by providing accurate and complete
                information. You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account. You agree to notify
                us immediately of any unauthorised use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">4. Data Processing</h2>
              <p>
                ContentIntel processes data from third-party sources including search engines, analytics
                platforms, and content management systems on your behalf. You are responsible for
                ensuring you have the appropriate rights and permissions to connect these data sources.
                We process data solely for the purpose of providing the Service and do not sell your
                data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-500">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorised access to any part of the Service</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to transmit malicious code or harmful content</li>
                <li>Share your account credentials with unauthorised third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">6. Intellectual Property</h2>
              <p>
                The Service, including its design, features, and content, is owned by ContentIntel and
                protected by intellectual property laws. You retain ownership of any data you submit to
                the Service. By using the Service, you grant us a limited licence to process your data
                solely for the purpose of providing the Service to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ContentIntel shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">8. Termination</h2>
              <p>
                We may terminate or suspend your access to the Service at any time, with or without
                cause, upon reasonable notice. You may terminate your account at any time by contacting
                us. Upon termination, your right to use the Service will cease immediately, and we may
                delete your account data in accordance with our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any
                material changes by posting the updated Terms on the Service and updating the
                &quot;Last updated&quot; date. Your continued use of the Service after changes are posted
                constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-headline font-semibold text-white mb-3">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@contentintel.app" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 transition-colors">
                  legal@contentintel.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
