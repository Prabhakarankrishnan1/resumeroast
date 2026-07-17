import { Component } from "react";
import Link from "next/link";

const CARD: React.CSSProperties = {
  backgroundColor: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "16px",
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

// Minimal inline SVGs — stroke-based, 20×20, teal accent
function IconBars() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: IconBars,
    title: "Section-by-section scores",
    desc: "Each part of your resume — Experience, Skills, Education, Summary — receives an individual score with specific feedback on what to change.",
  },
  {
    Icon: IconShield,
    title: "ATS compatibility check",
    desc: "Identifies formatting problems, missing keywords, and structural issues that cause automated systems to reject resumes before a human ever reads them.",
  },
  {
    Icon: IconTag,
    title: "Suggested keywords for your target role",
    desc: "Highlights terms that commonly appear in job descriptions for your field so your resume matches what recruiters and ATS systems are scanning for.",
  },
  {
    Icon: IconDownload,
    title: "AI-improved resume as DOCX download",
    desc: "Download a revised version of your resume content with AI-generated improvements applied, ready to paste into your original formatted document.",
  },
  {
    Icon: IconMessage,
    title: "Elevator pitch generator",
    desc: "Produces a concise two-sentence professional summary tailored to your experience, useful for cover letters, LinkedIn, and interviews.",
  },
];

const FAQS = [
  {
    q: "Is ResumeRoast really free?",
    a: "Yes. The complete review — section scores, ATS check, keyword suggestions, and elevator pitch — is free with no login, no credit card, and no session limit. An optional paid kit with additional AI job search prompts is available but is not required to use the tool.",
  },
  {
    q: "Is my resume stored or shared?",
    a: "Your resume is not stored on any server. It is sent to the AI model, processed in real time to generate your feedback, and then discarded. We do not retain resume content, email addresses, or any identifying information.",
  },
  {
    q: "Which reviewer style should I pick?",
    a: "If you are unsure where to start, the Kind Coach gives constructive feedback without being harsh. If you want to know exactly where you stand against a hiring bar, the Strict Hiring Manager is more informative. The Brutal Friend is direct and useful if you want unfiltered commentary on every section.",
  },
  {
    q: "How is this different from paid resume services?",
    a: "Paid services typically involve a human reviewer who reads your resume and writes narrative feedback over several days. This tool uses AI to generate structured, scored feedback in under 30 seconds. The two approaches are complementary — AI review is faster and consistent, while human review adds personal judgment and context.",
  },
  {
    q: "Does this work for non-tech roles?",
    a: "Yes. The review applies the same structural and content criteria — clarity, achievement language, keyword density, ATS-compatible formatting — regardless of industry or role type. It is not specific to engineering or tech.",
  },
];

function Content() {
  return (
    <section
      style={{ width: "100%", maxWidth: "780px", margin: "0 auto", paddingTop: "40px" }}
      aria-label="About ResumeRoast"
    >
      {/* Section 1 — How it works */}
      <div style={CARD}>
        <h2 style={H2}>How ResumeRoast works</h2>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            {
              n: "1",
              title: "Upload your resume",
              desc: "Add your PDF or Word document. The tool reads your full resume content in seconds — no account or sign-in required.",
            },
            {
              n: "2",
              title: "Pick your reviewer style",
              desc: "Choose from three voices: a supportive career coach, a strict hiring manager, or a direct and honest friend. Each gives the same structured output with a different tone.",
            },
            {
              n: "3",
              title: "Get honest feedback in 30 seconds",
              desc: "Receive section scores, ATS compatibility details, keyword suggestions, and specific rewrite recommendations for every part of your resume.",
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

      {/* Section 2 — Why AI review matters */}
      <div style={CARD}>
        <h2 style={H2}>Why AI resume review matters</h2>
        <p style={BODY}>
          Most job applications are filtered by applicant tracking systems before a human ever reads them. An{" "}
          <strong style={{ color: "#e2e8f0" }}>ATS resume checker</strong> looks at formatting, keyword density, and
          section structure — factors that can eliminate a resume automatically regardless of the candidate&apos;s actual
          qualifications. Addressing these issues before submitting is one of the most practical things a job seeker can do.
        </p>
        <p style={BODY}>
          Human feedback on resumes is valuable but inconsistent. Reviewers prioritize different things depending on
          their background, and professional services can cost hundreds of dollars per session.{" "}
          <strong style={{ color: "#e2e8f0" }}>Free AI resume review</strong> gives you structured, repeatable feedback
          based on the same criteria every time — without the wait or the cost.
        </p>
        <p style={BODY}>
          Getting resume feedback used to mean waiting days for a response. An{" "}
          <strong style={{ color: "#e2e8f0" }}>AI resume checker</strong> delivers a complete analysis in under 30
          seconds, making it practical to iterate and adjust your resume before each application rather than submitting
          the same document every time.
        </p>
        <p style={{ ...BODY, marginBottom: 0 }}>
          Career coaches charge between $150 and $500 for a single review session. Tools that let you{" "}
          <strong style={{ color: "#e2e8f0" }}>rate my resume free</strong> remove that barrier, making quality{" "}
          <strong style={{ color: "#e2e8f0" }}>resume feedback</strong> accessible to anyone regardless of budget or
          career stage.
        </p>
      </div>

      {/* Section 3 — What you get */}
      <div style={CARD}>
        <h2 style={H2}>What you get in your review</h2>
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
              <p
                style={{
                  margin: "10px 0 0 0",
                  fontSize: "14px",
                  color: "#94a3b8",
                  lineHeight: 1.75,
                }}
              >
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Section 5 — SkillPrint cross-promo */}
      <div
        style={{
          ...CARD,
          borderLeft: "3px solid #0d9488",
          marginBottom: "0",
        }}
      >
        <h2 style={{ ...H2, marginBottom: "10px" }}>Explore SkillPrint</h2>
        <p style={{ ...BODY, marginBottom: "16px" }}>
          SkillPrint is a companion tool that maps your existing skills against real market demand for a target role.
          Upload your resume, enter the job title you are pursuing, and receive a Market Readiness Score, a ranked list
          of skill gaps with learning resources, estimated salary ranges for your location, and a roadmap for closing
          the gaps that matter most.
        </p>
        <Link
          href="/skillprint"
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
          Try SkillPrint — free
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

export default function LandingContent() {
  return (
    <Boundary>
      <Content />
    </Boundary>
  );
}
