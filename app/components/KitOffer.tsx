"use client";

import React, { Component, useState, useEffect } from "react";

const KIT_URL = "https://booksmith530.gumroad.com/l/job-search-ai-kit/ROAST50";
const DISMISS_KEY = "kitOfferDismissed_v1";

function fireGtag(eventName: string) {
  try {
    (window as any).gtag?.("event", eventName);
  } catch {
    // GA not available
  }
}

function useDismissed() {
  const [dismissed, setDismissed] = useState(true); // true until localStorage checked
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isDismissed = false;
    try {
      isDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      isDismissed = false;
    }
    setDismissed(isDismissed);
  }, []);

  return { dismissed, setDismissed, mounted };
}

function KitOfferCard() {
  const { dismissed, setDismissed, mounted } = useDismissed();

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // session-only dismiss if storage unavailable
    }
    fireGtag("kit_offer_dismiss");
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      id="kit-offer"
      className="w-full relative rounded-xl p-5 bg-[#111827] border border-slate-800 border-l-[3px] border-l-teal-600"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss offer"
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          fontSize: "18px",
          lineHeight: 1,
          padding: "4px 6px",
        }}
      >
        ×
      </button>
      <p
        style={{
          margin: "0 0 8px 0",
          fontWeight: 700,
          fontSize: "15px",
          color: "#ffffff",
          paddingRight: "28px",
        }}
      >
        You've seen the gaps. Here's the fix-it kit.
      </p>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
        }}
      >
        We packed everything we know about landing interviews into one kit — 40+
        prompts to rewrite your resume, decode the ATS, rehearse interviews, and
        negotiate your offer.
      </p>
      <a
        href={KIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => fireGtag("kit_offer_click")}
        style={{
          display: "inline-block",
          backgroundColor: "#1e293b",
          color: "#e2e8f0",
          fontSize: "13px",
          fontWeight: 700,
          padding: "10px 18px",
          borderRadius: "8px",
          textDecoration: "none",
          border: "1px solid #334155",
          outline: "none",
        }}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Get the kit — $9.50 · 50% off applied →
      </a>
    </div>
  );
}

function KitOfferTeaserInner() {
  const { dismissed, mounted } = useDismissed();

  if (!mounted || dismissed) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    fireGtag("kit_offer_teaser_click");
    document.getElementById("kit-offer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <p style={{ margin: "16px 0", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
      <a
        href="#kit-offer"
        onClick={handleClick}
        className="no-underline hover:underline text-slate-400 hover:text-teal-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Want a shortcut to fix these? See the Job Search AI Kit ↓
      </a>
    </p>
  );
}

class KitOfferBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function KitOffer() {
  return (
    <KitOfferBoundary>
      <KitOfferCard />
    </KitOfferBoundary>
  );
}

export function KitOfferTeaser() {
  return (
    <KitOfferBoundary>
      <KitOfferTeaserInner />
    </KitOfferBoundary>
  );
}
