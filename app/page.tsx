"use client";

import { useEffect, useState } from "react";
import ReviewResults from "./components/ReviewResults";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState("kind");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadingMessages = [
    "Scanning for buzzword crimes...",
    "Judging your font choices...",
    "Counting your bullet points...",
    "Looking for the 'proficient in Microsoft Office' red flag...",
    "Checking if you really are a 'team player'...",
    "Evaluating your humble brags...",
  ];

  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(0);
      setLoadingMessageIndex(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 3;
      });
    }, 200);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  const personas = [
    { id: "kind", label: "Kind Coach", emoji: "🤝" },
    { id: "tough", label: "Tough Hiring Manager", emoji: "💼" },
    { id: "brutal", label: "Brutally Honest Friend", emoji: "🔥" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isTooLarge = file.size > 10 * 1024 * 1024; // 10MB

    if (!isPdf) {
      setFileError("Please upload a PDF file");
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

    const isPdf = file.type === "application/pdf";
    const isTooLarge = file.size > 10 * 1024 * 1024; // 10MB

    if (!isPdf) {
      setFileError("Please upload a PDF file");
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

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "8px" }}>
        <span role="img" aria-label="fire">🔥</span> ResumeRoast
      </h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
        The #1 Free AI Resume Roast Tool
      </p>
      <p style={{ color: "#999", fontSize: "18px", marginBottom: "40px" }}>
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
              padding: "40px",
              textAlign: "center",
              width: "100%",
              maxWidth: "500px",
              marginBottom: "30px",
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
                <p style={{ fontSize: "40px", marginBottom: "10px" }}>📁</p>
                <p style={{ fontSize: "16px" }}>
                  Drag and drop your resume PDF here
                </p>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  or click to browse
                </p>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
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
              gap: "12px",
              marginBottom: "30px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border:
                    selectedPersona === p.id
                      ? "2px solid #ff6b35"
                      : "2px solid #333",
                  backgroundColor:
                    selectedPersona === p.id ? "#ff6b35" : "#1a1a1a",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
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
              padding: "16px 40px",
              fontSize: "18px",
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

          {isLoading && (
            <div className="mt-8 w-full max-w-md mx-auto text-center space-y-4">
              <div className="flex justify-center">
                <div className="text-5xl animate-bounce drop-shadow-[0_0_25px_rgba(248,113,113,0.7)]">
                  🔥
                </div>
              </div>
              <div className="min-h-[40px]">
                <p className="text-[#ff6b35] text-base sm:text-lg font-medium transition-opacity duration-300 ease-out">
                  {loadingMessages[loadingMessageIndex]}
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#262626]">
                <div
                  className="h-full bg-gradient-to-r from-[#ff6b35] via-[#f97316] to-[#facc15] transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                The AI is carefully roasting your resume. This might take a few moments.
              </p>
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
          marginTop: "40px",
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
          marginTop: "60px",
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