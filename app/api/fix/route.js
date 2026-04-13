import { createRequire } from "module";
import { NextResponse } from "next/server";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OVERLOAD_RETRY_DELAY_MS = 3000;
const OVERLOAD_ERROR_MESSAGE =
  "Our AI is experiencing high demand right now. Please try again in a minute.";

const SYSTEM_PROMPT =
  "You are an expert resume writer. Rewrite this resume to be significantly better while keeping all factual information the same.";

const USER_INSTRUCTION =
  "Rewrite this entire resume to be significantly better. Fix all grammar, improve bullet points with quantified achievements, strengthen the summary, and make it ATS-friendly. Return the improved resume as clean structured text with clear section headers like CONTACT, SUMMARY, EXPERIENCE, EDUCATION, SKILLS. Return ONLY the resume text, no commentary.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {import("next/server").NextRequest} request */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileType = file.type;
    if (fileType !== "application/pdf" && fileType !== DOCX_MIME) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let userContent;

    if (fileType === "application/pdf") {
      const base64 = buffer.toString("base64");
      userContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: USER_INSTRUCTION,
        },
      ];
    } else {
      const { value: resumeText } = await mammoth.extractRawText({ buffer });
      if (!resumeText || !String(resumeText).trim()) {
        return NextResponse.json(
          { error: "Could not read text from this DOCX file." },
          { status: 400 }
        );
      }
      userContent = [
        {
          type: "text",
          text: `Resume content:\n\n${resumeText}\n\n${USER_INSTRUCTION}`,
        },
      ];
    }

    async function callClaudeWithTimeout() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      try {
        return await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: userContent,
              },
            ],
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }

    async function parseErrorDetails(response) {
      const errorText = await response.text();
      return {
        errorText,
        isOverloaded:
          response.status === 529 ||
          errorText.toLowerCase().includes("overloaded_error"),
      };
    }

    let response = await callClaudeWithTimeout();
    if (!response.ok) {
      let { errorText, isOverloaded } = await parseErrorDetails(response);
      if (isOverloaded) {
        await sleep(OVERLOAD_RETRY_DELAY_MS);
        response = await callClaudeWithTimeout();
        if (!response.ok) {
          ({ errorText, isOverloaded } = await parseErrorDetails(response));
          if (isOverloaded) {
            console.error("Claude API overloaded after retry:", errorText);
            return NextResponse.json(
              { error: OVERLOAD_ERROR_MESSAGE },
              { status: 503 }
            );
          }
        }
      }

      if (!response.ok) {
        console.error("Claude API error:", errorText);
        return NextResponse.json({ error: "AI service error" }, { status: 500 });
      }
    }

    const data = await response.json();
    const improvedResume = Array.isArray(data?.content)
      ? data.content
          .map((c) => (c?.type === "text" ? c.text : ""))
          .filter(Boolean)
          .join("\n")
      : "";

    if (!improvedResume) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ improvedResume });
  } catch (error) {
    console.error("Server error:", error);
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "The AI is taking too long. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

