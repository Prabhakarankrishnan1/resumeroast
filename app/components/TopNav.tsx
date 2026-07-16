"use client";

import Link from "next/link";

type ActivePage = "resume-review" | "skillprint";

export default function TopNav({ activePage }: { activePage: ActivePage }) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid #1a1a1a",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "18px",
            }}
          >
            🔥 ResumeRoast
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/"
              className={activePage === "resume-review" ? "top-nav-active" : "top-nav-inactive"}
              style={{
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "16px",
                padding: "8px 16px",
                borderRadius: "9999px",
                ...(activePage === "resume-review"
                  ? { backgroundColor: "#0d9488", color: "#ffffff" }
                  : { color: "#94a3b8" }),
              }}
            >
              Resume Review
            </Link>

            <Link
              href="/skillprint"
              className={activePage === "skillprint" ? "top-nav-active" : "top-nav-inactive"}
              style={{
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "16px",
                padding: "8px 16px",
                borderRadius: "9999px",
                ...(activePage === "skillprint"
                  ? { backgroundColor: "#0d9488", color: "#ffffff" }
                  : { color: "#94a3b8" }),
              }}
            >
              SkillPrint
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .top-nav-inactive:hover {
          color: #e2e8f0 !important;
        }
        @media (max-width: 640px) {
          .top-nav-active,
          .top-nav-inactive {
            font-size: 14px !important;
            padding: 6px 12px !important;
          }
        }
      `}</style>
    </>
  );
}
