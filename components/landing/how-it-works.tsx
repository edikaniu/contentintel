export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 landing-scale-reveal">
          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
            From sign-up to weekly recommendations<br className="hidden sm:block" /> in <span className="landing-gradient-text">15 minutes.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector dashed line (desktop) */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] landing-step-dash" />

          {/* Step 1 */}
          <div className="landing-scale-reveal text-center">
            <div className="w-14 h-14 rounded-lg bg-[#111] border border-[#8B5CF6]/40 flex items-center justify-center mx-auto mb-5 text-[#8B5CF6] font-headline font-bold text-lg relative z-10">1</div>
            <h3 className="font-headline font-bold text-lg text-white mb-3">Connect your data</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-body">Link your DataforSEO, Google Search Console, GA4, and HubSpot accounts. ContentIntel pulls everything together automatically.</p>
          </div>

          {/* Step 2 */}
          <div className="landing-scale-reveal text-center" style={{ transitionDelay: "0.15s" }}>
            <div className="w-14 h-14 rounded-lg bg-[#111] border border-[#8B5CF6]/40 flex items-center justify-center mx-auto mb-5 text-[#8B5CF6] font-headline font-bold text-lg relative z-10">2</div>
            <h3 className="font-headline font-bold text-lg text-white mb-3">Get weekly topic recommendations</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-body">Every Monday, ContentIntel analyses search trends, competitor gaps, and your existing content to surface the highest-opportunity topics &mdash; scored and ranked.</p>
          </div>

          {/* Step 3 */}
          <div className="landing-scale-reveal text-center" style={{ transitionDelay: "0.3s" }}>
            <div className="w-14 h-14 rounded-lg bg-[#111] border border-[#8B5CF6]/40 flex items-center justify-center mx-auto mb-5 text-[#8B5CF6] font-headline font-bold text-lg relative z-10">3</div>
            <h3 className="font-headline font-bold text-lg text-white mb-3">Review, approve, and assign</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-body">Your team reviews the recommendations on a shared dashboard. Approve topics, reject the rest, and assign writers &mdash; all in one place.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
