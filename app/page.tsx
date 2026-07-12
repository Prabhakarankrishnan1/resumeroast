"use client";

import { useEffect, useState } from "react";
import ReviewResults from "./components/ReviewResults";
import TopNav from "./components/TopNav";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState("kind");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixedResume, setFixedResume] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSendingContact, setIsSendingContact] = useState(false);

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
    setIsFixing(false);
    setFixedResume(null);
    try {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "roast_started", { event_category: "engagement" });
      }
    } catch (err) {
      console.error("Analytics event failed:", err);
    }
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
        try {
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "roast_completed", { event_category: "engagement" });
          }
        } catch (err) {
          console.error("Analytics event failed:", err);
        }
      }
    } catch (err) {
      setApiError("Failed to connect. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  const handleFixResume = async () => {
    setIsFixing(true);
    try {
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/fix", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Something went wrong. Please try again.");
        return;
      }

      setFixedResume(data?.improvedResume ?? null);
    } catch (e: any) {
      alert(e?.message || "Failed to fix resume. Please try again.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleSendContactMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      setContactError("Something went wrong, please try again");
      return;
    }

    setIsSendingContact(true);
    setContactError(null);
    setContactSuccess(false);

    try {
      const res = await fetch("https://formspree.io/f/mojpwynl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: contactSubject,
          message: contactMessage,
          email: contactEmail,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send contact message");
      }

      setContactSuccess(true);
      setContactSubject("");
      setContactMessage("");
      setContactEmail("");
      setTimeout(() => {
        setShowContactForm(false);
        setContactSuccess(false);
      }, 2000);
    } catch (e) {
      setContactError("Something went wrong, please try again");
    } finally {
      setIsSendingContact(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <TopNav activePage="resume-review" />
        <div
          className="min-h-screen flex flex-col items-center justify-center text-center px-6"
          style={{
            backgroundColor: "#0f0f0f",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            paddingTop: "60px",
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
      </>
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
        padding: "80px 20px 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <TopNav activePage="resume-review" />

      {!results && (
        <div
          className={`transition-all duration-500 ${
            results ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
          }`}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <p
            style={{
              color: "#94a3b8",
              fontSize: "16px",
              textAlign: "center",
              marginBottom: "18px",
              lineHeight: 1.5,
            }}
          >
            Upload your resume. Pick your reviewer. Get brutally honest feedback.
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "18px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("fileInput")?.click()}
              className="upload-drop-card"
              style={{
                border: "1px dashed #334155",
                borderRadius: "10px",
                padding: "18px 14px",
                marginBottom: "14px",
                cursor: "pointer",
                backgroundColor: "#0f172a",
                transition: "border-color 180ms ease, box-shadow 180ms ease",
              }}
            >
              {selectedFile ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "16px", color: "#e5e7eb", wordBreak: "break-word" }}>
                    📄 {selectedFile.name}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    style={{
                      marginTop: "10px",
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
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "20px", marginBottom: "6px" }}>📄</p>
                  <p style={{ fontSize: "15px", color: "#e5e7eb", marginBottom: "4px" }}>
                    Drop your resume here
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                    PDF or DOCX, max 10MB
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

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "14px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    border:
                      selectedPersona === p.id
                        ? "1px solid #ff6b35"
                        : "1px solid #334155",
                    backgroundColor:
                      selectedPersona === p.id ? "rgba(255, 107, 53, 0.16)" : "#0f172a",
                    color: selectedPersona === p.id ? "#ff8a5c" : "#cbd5e1",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
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
                width: "100%",
                height: "44px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "10px",
                border: "none",
                backgroundColor: selectedFile && !isLoading ? "#ff6b35" : "#374151",
                color: selectedFile && !isLoading ? "white" : "#9ca3af",
                cursor:
                  selectedFile && !isLoading ? "pointer" : "not-allowed",
              }}
            >
              {isLoading ? "Roasting your resume..." : "Roast My Resume \u{1F525}"}
            </button>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              marginTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "12px",
              flexWrap: "wrap",
            }}
          >
            <span>
              <span style={{ color: "#0d9488" }}>✓</span> Free forever
            </span>
            <span>
              <span style={{ color: "#0d9488" }}>✓</span> No login
            </span>
            <span>
              <span style={{ color: "#0d9488" }}>✓</span> Resume never stored
            </span>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              textAlign: "center",
              background: "transparent",
            }}
          >
            <div style={{ padding: "6px 4px" }}>
              <p
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 4.2vw, 20px)",
                  lineHeight: 1.1,
                }}
              >
                500+
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#94a3b8",
                  fontSize: "clamp(10px, 2.6vw, 12px)",
                  lineHeight: 1.35,
                }}
              >
                Resumes Reviewed
              </p>
            </div>

            <div style={{ padding: "6px 4px" }}>
              <p
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 4.2vw, 20px)",
                  lineHeight: 1.1,
                }}
              >
                3
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#94a3b8",
                  fontSize: "clamp(10px, 2.6vw, 12px)",
                  lineHeight: 1.35,
                }}
              >
                Reviewer Styles
              </p>
            </div>

            <div style={{ padding: "6px 4px" }}>
              <p
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 4.2vw, 20px)",
                  lineHeight: 1.1,
                }}
              >
                30s
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#94a3b8",
                  fontSize: "clamp(10px, 2.6vw, 12px)",
                  lineHeight: 1.35,
                }}
              >
                Analysis
              </p>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "780px",
              marginTop: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px 0",
                color: "#cbd5e1",
                fontSize: "13px",
                textAlign: "center",
                letterSpacing: "0.2px",
              }}
            >
              How It Works
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className="sm:max-h-[80px]"
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "12px",
                  overflow: "hidden",
                }}
              >
                <p style={{ margin: "0 0 4px 0", color: "#ffffff", fontSize: "14px", fontWeight: 600 }}>
                  <span style={{ color: "#0d9488", marginRight: "6px" }}>1.</span> 📄 Upload
                </p>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", lineHeight: 1.4 }}>
                  Drop your resume PDF or Word doc
                </p>
              </div>

              <div
                className="sm:max-h-[80px]"
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "12px",
                  overflow: "hidden",
                }}
              >
                <p style={{ margin: "0 0 4px 0", color: "#ffffff", fontSize: "14px", fontWeight: 600 }}>
                  <span style={{ color: "#0d9488", marginRight: "6px" }}>2.</span> 🎭 Choose
                </p>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", lineHeight: 1.4 }}>
                  Pick Kind Coach, Tough HM, or Brutally Honest Friend
                </p>
              </div>

              <div
                className="sm:max-h-[80px]"
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "12px",
                  overflow: "hidden",
                }}
              >
                <p style={{ margin: "0 0 4px 0", color: "#ffffff", fontSize: "14px", fontWeight: 600 }}>
                  <span style={{ color: "#0d9488", marginRight: "6px" }}>3.</span> 🔥 Get Roasted
                </p>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", lineHeight: 1.4 }}>
                  Section scores, rewrite suggestions, ATS check, and more
                </p>
              </div>
            </div>
          </div>

          {fileError && (
            <div className="mt-3 max-w-[500px] mx-auto border border-red-500/70 bg-[#2a0b0b] text-red-300 text-sm rounded-md px-3 py-2">
              {fileError}
            </div>
          )}

          {apiError && (
            <div
              style={{
                marginTop: "24px",
                width: "100%",
                maxWidth: "500px",
                backgroundColor: "#1e1e1e",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#fb7185",
                  marginBottom: "12px",
                }}
              >
                {apiError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setApiError(null);
                  setResults(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ff6b35",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          )}

          <style jsx>{`
            .upload-drop-card:hover {
              border-color: #ff6b35 !important;
              box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.35),
                0 0 18px rgba(255, 107, 53, 0.2);
            }
          `}</style>

        </div>
      )}

      {results && (
        <div className="w-full mt-8 transition-all duration-500 opacity-100 translate-y-0">
          <ReviewResults
            results={results}
            personaId={selectedPersona}
            isFixing={isFixing}
            onFixResume={handleFixResume}
            fixedResume={fixedResume}
          />
        </div>
      )}

      <footer
        style={{
          marginTop: "28px",
          width: "100%",
          backgroundColor: "#0a0a0a",
          borderTop: "1px solid #1e293b",
          padding: "20px",
        }}
      >
        <div
          className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, textAlign: "center" }}
        >
          <p style={{ margin: 0, color: "#94a3b8" }}>© 2026 ResumeRoast</p>

          <div className="flex items-center" style={{ color: "#cbd5e1" }}>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdjmv_PXk5RWj5xlhGbZCyYjwm5JYTNLwYqO0Ol6yFLcCC7FA/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#cbd5e1", textDecoration: "none" }}
            >
              Feedback
            </a>
            <span style={{ margin: "0 12px", color: "#64748b" }}>·</span>
            <button
              type="button"
              onClick={() => setShowContactForm(true)}
              style={{
                color: "#cbd5e1",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Contact Us
            </button>
            <span style={{ margin: "0 12px", color: "#64748b" }}>·</span>
            <a href="#" style={{ color: "#cbd5e1", textDecoration: "none" }}>
              Privacy
            </a>
            <span style={{ margin: "0 12px", color: "#64748b" }}>·</span>
            <a
              href="https://booksmith530.gumroad.com/l/job-search-ai-kit/ROAST50"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#cbd5e1", textDecoration: "none" }}
            >
              Job Search AI Kit
            </a>
          </div>

          <p style={{ margin: 0, color: "#94a3b8" }}>
            Built with 🔥 and AI — Your data is never stored
          </p>
        </div>
      </footer>

      {showContactForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#1a1a1a",
              borderRadius: "12px",
              padding: "30px",
              border: "1px solid #333",
            }}
          >
            <h2 style={{ color: "#ff6b35", fontSize: "24px", margin: "0 0 16px 0" }}>
              Contact Us
            </h2>

            <input
              type="text"
              placeholder="Subject"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#111",
                color: "#fff",
                border: "1px solid #333",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "12px",
                outline: "none",
              }}
            />

            <textarea
              rows={5}
              placeholder="Your message or feedback"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#111",
                color: "#fff",
                border: "1px solid #333",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "12px",
                outline: "none",
                resize: "vertical",
              }}
            />

            <input
              type="email"
              placeholder="Your email (optional)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "#111",
                color: "#fff",
                border: "1px solid #333",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "14px",
                outline: "none",
              }}
            />

            {contactSuccess && (
              <p style={{ color: "#22c55e", fontSize: "13px", margin: "0 0 10px 0" }}>
                Message sent! We&apos;ll get back to you.
              </p>
            )}

            {contactError && (
              <p style={{ color: "#ef4444", fontSize: "13px", margin: "0 0 10px 0" }}>
                {contactError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSendContactMessage}
              disabled={isSendingContact}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#ff6b35",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: isSendingContact ? "not-allowed" : "pointer",
                opacity: isSendingContact ? 0.7 : 1,
                fontWeight: 700,
              }}
            >
              {isSendingContact ? "Sending..." : "Send Message"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowContactForm(false);
                setContactError(null);
                setContactSuccess(false);
              }}
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                width: "100%",
                fontSize: "14px",
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