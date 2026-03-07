"use client";

import { useState, FormEvent } from "react";
import { CheckCircle } from "lucide-react";

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
    <section id="waitlist" className="max-w-[1200px] mx-auto px-6 py-20">
      <div className="bg-[#3730A3] rounded-3xl p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grad)" />
            <defs>
              <linearGradient id="grad" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "white", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "white", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.02em]">
            Ready to upgrade your intelligence?
          </h2>
          <p className="text-lg md:text-xl text-indigo-100/80">
            Join the waitlist and be among the first to make data-driven content decisions with ContentIntel.
          </p>

          {status === "success" ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <CheckCircle className="mx-auto h-12 w-12 text-white" />
              <h3 className="mt-4 text-xl font-bold text-white">You&apos;re on the list!</h3>
              <p className="mt-2 text-sm text-indigo-100/80">
                We&apos;ll be in touch soon. Keep an eye on your inbox for your invite.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              <input
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-white text-[#3730A3] px-10 py-4 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all shadow-xl disabled:opacity-60 whitespace-nowrap"
              >
                {status === "loading" ? "Submitting..." : "Get Started Free"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-sm text-red-200">{errorMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
}
