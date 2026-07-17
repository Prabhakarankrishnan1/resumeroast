import { Component } from "react";
import Link from "next/link";

const CARD: React.CSSProperties = {
  backgroundColor: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "16px",
  width: "100%",
  maxWidth: "700px",
  boxSizing: "border-box",
};

const H2: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "20px",
  fontWeight: 700,
  color: "#ffffff",
};

const BODY: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontSize: "15px",
  color: "#cbd5e1",
  lineHeight: 1.75,
};

const SECONDARY: React.CSSProperties = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: 1.6,
  margin: 0,
};

function IconGauge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12 17 7" /><circle cx="12" cy="12" r="1" fill="#0d9488" stroke="none" />
    </svg>
  );
}
function IconRadar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><path d="M9.5 10.5A2.5 2.5 0 0 1 12 8h0a2.5 2.5 0 0 1 0 5h0a2.5 2.5 0 0 1 0 5h0a2.5 2.5 0 0 1-2.5-2.5" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconTrend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: IconGauge,
    title: "Market Readiness Score",
    desc: "A single number from 0 to 100 representing how closely your current skill profile matches typical requirements for your target role.",
  },
  {
    Icon: IconRadar,
    title: "Skills vs demand chart",
    desc: "A visual breakdown of your proficiency in each skill category plotted against market importance, showing where you are strong and where demand exceeds your current level.",
  },
  {
    Icon: IconCoin,
    title: "Salary benchmarks",
    desc: "Estimated annual salary ranges for your target role and location, segmented by experience level and based on 2026 market data.",
  },
  {
    Icon: IconBook,
    title: "Learning roadmap",
    desc: "Prioritized skill gaps with specific course or resource recommendations and realistic time estimates to reach working proficiency in each area.",
  },
  {
    Icon: IconTrend,
    title: "Progress tracking",
    desc: "Scan again after completing courses or projects to track your Market Readiness Score over time and measure how your preparation is progressing.",
  },
];

const FAQS = [
  {
    q: "Is SkillPrint free?",
    a: "Yes. All features — the Market Readiness Score, skill breakdown, salary estimates, learning roadmap, and progress tracking — are available at no cost. No login or account is required.",
  },
  {
    q: "How accurate are the salary benchmarks?",
    a: "Salary ranges are AI-estimated based on patterns in 2026 market data and are clearly labeled as estimates. They are useful for orientation and comparison, but for precise figures in your specific market, refer to local job boards and industry compensation surveys.",
  },
  {
    q: "Which roles are supported?",
    a: "SkillPrint analyzes any role you enter. The analysis is most precise for roles with well-defined skill sets — software engineering, data science, product management, marketing, and design. For less structured roles, the output is still useful but should be interpreted with more flexibility.",
  },
  {
    q: "How is this different from ResumeRoast?",
    a: "ResumeRoast reviews your resume as a document, scoring sections and checking ATS formatting. SkillPrint analyzes you as a candidate by mapping your skills against market demand for a specific role. ResumeRoast answers whether your resume is well written. SkillPrint answers whether you are qualified for the role you want.",
  },
  {
    q: "Can I track progress over time?",
    a: "Yes. Each scan is saved in your browser's local storage. If you scan for the same role more than once, SkillPrint displays a progress chart showing how your Market Readiness Score has changed — giving you a concrete measure of improvement over time.",
  },
];

