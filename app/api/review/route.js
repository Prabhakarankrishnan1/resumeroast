import { createRequire } from "module";
import { NextResponse } from "next/server";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

// Basic in-memory rate limit (resets on server restart).
// Keyed by client IP to mitigate rapid repeated review requests.
const rateLimitByIp = new Map();
const MAX_REQUESTS_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OVERLOAD_RETRY_DELAY_MS = 3000;
const OVERLOAD_ERROR_MESSAGE =
  "Our AI is experiencing high demand right now. Please try again in a minute.";

const REVIEW_JSON_INSTRUCTION = `Review this resume and provide feedback in the following JSON format. Return ONLY valid JSON, no other text:
{
  "overallScore": 7,
  "atsScore": 7,
  "summary": "assessment here",
  "sections": [
    {
      "name": "Experience",
      "score": 7,
      "feedback": "feedback here",
      "rewrite": "rewritten bullet or null"
    }
  ],
  "atsIssues": [
    "Issue with a specific section and an exact fix, e.g. Remove the two-column layout in the Skills section and use a single-column list instead"
  ],
  "atsKeywords": ["keyword one", "keyword two", "keyword three"],
  "topThreeImprovements": ["one", "two", "three"],
  "elevatorPitch": "pitch here"
}

atsIssues: array of strings, each issue must be specific and actionable. Instead of vague warnings like "Complex formatting may not parse correctly", give specific fixes like "Remove the two-column layout in the Skills section - use a single-column list instead" or "Change the header Contact Info to CONTACT to match standard ATS section names" or "Replace the bullet symbol ● with standard bullet • for better ATS parsing". Every issue must tell the user exactly WHAT to fix and HOW to fix it. Reference specific sections or content from the resume.`;

function getClientIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "unknown";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {import("next/server").NextRequest} request */
export async function POST(request) {
  try {
    const now = Date.now();
    const ip = getClientIp(request);
    const existing = rateLimitByIp.get(ip);

    if (!existing || now >= existing.resetTime) {
      rateLimitByIp.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
      existing.count += 1;
      if (existing.count > MAX_REQUESTS_PER_HOUR) {
        return NextResponse.json(
          {
            error:
              "You've used all your free reviews for this hour. Come back soon! 🔥",
          },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const persona = formData.get("persona");
    console.log("Key starts with:", process.env.ANTHROPIC_API_KEY?.substring(0, 10));
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
          text: REVIEW_JSON_INSTRUCTION,
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
          text: `Resume content:\n\n${resumeText}\n\n${REVIEW_JSON_INSTRUCTION}`,
        },
      ];
    }

    const personaPrompts = {
      kind: "You are a warm, encouraging career coach who gives constructive feedback with empathy.",
      tough: "You are a strict hiring manager at a Fortune 500 company with very high standards.",
      brutal: "You are a brutally honest friend who is funny, sarcastic, and blunt but ultimately helpful.",
    };

    const systemPrompt = personaPrompts[persona] || personaPrompts.kind;

    async function callClaudeWithTimeout() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s timeout

      try {
        return await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
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
        return NextResponse.json({ error: "AI service error", details: errorText }, { status: 500 });
      }
    }

    const data = await response.json();
    const aiText = data.content[0].text;

    let result;
    try {
      result = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("FULL ERROR:", error);
    console.error("Server error:", error);
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "The AI is taking too long. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json({
      error: "Something went wrong",
      details: error.message,
      stack: error.stack?.split("\n").slice(0, 3).join(" | "),
    }, { status: 500 });
  }
}
