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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";
import TopNav from "../components/TopNav";
import KitOffer, { KitOfferTeaser } from "../components/KitOffer";

const LOADING_MESSAGES = [
  "Extracting your skills...",
  "Comparing against market demand...",
  "Building your skill map...",
  "Calculating your readiness score...",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Singapore",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Germany",
  "Pakistan",
  "Iran",
  "Jordan",
  "Philippines",
  "Other (please specify below)",
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

interface HistoryEntry {
  date: string;
  targetRole: string;
  marketReadinessScore: number;
  summary: string;
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
  estimatedLearningTime?: string;
  priority?: number;
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

interface SalaryEstimateRange {
  experience: string;
  low: number;
  high: number;
}

interface SalaryEstimate {
  country: string;
  city?: string;
  currency: string;
  experienceRanges: SalaryEstimateRange[];
  note?: string;
}

interface SkillData {
  extractedSkills: ExtractedSkill[];
  categories: Category[];
  marketReadinessScore: number;
  topStrengths: string[];
  criticalGaps: CriticalGap[];
  overallSummary: string;
  estimatedTimeToTarget?: string;
  salaryBenchmarks: SalaryBenchmark[];
  salaryEstimate?: SalaryEstimate | null;
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

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

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
  const [targetCountry, setTargetCountry] = useState("India");
  const [targetCity, setTargetCity] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [roadmapCopySuccess, setRoadmapCopySuccess] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("skillprint-history") ?? "[]");
      if (Array.isArray(stored)) setHistory(stored);
    } catch {
      // localStorage unavailable
    }
  }, []);

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

  const canGenerate = !!selectedFile && !!targetRole && !!targetCountry && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!canGenerate) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile!);
      formData.append("targetRole", targetRole);
      formData.append("targetCountry", targetCountry);
      if (targetCity.trim()) formData.append("targetCity", targetCity.trim());
      const res = await fetch("/api/skillprint", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong. Please try again.");
      } else {
        setSkillData(data);
        try {
          const entry = {
            date: new Date().toISOString(),
            targetRole,
            marketReadinessScore: data.marketReadinessScore,
            summary: data.overallSummary ?? "",
          };
          const existing: typeof entry[] = JSON.parse(
            localStorage.getItem("skillprint-history") ?? "[]"
          );
          const updated = [entry, ...existing].slice(0, 12);
          localStorage.setItem("skillprint-history", JSON.stringify(updated));
          localStorage.setItem("skillprint-latest", JSON.stringify(entry));
          setHistory(updated);
        } catch {
          // localStorage unavailable — silently skip
        }
      }
    } catch {
      alert("Failed to connect. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = (helpful: boolean) => {
    const entry = {
      date: new Date().toISOString(),
      role: targetRole,
      score: skillData?.marketReadinessScore ?? null,
      helpful,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("skillprint-feedback") ?? "[]");
      localStorage.setItem("skillprint-feedback", JSON.stringify([...existing, entry]));
    } catch {
      // localStorage unavailable — silently skip
    }
    setFeedbackGiven(helpful ? "yes" : "no");
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
        <div style={{ width: "100%", maxWidth: "700px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, margin: "0 0 4px 0" }}>
            🎯 Your SkillPrint
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            {targetRole} · {skillData.extractedSkills.length} skills detected
          </p>
        </div>

        {/* Progress chart — only if 2+ entries for the same role */}
        {(() => {
          const roleHistory = history.filter((h) => h.targetRole === targetRole);
          if (roleHistory.length < 2) return null;

          const chartData = [...roleHistory].reverse().map((h) => ({
            date: formatShortDate(h.date),
            score: h.marketReadinessScore,
          }));
          const oldest = roleHistory[roleHistory.length - 1];
          const latest = roleHistory[0];
          const delta = latest.marketReadinessScore - oldest.marketReadinessScore;
          const deltaStr = `${delta >= 0 ? "+" : ""}${delta}%`;

          return (
            <div style={CARD_STYLE}>
              <p style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                Your Progress for {targetRole} 📈
              </p>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#0d9488" }}
                      formatter={(v) => [`${v}%`, "Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#f59e0b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ margin: "14px 0 4px 0", fontSize: "13px", color: "#0d9488", lineHeight: 1.5 }}>
                You were <strong>{oldest.marketReadinessScore}%</strong> ready for {targetRole} in {formatShortDate(oldest.date)}. Now you&apos;re <strong>{latest.marketReadinessScore}%</strong>. That&apos;s <strong>{deltaStr}</strong> growth in {targetRole} readiness!
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#4b5563" }}>
                💡 Scan your resume monthly to track progress
              </p>
            </div>
          );
        })()}

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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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

        {/* Learning Roadmap */}
        {skillData.criticalGaps.length > 0 && (() => {
          const sortedGaps = [...skillData.criticalGaps].sort(
            (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
          );

          const handleCopyRoadmap = async () => {
            const lines = [
              `My Learning Roadmap for ${targetRole}:`,
              "",
              ...sortedGaps.map((gap, i) => {
                const time = gap.estimatedLearningTime ? ` (~${gap.estimatedLearningTime})` : "";
                return `${i + 1}. ${gap.skill}${time}\n   → ${gap.recommendation}`;
              }),
              "",
              skillData.estimatedTimeToTarget
                ? `Estimated time to reach 85% readiness: ${skillData.estimatedTimeToTarget}`
                : "",
              "Generated by SkillPrint at resumeroast.in/skillprint",
            ].filter((l) => l !== undefined).join("\n");

            try {
              await navigator.clipboard.writeText(lines);
              setRoadmapCopySuccess(true);
              setTimeout(() => setRoadmapCopySuccess(false), 2000);
            } catch {
              alert(lines);
            }
          };

          return (
            <div style={CARD_STYLE}>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                  Your Learning Roadmap 🗺️
                </p>
                {skillData.estimatedTimeToTarget && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#0d9488" }}>
                    Estimated time to reach 85% readiness: <strong>{skillData.estimatedTimeToTarget}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {sortedGaps.map((gap, i) => {
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
                    <div key={i} style={{ display: "flex", gap: "16px" }}>
                      {/* Circle + connector */}
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#0d9488",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "13px" }}>
                            {gap.priority ?? i + 1}
                          </span>
                        </div>
                        {i < sortedGaps.length - 1 && (
                          <div style={{ width: "2px", flex: 1, minHeight: "20px", backgroundColor: "#0d9488", margin: "4px 0" }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: i < sortedGaps.length - 1 ? "20px" : "0" }}>
                        <p style={{ margin: "4px 0 2px 0", fontWeight: 700, fontSize: "14px", color: "#f1f5f9" }}>
                          {gap.skill}
                        </p>
                        <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#94a3b8", lineHeight: 1.4 }}>
                          {gap.importance}
                        </p>
                        <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#0d9488", lineHeight: 1.4 }}>
                          → {gap.recommendation}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {gap.learning_resource_url && (
                            <>
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
                            </>
                          )}
                          {gap.estimatedLearningTime && (
                            <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: 600 }}>
                              ⏱ {gap.estimatedLearningTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleCopyRoadmap}
                style={{
                  marginTop: "20px",
                  height: "38px",
                  padding: "0 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "1px solid #0d9488",
                  backgroundColor: roadmapCopySuccess ? "#0d9488" : "transparent",
                  color: roadmapCopySuccess ? "#ffffff" : "#0d9488",
                  cursor: "pointer",
                  transition: "background-color 180ms ease, color 180ms ease",
                }}
              >
                {roadmapCopySuccess ? "Copied! ✓" : "📋 Copy Roadmap"}
              </button>
            </div>
          );
        })()}

        <KitOfferTeaser />

        {/* Salary Benchmarks / Estimate */}
        {(() => {
          const CURRENCY_SYMBOL: Record<string, string> = {
            INR: "₹", USD: "$", GBP: "£", EUR: "€",
            SGD: "S$", CAD: "C$", AUD: "A$", AED: "AED ",
            PKR: "PKR ", IRR: "IRR ", JOD: "JD ", PHP: "₱",
          };

          const hasBenchmarks = (skillData.salaryBenchmarks?.length ?? 0) > 0;
          const est = skillData.salaryEstimate;
          const hasEstimate = !!est && (est.experienceRanges?.length ?? 0) > 0;

          if (!hasBenchmarks && !hasEstimate) return null;

          if (hasBenchmarks) {
            return (
              <div style={CARD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                    Salary Benchmarks 💰
                  </p>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "999px", padding: "2px 8px" }}>
                    ✓ Verified market data
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        {["Experience", "City", "Range"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>
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
            );
          }

          // AI estimate path
          const sym = CURRENCY_SYMBOL[est!.currency] ?? `${est!.currency} `;
          const location = est!.city ? `${est!.city}, ${est!.country}` : est!.country;
          const fmtNum = (n: number) => n.toLocaleString("en");

          return (
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                  Salary Estimate for {location} 💰
                </p>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.12)", borderRadius: "999px", padding: "2px 8px" }}>
                  ⚠️ AI estimate — verify with local market data
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Experience", "Range"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {est!.experienceRanges.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < est!.experienceRanges.length - 1 ? "1px solid #0f172a" : "none" }}>
                        <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>{row.experience}</td>
                        <td style={{ padding: "10px 12px", color: "#0d9488", fontWeight: 600 }}>
                          {sym}{fmtNum(row.low)} – {sym}{fmtNum(row.high)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {est!.note && (
                <p style={{ margin: "12px 0 0 0", fontSize: "11px", color: "#4b5563", lineHeight: 1.5 }}>
                  {est!.note}
                </p>
              )}
            </div>
          );
        })()}

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
            onClick={() => setShowShareCard(true)}
            style={{
              flex: 1,
              minWidth: "200px",
              height: "44px",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid #0d9488",
              backgroundColor: "transparent",
              color: "#0d9488",
              cursor: "pointer",
              transition: "background-color 180ms ease, color 180ms ease",
            }}
          >
            Share My SkillPrint 📤
          </button>

          <button
            onClick={() => {
              setSkillData(null);
              setSelectedFile(null);
              setTargetRole("");
              setTargetCountry("India");
              setTargetCity("");
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
        {/* Feedback */}
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            paddingTop: "4px",
          }}
        >
          {feedbackGiven ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#0d9488" }}>
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Was this analysis helpful?
              </span>
              <button
                onClick={() => handleFeedback(true)}
                style={{
                  background: "none",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "5px 14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#cbd5e1",
                }}
              >
                👍 Yes
              </button>
              <button
                onClick={() => handleFeedback(false)}
                style={{
                  background: "none",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "5px 14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#cbd5e1",
                }}
              >
                👎 No
              </button>
            </>
          )}
        </div>

        {/* Cross-promotion */}
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            backgroundColor: "#111827",
            border: "1px solid #1e293b",
            borderLeft: "3px solid #0d9488",
            borderRadius: "12px",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: "16px", color: "#ffffff" }}>
            Need to update your resume with these skills? 📝
          </p>
          <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
            Get a brutally honest review of your resume with section scores, ATS check, and AI rewrite suggestions.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              backgroundColor: "#0d9488",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Get Your Resume Reviewed →
          </Link>
        </div>

        {/* Kit upsell */}
        <div style={{ width: "100%", maxWidth: "700px", boxSizing: "border-box" }}>
          <KitOffer />
        </div>

        {/* First-scan tracking nudge — only for this role */}
        {history.filter((h) => h.targetRole === targetRole).length === 1 && (
          <p style={{ margin: 0, fontSize: "12px", color: "#4b5563", textAlign: "center" }}>
            📈 Scan again next month to start tracking your progress for {targetRole}
          </p>
        )}

        {/* Share Card Modal */}
        {showShareCard && (
          <div
            onClick={() => setShowShareCard(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(400px, 90vw)",
                background: "linear-gradient(160deg, #0a1628 0%, #0a0a0a 100%)",
                border: "1px solid #0d9488",
                borderRadius: "16px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Brand */}
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0d9488", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                🎯 SkillPrint
              </p>

              {/* Score */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "60px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                    {skillData.marketReadinessScore}
                  </span>
                  <span style={{ fontSize: "22px", fontWeight: 700, color: "#64748b" }}>% READY</span>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: "18px", color: "#94a3b8" }}>
                  for {targetRole} roles
                </p>
              </div>

              {/* Strengths */}
              <div>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                  Top Strengths 💪
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {skillData.topStrengths.slice(0, 3).map((s, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                      <span style={{ color: "#22c55e", flexShrink: 0, marginTop: "1px" }}>✓</span>
                      <span style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.4 }}>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Biggest gap */}
              {skillData.criticalGaps[0] && (
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                    Biggest Gap 🎯
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                    {skillData.criticalGaps[0].skill}
                  </p>
                </div>
              )}

              {/* CTA */}
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Get yours at{" "}
                <span style={{ color: "#0d9488", fontWeight: 700 }}>resumeroast.in/skillprint</span>
              </p>
            </div>

            {/* Modal action buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={handleShare}
                style={{
                  height: "40px",
                  padding: "0 20px",
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
                {copySuccess ? "Copied! ✓" : "📋 Copy as Text"}
              </button>
              <button
                onClick={() => setShowShareCard(false)}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
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

        {/* Country + City row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label
              htmlFor="targetCountry"
              style={{ display: "block", color: "#cbd5e1", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}
            >
              Country
            </label>
            <select
              id="targetCountry"
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
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
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="targetCity"
              style={{ display: "block", color: "#cbd5e1", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}
            >
              City <span style={{ color: "#4b5563", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="targetCity"
              type="text"
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              placeholder="e.g., Karachi, Tehran, Amman"
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
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
