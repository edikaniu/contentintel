"use client";

import { useEffect } from "react";

export function ScrollObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".landing-scale-reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
