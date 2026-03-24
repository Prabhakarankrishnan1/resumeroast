"use client";

import { useEffect, useState } from "react";
import ReviewResults from "./components/ReviewResults";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState("kind");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadingMessages = [
    "Scanning for buzzword crimes...",
    "Judging your font choices...",
    "Counting your bullet points...",
    "Looking for the 'proficient in Microsoft Office' red flag...",
    "Checking if you really are a 'team player'...",
    "Evaluating your humble brags...",
    "Searching for action verbs...",
    "Measuring your margin sizes...",
    "Analyzing your LinkedIn URL...",
  ];

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  const personas = [
    { id: "kind", label: "Kind Coach", emoji: "🤝" },
    { id: "tough", label: "Tough Hiring Manager", emoji: "💼" },
    { id: "brutal", label: "Brutally Honest Friend", emoji: "🔥" },
  ];

  const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const isAllowedResumeFile = (file: File) => {
    if (
      file.type === "application/pdf" ||
      file.type === DOCX_MIME
    ) {
      return true;
    }
    const name = file.name.toLowerCase();
    return name.endsWith(".pdf") || name.endsWith(".docx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTooLarge = file.size > 10 * 1024 * 1024; // 10MB

    if (!isAllowedResumeFile(file)) {
      setFileError("Please upload a PDF or DOCX file");
      setSelectedFile(null);
      return;
    }

    if (isTooLarge) {
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

    const isTooLarge = file.size > 10 * 1024 * 1024; // 10MB

    if (!isAllowedResumeFile(file)) {
      setFileError("Please upload a PDF or DOCX file");
      setSelectedFile(null);
      return;
    }

    if (isTooLarge) {
      setFileError("File too large. Please upload a resume under 10MB");
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setApiError(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("persona", selectedPersona);
      const res = await fetch("/api/review", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Something went wrong. Please try again.");
      } else {
        setResults(data);
        console.log("Results:", data);
      }
    } catch (err) {
      setApiError("Failed to connect. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{
          backgroundColor: "#0f0f0f",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <style jsx>{`
          @keyframes firePulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.3);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes messageFade {
            0% {
              opacity: 0.1;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              opacity: 0.1;
            }
          }

          @keyframes progressFill {
            0% {
              width: 5%;
            }
            100% {
              width: 90%;
            }
          }
        `}</style>

        <div
          className="mb-6"
          style={{ fontSize: "60px", animation: "firePulse 1s ease-in-out infinite" }}
        >
          🔥
        </div>

        <p
          key={loadingMessageIndex}
          className="text-base sm:text-lg font-medium min-h-[32px] mb-5"
          style={{
            color: "#ff6b35",
            animation: "messageFade 2.5s ease-in-out",
          }}
        >
          {loadingMessages[loadingMessageIndex]}
        </p>

        <div
          className="w-full rounded-full overflow-hidden"
          style={{ maxWidth: "300px", height: "6px", backgroundColor: "#333" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: "#ff6b35",
              width: "5%",
              animation: "progressFill 30s linear forwards",
            }}
          />
        </div>

        <p className="mt-4 text-xs" style={{ color: "#9a9a9a" }}>
          This usually takes 15-30 seconds.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 20px 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "36px", marginBottom: "4px" }}>
        <span role="img" aria-label="fire">🔥</span> ResumeRoast
      </h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "6px" }}>
        The #1 Free AI Resume Roast Tool
      </p>
      <p style={{ color: "#999", fontSize: "16px", marginBottom: "20px" }}>
        Get brutally honest AI feedback on your resume
      </p>

      {!results && (
        <div
          className={`transition-all duration-500 ${
            results ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: "2px dashed #ff6b35",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              width: "100%",
              maxWidth: "450px",
              marginBottom: "15px",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            {selectedFile ? (
              <div>
                <p style={{ fontSize: "18px" }}>📄 {selectedFile.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  style={{
                    marginTop: "10px",
                    background: "#333",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>📁</p>
                <p style={{ fontSize: "14px", color: "#bbb" }}>
                  Drag and drop your resume PDF or DOCX here | or click to
                  browse
                </p>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {fileError && (
            <div className="mt-3 max-w-[500px] mx-auto border border-red-500/70 bg-[#2a0b0b] text-red-300 text-sm rounded-md px-3 py-2">
              {fileError}
            </div>
          )}

          <p style={{ marginBottom: "12px", fontSize: "16px" }}>
            Pick your reviewer:
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "15px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border:
                    selectedPersona === p.id
                      ? "2px solid #ff6b35"
                      : "2px solid #333",
                  backgroundColor:
                    selectedPersona === p.id ? "#ff6b35" : "#1a1a1a",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            style={{
              padding: "12px 32px",
              fontSize: "17px",
              fontWeight: "bold",
              borderRadius: "10px",
              border: "none",
              backgroundColor: selectedFile && !isLoading ? "#ff6b35" : "#333",
              color: selectedFile && !isLoading ? "white" : "#666",
              cursor:
                selectedFile && !isLoading ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? "Roasting your resume..." : "Roast My Resume 🔥"}
          </button>

          {apiError && (
            <div className="mt-6 max-w-[500px] mx-auto border border-red-500/80 bg-[#2a0b0b] text-red-200 rounded-lg px-4 py-3 space-y-3">
              <p style={{ fontSize: "14px", fontWeight: 500 }}>
                {apiError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setApiError(null);
                  setResults(null);
                }}
                className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md border border-red-400 text-red-200 text-sm font-medium hover:bg-red-500/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      )}

      {results && (
        <div className="w-full mt-8 transition-all duration-500 opacity-100 translate-y-0">
          <ReviewResults results={results} />
        </div>
      )}

      <div
        style={{
          marginTop: "24px",
          color: "#666",
          fontSize: "12px",
          textAlign: "center",
          maxWidth: "600px",
          lineHeight: 1.6,
        }}
      >
        <p>
          ResumeRoast (Resume Roast) is a free AI-powered tool that reviews your
          resume and gives brutally honest feedback. Get your resume roasted by
          AI with section scores, rewrite suggestions, and an elevator pitch.
        </p>
      </div>

      <div
        style={{
          marginTop: "24px",
          color: "#666",
          fontSize: "12px",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        <p>Built with 🔥 and Claude AI</p>
        <p>Your resume is processed securely and never stored</p>
      </div>
    </div>
  );
}