function Content() {
  return (
    <section
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
        gap: "0px",
      }}
      aria-label="About SkillPrint"
    >
      {/* Section 1 — How it works */}
      <div style={CARD}>
        <h2 style={H2}>How SkillPrint works</h2>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            {
              n: "1",
              title: "Upload your resume and choose a role",
              desc: "Add your PDF or Word document, enter the job title you are targeting, and optionally add your city for localized salary estimates.",
            },
            {
              n: "2",
              title: "AI analyzes market demand",
              desc: "The tool reads your resume and compares your skills against typical requirements for your target role based on current job market patterns.",
            },
            {
              n: "3",
              title: "Get your readiness score and roadmap",
              desc: "Receive a Market Readiness Score, a ranked list of skill gaps, estimated learning timelines, and salary benchmarks — all in under a minute.",
            },
          ].map(({ n, title, desc }) => (
            <li key={n} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span
                style={{
                  minWidth: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#0d9488",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                {n}
              </span>
              <div>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "15px", color: "#e2e8f0" }}>{title}</p>
                <p style={SECONDARY}>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Section 2 — Why skill gap analysis matters */}
      <div style={CARD}>
        <h2 style={H2}>Why skill gap analysis matters</h2>
        <p style={BODY}>
          Most job seekers underestimate the distance between their current skills and what the market expects for a
          given role. A structured{" "}
          <strong style={{ color: "#e2e8f0" }}>career skill assessment</strong> makes that gap explicit, showing
          exactly which skills to prioritize rather than guessing or relying on generic advice.
        </p>
        <p style={BODY}>
          Job listings change faster than most professionals can track. A{" "}
          <strong style={{ color: "#e2e8f0" }}>market readiness score</strong> tool compares your profile against
          patterns in current demand — not outdated expectations — giving you a more accurate picture of where you
          stand today rather than where you would have stood two years ago.
        </p>
        <p style={BODY}>
          Investing time in the wrong skills wastes months of preparation.{" "}
          <strong style={{ color: "#e2e8f0" }}>Resume skill analysis</strong> identifies which gaps carry the most
          weight — the skills that appear most frequently in job postings and matter most in technical interviews —
          so your preparation time is focused where it has the highest return.
        </p>
        <p style={{ ...BODY, marginBottom: 0 }}>
          <strong style={{ color: "#e2e8f0" }}>Skill gap analysis</strong> is most valuable as a repeated process.
          Scanning once establishes a baseline. Scanning again after completing a course or a project shows concrete
          progress, turning career development from a vague effort into something measurable.
        </p>
      </div>

      {/* Section 3 — What you get */}
      <div style={CARD}>
        <h2 style={H2}>What you get in your SkillPrint</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "18px" }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <li key={title} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{ marginTop: "2px", flexShrink: 0 }}>
                <Icon />
              </span>
              <div>
                <p style={{ margin: "0 0 3px 0", fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>{title}</p>
                <p style={SECONDARY}>{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4 — FAQ */}
      <div style={CARD}>
        <h2 style={H2}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              style={{
                borderBottom: "1px solid #1e293b",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#e2e8f0",
                  listStyle: "none",
                  paddingRight: "8px",
                  lineHeight: 1.5,
                }}
              >
                {q}
              </summary>
              <p style={{ margin: "10px 0 0 0", fontSize: "14px", color: "#94a3b8", lineHeight: 1.75 }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Section 5 — ResumeRoast cross-promo */}
      <div
        style={{
          ...CARD,
          borderLeft: "3px solid #0d9488",
          marginBottom: "0",
        }}
      >
        <h2 style={{ ...H2, marginBottom: "10px" }}>Try ResumeRoast</h2>
        <p style={{ ...BODY, marginBottom: "16px" }}>
          ResumeRoast reviews your resume as a document — giving section-by-section scores, an ATS compatibility
          check, and specific rewrite suggestions. It pairs well with SkillPrint: use SkillPrint to identify your
          skill gaps, then use ResumeRoast to make sure the skills you already have are presented clearly and in a
          format that passes automated screening.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            border: "1px solid #0d9488",
            color: "#0d9488",
            fontSize: "14px",
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Get your resume reviewed — free
        </Link>
      </div>
    </section>
  );
}

class Boundary extends Component<{ children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? null : this.props.children;
  }
}

export default function SkillPrintContent() {
  return (
    <Boundary>
      <Content />
    </Boundary>
  );
}
