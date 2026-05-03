"use client";

import { useState } from "react";
import TopNav from "../components/TopNav";

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

export default function SkillPrint() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillData, setSkillData] = useState<object | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsAnalyzing(true);
    // TODO: wire up API
    setIsAnalyzing(false);
  };

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

      {/* Header */}
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

      {/* Upload card */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "#111827",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        }}
      >
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
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                PDF or DOCX, max 10MB
              </p>
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
          <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 14px 0" }}>
            {fileError}
          </p>
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
            <option value="" disabled style={{ color: "#64748b" }}>
              Select a role...
            </option>
            {TARGET_ROLES.map((role) => (
              <option key={role} value={role} style={{ color: "#e5e7eb", backgroundColor: "#1e293b" }}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
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
          {isAnalyzing ? "Analyzing..." : "Generate SkillPrint 🎯"}
        </button>
      </div>

      {/* Placeholder chart area */}
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
        select option {
          background-color: #1e293b;
          color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
