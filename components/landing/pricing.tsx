import Link from "next/link";

const checkLime = (
  <svg width="16" height="16" viewBox="0 0 16 16" className="mt-0.5 flex-shrink-0"><path d="M4 8l3 3 5-5" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);

const checkViolet = (
  <svg width="16" height="16" viewBox="0 0 16 16" className="mt-0.5 flex-shrink-0"><path d="M4 8l3 3 5-5" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 landing-scale-reveal">
          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
            Simple pricing that <span className="landing-gradient-text">scales with your team.</span>
          </h2>
        </div>
        <div className="text-center mb-14 landing-scale-reveal">
          <span className="inline-block bg-violet-500/10 border border-violet-500/20 text-[#8B5CF6] text-xs font-medium px-4 py-1.5 rounded-full">
            Early access pricing &mdash; join the beta to lock in these rates.
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="landing-dark-card p-7 landing-scale-reveal flex flex-col">
            <h3 className="font-headline font-bold text-xl text-white mb-1">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-headline font-extrabold text-3xl text-white">TBD</span>
              <span className="text-gray-600 text-sm font-body">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["1 domain", "2 seats", "Topic Discovery", "Content Health Monitor", "Topic Validator", "CSV export", "Email support"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 font-body">{checkLime}{f}</li>
              ))}
            </ul>
            <Link href="/onboarding" className="block text-center border border-[#222] hover:border-[#444] text-white font-semibold py-3 rounded-xl transition-colors">Get Started</Link>
          </div>

          {/* Growth (Popular) */}
          <div className="landing-dark-card landing-pricing-popular p-7 relative landing-scale-reveal flex flex-col" style={{ transitionDelay: "0.1s" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-violet-500 to-lime-400 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-violet-500/20">Most Popular</span>
            </div>
            <h3 className="font-headline font-bold text-xl text-white mb-1">Growth</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-headline font-extrabold text-3xl text-white">TBD</span>
              <span className="text-gray-600 text-sm font-body">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["3 domains", "5 seats", "Everything in Starter", "SEMrush integration", "Configurable approval workflow", "Priority support", "3x API credits"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 font-body">{checkViolet}{f}</li>
              ))}
            </ul>
            <Link href="/onboarding" className="landing-gradient-border-btn block text-center text-sm !py-3">Get Started</Link>
          </div>

          {/* Scale */}
          <div className="landing-dark-card p-7 landing-scale-reveal flex flex-col" style={{ transitionDelay: "0.2s" }}>
            <h3 className="font-headline font-bold text-xl text-white mb-1">Scale</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-headline font-extrabold text-3xl text-white">TBD</span>
              <span className="text-gray-600 text-sm font-body">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["10 domains", "Unlimited seats", "Everything in Growth", "Priority support", "Custom integrations", "10x API credits", "SLA"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 font-body">{checkLime}{f}</li>
              ))}
            </ul>
            <Link href="/onboarding" className="block text-center border border-[#222] hover:border-[#444] text-white font-semibold py-3 rounded-xl transition-colors">Get Started</Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8 landing-scale-reveal font-body">Pricing will be finalized before public launch. During closed beta, all features are available at no charge.</p>
      </div>
    </section>
  );
}
