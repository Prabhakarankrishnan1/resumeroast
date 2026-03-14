"use client";

import { useState } from "react";
import ReviewResults from "./components/ReviewResults";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState("kind");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const personas = [
    { id: "kind", label: "Kind Coach", emoji: "🤝" },
    { id: "tough", label: "Tough Hiring Manager", emoji: "💼" },
    { id: "brutal", label: "Brutally Honest Friend", emoji: "🔥" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("persona", selectedPersona);
      const res = await fetch("/api/review", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong");
      } else {
        setResults(data);
        console.log("Results:", data);
      }
    } catch (err) {
      alert("Failed to connect. Please try again.");
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
            {isLoading ? "Roasting... 🔥" : "Roast My Resume 🔥"}
          </button>

          {isLoading && (
            <p style={{ marginTop: "20px", color: "#ff6b35" }}>
              Claude is reading your resume...
            </p>
          )}
        </div>
      )}

      {results && (
        <div className="w-full mt-8 transition-all duration-500 opacity-100 translate-y-0">
          <ReviewResults results={results} />
        </div>
      )}

      <p style={{ marginTop: "60px", color: "#444", fontSize: "13px", textAlign: "center" }}>
        Built with 🔥 and Claude AI — Your resume is never stored
      </p>
    </div>
  );
}