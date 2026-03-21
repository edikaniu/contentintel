"use client";

import { useState, FormEvent } from "react";

export function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setErrorMessage(data.error || "This email is already on the waitlist.");
        } else {
          setErrorMessage(data.error || "Something went wrong. Please try again.");
        }
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="waitlist" className="py-20 px-4 relative z-10">
      <div className="max-w-2xl mx-auto">
        <div className="landing-dark-card rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden landing-scale-reveal" style={{ borderColor: "#2D1B69" }}>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-violet-800/10 pointer-events-none" />

          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4 relative">
            We&apos;re launching soon.<br /><span className="landing-gradient-text">Get early access.</span>
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed relative font-body">
            ContentIntel is currently in closed beta with a small group of marketing teams. Join the waitlist to be among the first to try it &mdash; and lock in early access pricing.
          </p>

          {status === "success" ? (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 relative">
              <svg className="mx-auto h-12 w-12 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-bold text-white font-headline">You&apos;re on the list!</h3>
              <p className="mt-2 text-sm text-gray-500 font-body">
                We&apos;ll be in touch soon. Keep an eye on your inbox for your invite.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors font-body"
              />
              <input
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors font-body"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="landing-gradient-border-btn text-sm whitespace-nowrap !py-3 !px-6 disabled:opacity-60"
              >
                {status === "loading" ? "Submitting..." : "Join the Waitlist"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-sm text-red-400 mt-4 relative font-body">{errorMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
}
