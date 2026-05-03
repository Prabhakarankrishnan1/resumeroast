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

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Link
              href="/"
              className="top-nav-link"
              style={{
                color: activePage === "resume-review" ? "#ffffff" : "#94a3b8",
                textDecoration: "none",
                paddingBottom: "4px",
                borderBottom:
                  activePage === "resume-review" ? "2px solid #ff6b35" : "none",
                fontWeight: activePage === "resume-review" ? 600 : 500,
                fontSize: "14px",
              }}
            >
              Resume Review
            </Link>

            <Link
              href="/skillprint"
              className="top-nav-link"
              style={{
                color: activePage === "skillprint" ? "#ffffff" : "#94a3b8",
                textDecoration: "none",
                paddingBottom: "4px",
                borderBottom:
                  activePage === "skillprint" ? "2px solid #0d9488" : "none",
                fontWeight: activePage === "skillprint" ? 600 : 500,
                fontSize: "14px",
              }}
            >
              SkillPrint
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .top-nav-link {
            font-size: 13px !important;
          }
        }
      `}</style>
    </>
  );
}
