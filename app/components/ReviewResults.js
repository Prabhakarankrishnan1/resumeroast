"use client";

import { useEffect, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

/**
 * @typedef {Object} ReviewSection
 * @property {string} name
 * @property {number} score
 * @property {string} feedback
 * @property {string | undefined} [rewrite]
 */

/**
 * @typedef {Object} ReviewResultsData
 * @property {number} overallScore
 * @property {number | undefined} [atsScore]
 * @property {string[] | undefined} [atsIssues]
 * @property {string[] | undefined} [atsKeywords]
 * @property {string} summary
 * @property {ReviewSection[]} sections
 * @property {[string, string, string]} topThreeImprovements
 * @property {string} elevatorPitch
 */

/**
 * @param {{ results: ReviewResultsData, isFixing?: boolean, onFixResume?: () => void | Promise<void>, fixedResume?: string | null }} props
 */
export default function ReviewResults({
  results,
  isFixing = false,
  onFixResume,
  fixedResume = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [showFullFixedResume, setShowFullFixedResume] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overallScore = results?.overallScore ?? 0;
  const hasAtsScore = Number.isFinite(results?.atsScore);
  const atsScore = hasAtsScore ? results.atsScore : 0;
  const atsIssues = Array.isArray(results?.atsIssues) ? results.atsIssues : [];
  const atsKeywords = Array.isArray(results?.atsKeywords) ? results.atsKeywords : [];

  const getScoreColor = (score) => {
    if (score <= 4) return "#ef4444"; // red
    if (score <= 6) return "#eab308"; // yellow
    return "#22c55e"; // green
  };

  const scoreColor = getScoreColor(overallScore);

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (e) {
      // silent fail – no-op if copy not available
    }
  };

  const handleShareScore = () => {
    const shareText = `I scored ${overallScore}/10 on ResumeRoast! 🔥 Try it at [URL]`;
    copyToClipboard(shareText);
  };

  const handleCopyElevatorPitch = () => {
    if (results?.elevatorPitch) {
      copyToClipboard(results.elevatorPitch);
    }
  };

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleSubscribe = () => {
    if (typeof window === "undefined") return;
    window.open(
      "mailto:resumeroast.in@gmail.com?subject=Subscribe to ResumeRoast&body=Please add me to the mailing list. My email: " +
        subscriberEmail
    );
    setSubscribeSuccess(true);
    setSubscriberEmail("");
  };

  const isAllCapsHeadingLine = (line) => {
    const trimmed = (line ?? "").trim();
    if (!trimmed) return false;
    if (trimmed !== trimmed.toUpperCase()) return false;
    return /^[A-Z][A-Z\s&/.,'’()-]*$/.test(trimmed);
  };

  const stripMarkdownBoldMarkers = (text) => (text ?? "").replace(/\*\*/g, "");

  const isWrappedInMarkdownBold = (line) => {
    const trimmed = (line ?? "").trim();
    return /^\*\*[^*]+?\*\*$/.test(trimmed);
  };

  /**
   * Splits a line into TextRuns, making **bold** segments bold.
   * Also strips all "**" markers from output text.
   * @param {string} line
   * @param {{ size?: number, color?: string, boldAll?: boolean }} [opts]
   */
  const markdownLineToRuns = (line, opts = {}) => {
    const { size, color, boldAll = false } = opts;
    const raw = (line ?? "").toString();

    // Split by **...** while keeping the markers content.
    const parts = raw.split(/\*\*(.+?)\*\*/g);
    const runs = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? "";
      if (!part) continue;

      const isBoldSegment = i % 2 === 1;
      runs.push(
        new TextRun({
          text: stripMarkdownBoldMarkers(part),
          bold: boldAll || isBoldSegment,
          size,
          color,
        })
      );
    }

    // If the line had no visible content after parsing, return a single empty run.
    if (runs.length === 0) {
      runs.push(
        new TextRun({
          text: "",
          bold: boldAll,
          size,
          color,
        })
      );
    }

    return runs;
  };

  const handleDownloadImprovedResume = async () => {
    if (!fixedResume) return;

    const lines = fixedResume.split(/\r?\n/);
    const paragraphs = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: "" })],
          })
        );
        continue;
      }

      const isHeading =
        isAllCapsHeadingLine(line) || isWrappedInMarkdownBold(line);

      if (isHeading) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: markdownLineToRuns(trimmed, {
              boldAll: true,
              size: 28, // 14pt
              color: "1A365D",
            }),
          })
        );
        continue;
      }

      const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ");
      if (isBullet) {
        const bulletText = trimmed.replace(/^(?:•|-)\s+/, "");
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            indent: { left: 720 },
            children: markdownLineToRuns(bulletText, { size: 22 }), // 11pt
          })
        );
        continue;
      }

      paragraphs.push(
        new Paragraph({
          children: markdownLineToRuns(trimmed, { size: 22 }), // 11pt
        })
      );
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "improved-resume.docx");
  };

  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(1, overallScore / 10));
  const offset = circumference - progress * circumference;
  const atsCircleRadius = 43;
  const atsCircumference = 2 * Math.PI * atsCircleRadius;
  const atsProgress = Math.max(0, Math.min(1, atsScore / 10));
  const atsOffset = atsCircumference - atsProgress * atsCircumference;
  const atsScoreColor = getScoreColor(atsScore);

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-6">
      <div
        className={[
          "max-w-[700px] mx-auto space-y-8 transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        ].join(" ")}
      >
        {/* Overall + ATS scores + summary */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-[30px] flex-wrap">
            <div className="relative w-[150px] h-[150px] flex items-center justify-center">
              <svg
                className="w-full h-full"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  fill="transparent"
                  stroke="#262626"
                  strokeWidth="10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  fill="transparent"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm uppercase tracking-[0.2em] text-gray-400">
                  Overall
                </span>
                <span className="text-4xl font-semibold" style={{ color: scoreColor }}>
                  {overallScore}
                  <span className="text-xl text-gray-400">/10</span>
                </span>
              </div>
            </div>

            {hasAtsScore && (
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 110 110"
                    aria-hidden="true"
                  >
                    <circle
                      cx="55"
                      cy="55"
                      r={atsCircleRadius}
                      fill="transparent"
                      stroke="#262626"
                      strokeWidth="8"
                    />
                    <circle
                      cx="55"
                      cy="55"
                      r={atsCircleRadius}
                      fill="transparent"
                      stroke={atsScoreColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={atsCircumference}
                      strokeDashoffset={atsOffset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-semibold" style={{ color: atsScoreColor }}>
                      {atsScore}
                      <span className="text-sm text-gray-400">/10</span>
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-sm font-semibold text-gray-300">ATS Score</span>
                <span
                  style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}
                >
                  How ATS-friendly is your resume?
                </span>
              </div>
            )}
          </div>

          <div className="w-full">
            <div className="bg-[#0d0d0d] border border-[#262626] rounded-2xl px-6 py-5 shadow-lg shadow-black/40">
              <h2 className="text-lg font-semibold mb-2 text-[#ff6b35]">
                Summary
              </h2>
              <p className="text-gray-200 text-base leading-relaxed">
                {results?.summary}
              </p>
            </div>
          </div>

          {atsIssues.length > 0 && (
            <div
              className="w-full rounded-2xl px-6 py-5"
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid #262626",
                borderLeft: "3px solid #ef4444",
              }}
            >
              <h3
                className="font-semibold text-[#ef4444] mb-3"
                style={{ fontSize: "20px" }}
              >
                ATS Issues Found
              </h3>
              <div className="space-y-3 text-left">
                {atsIssues.map((issue, index) => (
                  <p key={`${issue}-${index}`} className="text-sm text-gray-200 leading-relaxed">
                    ⚠️ {issue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {atsKeywords.length > 0 && (
            <div
              className="w-full rounded-2xl px-6 py-5 text-left"
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid #262626",
                borderLeft: "3px solid #22c55e",
              }}
            >
              <h3 className="text-lg font-semibold text-[#22c55e] mb-3">Add These Keywords</h3>
              <div>
                {atsKeywords.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    style={{
                      display: "inline-block",
                      background: "#1a3a1a",
                      color: "#ffffff",
                      border: "1px solid #22c55e",
                      borderRadius: "999px",
                      padding: "6px 12px",
                      margin: "6px",
                      fontSize: "13px",
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-gray-200 tracking-wide text-center">
            Section Breakdown
          </h3>
          <div className="space-y-5">
            {results?.sections?.map((section, idx) => {
              const rawScore = section.score ?? 0;
              const sectionColor =
                rawScore <= 4 ? "#ef4444" : rawScore <= 6 ? "#eab308" : "#22c55e";
              return (
                <div
                  key={section.name ?? idx}
                  className="bg-[#050505] border border-[#262626] border-l-[3px] border-l-[#ff6b35] rounded-2xl p-4 pl-7 flex flex-col gap-3 shadow-md shadow-black/40"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-100 text-base">
                      {section.name}
                    </span>
                    <span
                      className="ml-[10px] inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/60"
                      style={{
                        border: `1px solid ${sectionColor}`,
                        color: sectionColor,
                      }}
                    >
                      {section.score}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {section.feedback}
                  </p>
                  {section.rewrite && (
                    <div className="mt-1 rounded-xl bg-[#1a1a1a] border border-[#ff6b35]/40 p-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#ff6b35]">
                          Suggested Rewrite
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(section.rewrite || "")}
                          className="text-xs px-3 py-1 rounded-full bg-[#ff6b35] text-black font-medium hover:bg-[#ff814f] active:scale-95 transition-transform"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="text-sm text-gray-100 whitespace-pre-wrap break-words font-mono">
                        {section.rewrite}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 3 improvements + Elevator pitch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#050505] border border-[#ff6b35]/60 rounded-2xl p-5 shadow-lg shadow-black/40">
            <h3 className="text-lg font-semibold mb-3 text-[#ff6b35]">
              Top 3 Improvements
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-gray-100">
              {results?.topThreeImprovements?.map((item, index) => (
                <li key={index} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-[#050505] border border-[#333] rounded-2xl p-5 shadow-lg shadow-black/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-100">
                Your Elevator Pitch
              </h3>
              <button
                type="button"
                onClick={handleCopyElevatorPitch}
                className="text-xs px-3 py-1 rounded-full bg-[#ff6b35] text-black font-medium hover:bg-[#ff814f] active:scale-95 transition-transform"
              >
                Copy
              </button>
            </div>
            <div className="relative pl-4 border-l-2 border-[#ff6b35]/70">
              <p className="text-gray-100 italic leading-relaxed">
                “{results?.elevatorPitch}”
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#1a1a1a",
            borderLeft: "3px solid #ff6b35",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 10px 0" }}>
            Get weekly resume tips & new feature updates
          </p>
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <input
              type="email"
              placeholder="Your email"
              value={subscriberEmail}
              onChange={(e) => {
                setSubscriberEmail(e.target.value);
                if (subscribeSuccess) setSubscribeSuccess(false);
              }}
              style={{
                backgroundColor: "#111",
                color: "#fff",
                border: "1px solid #333",
                borderRight: "none",
                borderTopLeftRadius: "8px",
                borderBottomLeftRadius: "8px",
                padding: "10px 16px",
                flex: 1,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleSubscribe}
              style={{
                backgroundColor: "#ff6b35",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Subscribe
            </button>
          </div>
          {subscribeSuccess && (
            <p style={{ color: "#22c55e", fontSize: "12px", margin: "8px 0 0 0" }}>
              Thanks! We'll keep you updated 🔥
            </p>
          )}
          <p style={{ color: "#666", fontSize: "11px", margin: "8px 0 0 0" }}>
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-5 pt-8">
          {typeof onFixResume === "function" && (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={onFixResume}
                disabled={isFixing}
                className={[
                  "mt-[30px] w-full inline-flex justify-center items-center px-5 h-[50px] rounded-[10px] font-bold text-white transition-colors",
                  isFixing ? "cursor-not-allowed opacity-70" : "hover:brightness-110",
                ].join(" ")}
                style={{ backgroundColor: "#16a34a" }}
              >
                {isFixing
                  ? "Generating improved content..."
                  : "Get AI-Improved Content ✨"}
              </button>

              {fixedResume && (
                <div className="w-full flex flex-col gap-3">
                  <div
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #262626",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="text-base font-semibold text-white">
                        AI-Improved Resume Content ✨
                      </h3>
                      {fixedResume.length > 500 && (
                        <button
                          type="button"
                          onClick={() => setShowFullFixedResume((v) => !v)}
                          className="text-xs px-3 py-1 rounded-full border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 active:scale-95 transition-transform"
                        >
                          {showFullFixedResume ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </div>

                    <pre
                      style={{
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: "#e5e7eb",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {showFullFixedResume
                        ? fixedResume
                        : fixedResume.slice(0, 500) +
                          (fixedResume.length > 500 ? "…" : "")}
                    </pre>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadImprovedResume}
                    className="w-full inline-flex justify-center items-center px-5 h-[50px] rounded-[12px] font-bold text-white hover:brightness-110 active:scale-[0.99] transition-transform"
                    style={{ backgroundColor: "#3b82f6" }}
                  >
                    Download as DOCX Draft 📄
                  </button>
                  <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>
                    Note: This is a content draft with AI-improved text. Copy the
                    suggestions into your original resume to keep your formatting.
                  </p>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleShareScore}
            className="w-full inline-flex justify-center items-center gap-2 px-5 h-[50px] rounded-full bg-[#ff6b35] text-black font-semibold text-lg shadow-md shadow-black/40 hover:bg-[#ff814f] active:scale-95 transition-transform"
          >
            Share Your Score
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="w-full inline-flex justify-center items-center gap-2 px-5 h-[50px] rounded-full border-2 border-[#ff6b35] text-[#ff6b35] font-semibold text-lg bg-transparent hover:bg-[#ff6b35]/10 active:scale-95 transition-transform"
          >
            Review Another Resume
          </button>
        </div>
      </div>
    </div>
  );
}

