"use client";

import React, { useRef, useState } from "react";

type PersonaId = "kind" | "tough" | "brutal";

const PERSONAS: { id: PersonaId; label: string }[] = [
  { id: "kind", label: "Kind Coach 🤝" },
  { id: "tough", label: "Tough Hiring Manager 💼" },
  { id: "brutal", label: "Brutally Honest Friend 🔥" },
];

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>("kind");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      // Ignore non-PDF files for now; you could show a toast or error later.
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setResults(null);
    // TODO: Plug in AI resume roast call here and reset isLoading when done.
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="mr-2">🔥</span>
            <span className="bg-gradient-to-r from-[#ff6b35] via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              ResumeRoast
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl mx-auto">
            Get brutally honest AI feedback on your resume — no sugarcoating, just the real talk you
            need to level up.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur"
        >
          {/* Upload section */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">
              Upload your resume
            </h2>

            <div
              className={`relative flex flex-col items-center justify-center gap-3 px-4 py-8 sm:px-8 sm:py-10 border-2 border-dashed rounded-xl cursor-pointer transition
                ${
                  isDragging
                    ? "border-[#ff6b35] bg-[#ff6b35]/5"
                    : "border-white/15 bg-black/20 hover:border-[#ff6b35]/80 hover:bg-white/5"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center gap-2 text-center">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ff6b35]/10 text-[#ff6b35] text-xl">
                  📄
                </span>
                <p className="font-medium">
                  Drop your <span className="text-[#ff6b35]">PDF</span> resume here
                </p>
                <p className="text-xs text-neutral-400">Only PDF files are supported right now.</p>
              </div>

              {selectedFile && (
                <div className="mt-4 w-full max-w-md mx-auto flex items-center justify-between gap-3 rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[#ff6b35]">✔</span>
                    <span className="truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="shrink-0 rounded-full px-2 py-1 text-xs uppercase tracking-wide border border-white/20 hover:border-red-400 hover:text-red-400 transition"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Persona section */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">
              Choose your roast master
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PERSONAS.map((persona) => {
                const isActive = selectedPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-left transition border
                      ${
                        isActive
                          ? "bg-[#ff6b35] text-black border-[#ff6b35] shadow-[0_0_30px_rgba(255,107,53,0.6)]"
                          : "bg-white/5 text-white/90 border-white/10 hover:bg-white/10 hover:border-white/25"
                      }`}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Submit button */}
          <section className="pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base sm:text-lg font-semibold
                transition transform hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                ${
                  !selectedFile || isLoading
                    ? "bg-[#ff6b35]/40 text-white/70"
                    : "bg-[#ff6b35] text-black shadow-[0_0_40px_rgba(255,107,53,0.7)] hover:shadow-[0_0_55px_rgba(255,107,53,0.9)]"
                }`}
            >
              {isLoading ? "Roasting..." : "Roast My Resume 🔥"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}

