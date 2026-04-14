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
 * @param {{ results: ReviewResultsData, personaId?: string, isFixing?: boolean, onFixResume?: () => void | Promise<void>, fixedResume?: string | null }} props
 */
export default function ReviewResults({
  results,
  personaId = "kind",
  isFixing = false,
  onFixResume,
  fixedResume = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [showFullFixedResume, setShowFullFixedResume] = useState(false);
  const [showAtsDetails, setShowAtsDetails] = useState(false);
  const [showAllAtsKeywords, setShowAllAtsKeywords] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [openRewriteBySection, setOpenRewriteBySection] = useState({});
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
  const visibleAtsKeywords = showAllAtsKeywords ? atsKeywords : atsKeywords.slice(0, 10);

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

  const handleShareScore = async () => {
    const shareText = `I scored ${overallScore}/10 on ResumeRoast! 🔥 Get your free resume roast at https://resumeroast.in`;
    await copyToClipboard(shareText);
    setShowCopied(true);
    setTimeout(() => {
      setShowCopied(false);
    }, 2000);
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
  const personaById = {
    kind: "Kind Coach 🤝",
    tough: "Tough Hiring Manager 💼",
    brutal: "Brutally Honest Friend 🔥",
  };
  const personaLabel = personaById[personaId] || personaById.kind;

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-6">
      <div
        className={[
          "max-w-[700px] mx-auto space-y-8 transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        ].join(" ")}
      >
        {/* Overall + ATS scores + summary */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#111827",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "24px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "16px",
              fontSize: "12px",
              color: "#94a3b8",
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid #334155",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            Reviewed as: {personaLabel}
          </div>

          <div className="flex items-center justify-center gap-[28px] flex-wrap text-center">
            <div className="flex flex-col items-center">
              <div className="relative w-[120px] h-[120px] flex items-center justify-center">
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
                <span className="text-4xl font-semibold" style={{ color: scoreColor }}>
                  {overallScore}
                  <span className="text-xl text-gray-400">/10</span>
                </span>
              </div>
              </div>
              <span className="mt-2 text-sm font-semibold text-gray-300">Resume Score</span>
            </div>

            {hasAtsScore && (
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-[80px] h-[80px] flex items-center justify-center">
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
              </div>
            )}
          </div>

          <div
            style={{
              height: "1px",
              width: "100%",
              backgroundColor: "#1e293b",
              marginTop: "18px",
              marginBottom: "14px",
            }}
          />

          <div style={{ textAlign: "left" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 8px 0",
                color: "#ff6b35",
              }}
            >
              Summary
            </h2>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.7, color: "#cbd5e1" }}>
              {results?.summary}
            </p>
          </div>
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
              const sectionKey = `${section.name ?? "section"}-${idx}`;
              const isRewriteOpen = !!openRewriteBySection[sectionKey];
              return (
                <div
                  key={section.name ?? idx}
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #1e293b",
                    padding: "16px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {section.name}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: `1px solid ${sectionColor}`,
                        color: sectionColor,
                        backgroundColor: "rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {section.score}/10
                    </span>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                    {section.feedback}
                  </p>
                  {section.rewrite && (
                    <div style={{ marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenRewriteBySection((prev) => ({
                            ...prev,
                            [sectionKey]: !prev[sectionKey],
                          }))
                        }
                        style={{
                          color: "#ff6b35",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {isRewriteOpen ? "Hide suggested rewrite ▲" : "View suggested rewrite ▼"}
                      </button>
                      {isRewriteOpen && (
                        <pre
                          style={{
                            marginTop: "10px",
                            marginBottom: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: "13px",
                            lineHeight: 1.6,
                            color: "#e2e8f0",
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            padding: "12px",
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          }}
                        >
                          {section.rewrite}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(atsIssues.length > 0 || atsKeywords.length > 0) && (
          <div
            className="w-full overflow-hidden"
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowAtsDetails((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
              style={{
                backgroundColor: "#111827",
                padding: "14px 20px",
                cursor: "pointer",
              }}
            >
              <span className="text-sm font-bold" style={{ color: "#ffffff" }}>
                ATS Details — Issues & Keywords
              </span>
              <span className="text-sm" style={{ color: "#94a3b8" }}>
                {showAtsDetails ? "▲" : "▼"}
              </span>
            </button>

            <div
              style={{
                maxHeight: showAtsDetails ? "700px" : "0px",
                overflow: "hidden",
                transition: "max-height 300ms ease",
              }}
            >
              <div style={{ padding: "0 16px 12px 16px" }}>
                <div
                  style={{
                    marginTop: "8px",
                    backgroundColor: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    padding: "20px",
                  }}
                >
                  <div className="text-left flex flex-col gap-4">
                    {atsIssues.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-[#ef4444] mb-2 text-sm">
                          ATS Issues Found
                        </h3>
                        <div className="space-y-2">
                          {atsIssues.map((issue, index) => (
                            <p
                              key={`${issue}-${index}`}
                              className="text-gray-200 leading-relaxed"
                              style={{ fontSize: "14px" }}
                            >
                              ⚠️ {issue}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsKeywords.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[#22c55e] mb-2">
                          Suggested ATS Keywords
                        </h3>
                        <div className="flex flex-wrap gap-[6px]">
                          {visibleAtsKeywords.map((keyword, index) => (
                            <span
                              key={`${keyword}-${index}`}
                              style={{
                                display: "inline-block",
                                background: "#1a3a1a",
                                color: "#ffffff",
                                border: "1px solid #22c55e",
                                borderRadius: "999px",
                                padding: "4px 10px",
                                fontSize: "11px",
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        {atsKeywords.length > 10 && !showAllAtsKeywords && (
                          <button
                            type="button"
                            onClick={() => setShowAllAtsKeywords(true)}
                            style={{
                              marginTop: "10px",
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "#ff6b35",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Show all {atsKeywords.length} keywords
                          </button>
                        )}
                        {atsKeywords.length > 10 && showAllAtsKeywords && (
                          <button
                            type="button"
                            onClick={() => setShowAllAtsKeywords(false)}
                            style={{
                              marginTop: "10px",
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "#ff6b35",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Show fewer keywords
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 improvements + Elevator pitch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 12px 0",
              }}
            >
              💡 Top 3 Improvements
            </h3>
            <ol style={{ paddingLeft: "20px", margin: 0 }}>
              {results?.topThreeImprovements?.map((item, index) => (
                <li
                  key={index}
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    marginBottom: "6px",
                  }}
                >
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Your Elevator Pitch
              </h3>
              <button
                type="button"
                onClick={handleCopyElevatorPitch}
                className="text-xs px-3 py-1 rounded-full text-white font-medium active:scale-95 transition-transform"
                style={{ backgroundColor: "#0d9488" }}
              >
                Copy
              </button>
            </div>
            <div>
              <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                {results?.elevatorPitch}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1e293b",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 10px 0" }}>
            Get weekly resume tips & new feature updates
          </p>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="email"
              placeholder="Your email"
              value={subscriberEmail}
              onChange={(e) => {
                setSubscriberEmail(e.target.value);
                if (subscribeSuccess) setSubscribeSuccess(false);
              }}
              style={{
                backgroundColor: "#0a0a0a",
                color: "#fff",
                border: "1px solid #1e293b",
                borderRight: "none",
                borderTopLeftRadius: "8px",
                borderBottomLeftRadius: "8px",
                padding: "0 16px",
                height: "42px",
                flex: 1,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleSubscribe}
              style={{
                backgroundColor: "#0d9488",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                padding: "0 20px",
                height: "42px",
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
        <div
          className="flex flex-col gap-3 items-center"
          style={{ marginTop: "30px", width: "100%" }}
        >
          {typeof onFixResume === "function" && (
            <div className="flex flex-col gap-4 items-center w-full">
              <button
                type="button"
                onClick={onFixResume}
                disabled={isFixing}
                className={[
                  "w-full max-w-[500px] inline-flex justify-center items-center px-5 h-[44px] rounded-[8px] text-[14px] font-semibold text-white transition-colors",
                  isFixing ? "cursor-not-allowed opacity-70" : "hover:brightness-110",
                ].join(" ")}
                style={{ backgroundColor: "#0d9488" }}
              >
                {isFixing
                  ? "Generating improved content..."
                  : "Get AI-Improved Content"}
              </button>

              {fixedResume && (
                <div className="w-full flex flex-col gap-3">
                  <div
                    style={{
                      backgroundColor: "#111827",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #1e293b",
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
            className={[
              "w-full max-w-[500px] inline-flex justify-center items-center gap-2 px-5 h-[44px] rounded-[8px] font-semibold text-[14px] border active:scale-95 transition-colors",
              showCopied
                ? "bg-[#0d9488]"
                : "bg-transparent hover:border-[#0d9488]",
            ].join(" ")}
            style={{
              color: "#ffffff",
              borderColor: showCopied ? "#0d9488" : "#334155",
            }}
          >
            {showCopied ? "Copied!" : "Share Your Score"}
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="w-full max-w-[500px] inline-flex justify-center items-center gap-2 px-5 h-[44px] rounded-[8px] border border-[#334155] text-[14px] font-semibold bg-transparent text-[#94a3b8] hover:border-[#0d9488] active:scale-95 transition-colors"
          >
            Review Another Resume
          </button>
        </div>
      </div>
    </div>
  );
}

