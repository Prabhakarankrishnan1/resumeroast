"use client";

import { useEffect, useState } from "react";

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
 * @property {string} summary
 * @property {ReviewSection[]} sections
 * @property {[string, string, string]} topThreeImprovements
 * @property {string} elevatorPitch
 */

/**
 * @param {{ results: ReviewResultsData }} props
 */
export default function ReviewResults({ results }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overallScore = results?.overallScore ?? 0;

  const getScoreColor = (score) => {
    if (score <= 4) return "#ef4444"; // red
    if (score <= 6) return "#eab308"; // yellow
    if (score <= 8) return "#22c55e"; // green
    return "#10b981"; // emerald
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

  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(1, overallScore / 10));
  const offset = circumference - progress * circumference;

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-6">
      <div
        className={[
          "max-w-[700px] mx-auto space-y-8 transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        ].join(" ")}
      >
        {/* Overall score + summary */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center">
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

        {/* Actions */}
        <div className="flex flex-col gap-4 pt-8">
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

