import { CheckCircle } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3730A3]">Pricing</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-[-0.02em]">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-slate-600">
          Choose the plan that fits your team. All plans include core content intelligence features.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {/* Starter */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Starter</h3>
            <p className="mt-1 text-sm text-slate-500">For small teams getting started</p>
            <div className="mt-6">
              <span className="text-4xl font-black text-slate-900">TBD</span>
              <span className="text-sm text-slate-500"> / month</span>
            </div>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
            {["1 domain", "2 seats", "Topic Discovery", "Content Health Monitor", "Topic Validator", "CSV export"].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="#waitlist"
            className="mt-8 block rounded-xl border border-[#3730A3]/20 py-3 text-center text-sm font-bold text-[#3730A3] transition-colors hover:bg-[#3730A3]/5"
          >
            Join Waitlist
          </a>
        </div>

        {/* Growth */}
        <div className="relative flex flex-col rounded-3xl border-2 border-[#3730A3] bg-white p-8 shadow-lg">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#3730A3] px-4 py-1 text-xs font-bold text-white">
            Most Popular
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Growth</h3>
            <p className="mt-1 text-sm text-slate-500">For growing marketing teams</p>
            <div className="mt-6">
              <span className="text-4xl font-black text-slate-900">TBD</span>
              <span className="text-sm text-slate-500"> / month</span>
            </div>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
            {["3 domains", "5 seats", "Everything in Starter", "SEMrush integration", "Configurable approval workflow", "3x API credits"].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="#waitlist"
            className="mt-8 block rounded-xl bg-[#3730A3] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#3730A3]/90 shadow-lg shadow-[#3730A3]/20"
          >
            Join Waitlist
          </a>
        </div>

        {/* Scale */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Scale</h3>
            <p className="mt-1 text-sm text-slate-500">For large teams and agencies</p>
            <div className="mt-6">
              <span className="text-4xl font-black text-slate-900">TBD</span>
              <span className="text-sm text-slate-500"> / month</span>
            </div>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
            {["10 domains", "Unlimited seats", "Everything in Growth", "Priority support", "Custom integrations", "10x API credits"].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="#waitlist"
            className="mt-8 block rounded-xl border border-[#3730A3]/20 py-3 text-center text-sm font-bold text-[#3730A3] transition-colors hover:bg-[#3730A3]/5"
          >
            Join Waitlist
          </a>
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        Pricing will be finalized before public launch. During closed beta, all features are available at no charge.
      </p>
    </section>
  );
}
