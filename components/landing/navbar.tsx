"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`landing-nav fixed top-0 left-0 right-0 z-50 w-full ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] inline-block" />
            <span className="font-headline font-bold text-white text-lg tracking-tight">ContentIntel</span>
          </Link>

          {/* Desktop Nav (center) */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-xs font-medium text-gray-500 hover:text-white transition-colors uppercase tracking-[0.15em]">Features</a>
            <a href="#how-it-works" className="text-xs font-medium text-gray-500 hover:text-white transition-colors uppercase tracking-[0.15em]">How It Works</a>
            <a href="#pricing" className="text-xs font-medium text-gray-500 hover:text-white transition-colors uppercase tracking-[0.15em]">Pricing</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4 relative z-10">
            <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">Sign In</Link>
            <Link href="/onboarding" className="landing-gradient-border-btn text-sm !py-2.5 !px-5">Get Started</Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-white p-1 relative z-10"
            aria-label="Open menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`landing-mobile-menu fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 ${menuOpen ? "open" : ""}`}
        style={{ background: "linear-gradient(180deg, #2D1B69 0%, #0f0a24 50%, #050505 100%)" }}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-6 right-6 text-white"
          aria-label="Close menu"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="22" y2="22" />
            <line x1="22" y1="6" x2="6" y2="22" />
          </svg>
        </button>
        <a href="#features" onClick={() => setMenuOpen(false)} className="text-2xl font-headline font-bold text-white hover:text-[#8B5CF6] transition-colors">Features</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-2xl font-headline font-bold text-white hover:text-[#8B5CF6] transition-colors">How It Works</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-2xl font-headline font-bold text-white hover:text-[#8B5CF6] transition-colors">Pricing</a>
        <div className="mt-4 flex flex-col gap-4 items-center">
          <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors text-lg">Sign In</Link>
          <Link href="/onboarding" onClick={() => setMenuOpen(false)} className="landing-gradient-border-btn text-lg !px-8 !py-3">Get Started</Link>
        </div>
      </div>
    </>
  );
}
