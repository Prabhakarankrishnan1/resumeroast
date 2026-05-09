"use client";

import { useEffect, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TopNav from "../components/TopNav";

const LOADING_MESSAGES = [
  "Extracting your skills...",
  "Comparing against market demand...",
  "Building your skill map...",
  "Calculating your readiness score...",
];

const TARGET_ROLES = [
  "Software Developer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Business Analyst",
  "UX Designer",
  "DevOps Engineer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Cloud Engineer",
  "Project Manager",
  "QA Engineer",
];

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isAllowedFile(file: File) {
  if (file.type === "application/pdf" || file.type === DOCX_MIME) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

interface ExtractedSkill {
  skill: string;
  category: string;
  proficiencyLevel: number;
  yearsOfExperience: number;
  evidenceFromResume: string;
  demand_trend?: string;
}

interface Category {
  name: string;
  skills: string[];
  averageProficiency: number;
  marketImportance: number;
}

interface CriticalGap {
  skill: string;
  importance: string;
  recommendation: string;
  learning_resource_name?: string;
  learning_resource_url?: string;
  learning_resource_type?: string;
  demand_trend?: string;
  dataEnhanced?: boolean;
}

interface SalaryBenchmark {
  experience?: string;
  experience_level?: string;
  city?: string;
  min_salary?: number;
  max_salary?: number;
}

interface SkillData {
  extractedSkills: ExtractedSkill[];
  categories: Category[];
  marketReadinessScore: number;
  topStrengths: string[];
  criticalGaps: CriticalGap[];
  overallSummary: string;
  salaryBenchmarks: SalaryBenchmark[];
}

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  backgroundColor: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "20px",
  boxSizing: "border-box",
};

function scoreColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function proficiencyColor(level: number) {
  if (level <= 3) return "#ef4444";
  if (level <= 6) return "#f59e0b";
  return "#0d9488";
}

function CircularScore({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="70" y="65" textAnchor="middle" fill="#ffffff" fontSize="26" fontWeight="800">
        {score}%
      </text>
      <text x="70" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">
        Readiness
      </text>
    </svg>
  );
}

function ProficiencyBar({ level }: { level: number }) {
  const color = proficiencyColor(level);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "6px", backgroundColor: "#1e293b", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${level * 10}%`, height: "100%", backgroundColor: color, borderRadius: "999px" }} />
      </div>
      <span style={{ fontSize: "12px", color, fontWeight: 700, minWidth: "16px" }}>{level}</span>
    </div>
  );
}

export default function SkillPrint() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      setFileError("Please upload a PDF or DOCX file");
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Please upload a resume under 10MB");
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      setFileError("Please upload a PDF or DOCX file");
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Please upload a resume under 10MB");
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  };

  const canGenerate = !!selectedFile && !!targetRole && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!canGenerate) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile!);
      formData.append("targetRole", targetRole);
      const res = await fetch("/api/skillprint", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong. Please try again.");
      } else {
        setSkillData(data);
      }
    } catch {
      alert("Failed to connect. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async () => {
    const text = `My SkillPrint: I'm ${skillData!.marketReadinessScore}% ready for ${targetRole}! 🎯 Check yours at resumeroast.in/skillprint`;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert(text);
    }
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <>
        <TopNav activePage="skillprint" />
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
            padding: "80px 20px 20px",
          }}
        >
          <style jsx>{`
            @keyframes targetPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.3); }
              100% { transform: scale(1); }
            }
            @keyframes messageFade {
              0% { opacity: 0.1; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0.1; }
            }
            @keyframes progressFill {
              0% { width: 5%; }
              100% { width: 90%; }
            }
          `}</style>

          <div style={{ fontSize: "60px", animation: "targetPulse 1s ease-in-out infinite", marginBottom: "24px" }}>
            🎯
          </div>

          <p
            key={loadingMessageIndex}
            style={{
              color: "#0d9488",
              fontSize: "17px",
              fontWeight: 500,
              minHeight: "28px",
              marginBottom: "20px",
              animation: "messageFade 2.5s ease-in-out",
            }}
          >
            {LOADING_MESSAGES[loadingMessageIndex]}
          </p>

          <div style={{ width: "100%", maxWidth: "300px", height: "6px", backgroundColor: "#1e293b", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                backgroundColor: "#0d9488",
                width: "5%",
                animation: "progressFill 30s linear forwards",
              }}
            />
          </div>

          <p style={{ marginTop: "16px", fontSize: "12px", color: "#4b5563" }}>
            This usually takes 15–30 seconds.
          </p>
        </div>
      </>
    );
  }

  // ── Results dashboard ───────────────────────────────────────────────────────
  if (skillData) {
    const radarData = skillData.categories.map((cat) => ({
      category: cat.name,
      "Your Skills": cat.averageProficiency,
      "Market Demand": cat.marketImportance,
    }));

    const sortedSkills = [...skillData.extractedSkills].sort(
      (a, b) => b.proficiencyLevel - a.proficiencyLevel
    );

    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "80px 20px 48px",
          fontFamily: "Arial, sans-serif",
          gap: "16px",
        }}
      >
        <TopNav activePage="skillprint" />

        <style jsx>{`
          @media (max-width: 640px) {
            .radar-height { height: 280px !important; }
          }
        `}</style>

        {/* Header */}
        <div style={{ width: "100%", maxWidth: "700px", textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, margin: "0 0 4px 0" }}>
            🎯 Your SkillPrint
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            {targetRole} · {skillData.extractedSkills.length} skills detected
          </p>
        </div>

        {/* Market Readiness Score */}
        <div style={CARD_STYLE}>
          <p style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
            Market Readiness Score
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <CircularScore score={skillData.marketReadinessScore} />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  backgroundColor: `${scoreColor(skillData.marketReadinessScore)}22`,
                  color: scoreColor(skillData.marketReadinessScore),
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                {skillData.marketReadinessScore < 40
                  ? "Needs Work"
                  : skillData.marketReadinessScore < 70
                  ? "On Track"
                  : "Strong Match"}
              </div>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {skillData.overallSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div style={CARD_STYLE}>
          <p style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
            Skill Radar
          </p>
          <div className="radar-height" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fill: "#4b5563", fontSize: 10 }}
                  tickCount={6}
                />
                <Radar
                  name="Your Skills"
                  dataKey="Your Skills"
                  stroke="#0d9488"
                  fill="#0d9488"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Market Demand"
                  dataKey="Market Demand"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0}
                />
                <Legend
                  wrapperStyle={{ fontSize: "13px", color: "#94a3b8", paddingTop: "8px" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths + Gaps row */}
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Strengths */}
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderLeft: "3px solid #22c55e",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ margin: "0 0 14px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
              Your Strengths 💪
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {skillData.topStrengths.map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "#22c55e", marginTop: "1px", flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.45 }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critical Gaps */}
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderLeft: "3px solid #ef4444",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ margin: "0 0 14px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
              Critical Gaps 🎯
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {skillData.criticalGaps.map((gap, i) => {
                const resourceTypeBadge = (() => {
                  if (!gap.learning_resource_type) return null;
                  const isFreeCourse = gap.learning_resource_type === "free_course";
                  const isPaidCourse = gap.learning_resource_type === "paid_course";
                  return {
                    label: isFreeCourse ? "Free" : isPaidCourse ? "Paid" : gap.learning_resource_type,
                    color: isFreeCourse ? "#22c55e" : isPaidCourse ? "#f59e0b" : "#94a3b8",
                    bg: isFreeCourse ? "rgba(34,197,94,0.12)" : isPaidCourse ? "rgba(245,158,11,0.12)" : "rgba(148,163,184,0.12)",
                  };
                })();
                return (
                  <div key={i}>
                    <p style={{ margin: "0 0 2px 0", fontWeight: 700, fontSize: "14px", color: "#f1f5f9" }}>
                      {gap.skill}
                    </p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8", lineHeight: 1.4 }}>
                      {gap.importance}
                    </p>
                    <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#0d9488", lineHeight: 1.4 }}>
                      → {gap.recommendation}
                    </p>
                    {gap.learning_resource_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <a
                          href={gap.learning_resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "12px",
                            color: "#0d9488",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          📚 {gap.learning_resource_name ?? "View Resource"}
                        </a>
                        {resourceTypeBadge && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: resourceTypeBadge.color,
                              backgroundColor: resourceTypeBadge.bg,
                              borderRadius: "999px",
                              padding: "2px 8px",
                            }}
                          >
                            {resourceTypeBadge.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Salary Benchmarks */}
        {skillData.salaryBenchmarks?.length > 0 && (
          <div style={CARD_STYLE}>
            <p style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
              Salary Benchmarks 💰
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Experience", "City", "Range"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#64748b",
                          fontWeight: 600,
                          borderBottom: "1px solid #1e293b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skillData.salaryBenchmarks.map((row, i) => {
                    const min = row.min_salary != null ? (row.min_salary / 100000).toFixed(1) : null;
                    const max = row.max_salary != null ? (row.max_salary / 100000).toFixed(1) : null;
                    const range = min && max ? `₹${min} – ₹${max} LPA` : "—";
                    const experience = row.experience ?? row.experience_level ?? "—";
                    return (
                      <tr key={i} style={{ borderBottom: i < skillData.salaryBenchmarks.length - 1 ? "1px solid #0f172a" : "none" }}>
                        <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>{experience}</td>
                        <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>{row.city ?? "—"}</td>
                        <td style={{ padding: "10px 12px", color: "#0d9488", fontWeight: 600 }}>{range}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Skills table */}
        <div style={CARD_STYLE}>
          <p style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
            Detailed Skills
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {sortedSkills.map((skill, i) => {
              const trend = (() => {
                if (skill.demand_trend === "rising") return { symbol: "↑", color: "#22c55e" };
                if (skill.demand_trend === "declining") return { symbol: "↓", color: "#ef4444" };
                if (skill.demand_trend === "stable") return { symbol: "→", color: "#64748b" };
                return null;
              })();
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "8px 16px",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < sortedSkills.length - 1 ? "1px solid #1e293b" : "none",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#f1f5f9" }}>{skill.skill}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "999px",
                          padding: "1px 8px",
                        }}
                      >
                        {skill.category}
                      </span>
                      {skill.yearsOfExperience > 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            backgroundColor: "#1e293b",
                            borderRadius: "999px",
                            padding: "1px 8px",
                          }}
                        >
                          {skill.yearsOfExperience}y
                        </span>
                      )}
                    </div>
                    <ProficiencyBar level={skill.proficiencyLevel} />
                  </div>
                  <div style={{ textAlign: "center", minWidth: "32px" }}>
                    {trend ? (
                      <span style={{ fontSize: "16px", fontWeight: 700, color: trend.color }} title={skill.demand_trend}>
                        {trend.symbol}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#334155" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              minWidth: "200px",
              height: "44px",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid #0d9488",
              backgroundColor: copySuccess ? "#0d9488" : "transparent",
              color: copySuccess ? "#ffffff" : "#0d9488",
              cursor: "pointer",
              transition: "background-color 180ms ease, color 180ms ease",
            }}
          >
            {copySuccess ? "Copied! ✓" : "Share My SkillPrint 📤"}
          </button>

          <button
            onClick={() => {
              setSkillData(null);
              setSelectedFile(null);
              setTargetRole("");
            }}
            style={{
              flex: 1,
              minWidth: "200px",
              height: "44px",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            Analyze Another Resume
          </button>
        </div>
      </div>
    );
  }

  // ── Upload form ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "80px 20px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <TopNav activePage="skillprint" />

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          textAlign: "center",
          marginBottom: "28px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 40px)",
            fontWeight: 800,
            margin: "0 0 10px 0",
            letterSpacing: "-0.5px",
          }}
        >
          🎯 SkillPrint
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "clamp(14px, 3vw, 16px)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Map your skills. Find your gaps. Plan your growth.
        </p>
      </div>

      <div style={CARD_STYLE}>
        {/* File drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("skillprintFileInput")?.click()}
          className="skillprint-drop-card"
          style={{
            border: "1px dashed #334155",
            borderRadius: "10px",
            padding: "24px 14px",
            marginBottom: "16px",
            cursor: "pointer",
            backgroundColor: "#0f172a",
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            textAlign: "center",
          }}
        >
          {selectedFile ? (
            <>
              <p style={{ fontSize: "16px", color: "#e5e7eb", wordBreak: "break-word", margin: "0 0 10px 0" }}>
                📄 {selectedFile.name}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                style={{
                  background: "#1f2937",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "20px", marginBottom: "6px" }}>📄</p>
              <p style={{ fontSize: "15px", color: "#e5e7eb", marginBottom: "4px" }}>
                Drop your resume here
              </p>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>PDF or DOCX, max 10MB</p>
            </>
          )}
          <input
            id="skillprintFileInput"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {fileError && (
          <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 14px 0" }}>{fileError}</p>
        )}

        {/* Target role dropdown */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="targetRole"
            style={{
              display: "block",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Target role
          </label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: "#0f172a",
              color: targetRole ? "#e5e7eb" : "#64748b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0 12px",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
          >
            <option value="" disabled>Select a role...</option>
            {TARGET_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canGenerate}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "15px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            backgroundColor: canGenerate ? "#0d9488" : "#374151",
            color: canGenerate ? "#ffffff" : "#9ca3af",
            cursor: canGenerate ? "pointer" : "not-allowed",
            transition: "background-color 180ms ease",
          }}
        >
          Generate SkillPrint 🎯
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          marginTop: "24px",
          border: "1px dashed #1e293b",
          borderRadius: "12px",
          padding: "48px 24px",
          textAlign: "center",
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Your skill radar chart will appear here after analysis
      </div>

      <style jsx>{`
        .skillprint-drop-card:hover {
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.35),
            0 0 18px rgba(13, 148, 136, 0.15);
        }
      `}</style>
    </div>
  );
}
