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

const REVIEW_JSON_INSTRUCTION = `Review this resume and provide feedback in the following JSON format. Return ONLY valid JSON, no other text:
{
  "overallScore": 7,
  "summary": "assessment here",
  "sections": [
    {
      "name": "Experience",
      "score": 7,
      "feedback": "feedback here",
      "rewrite": "rewritten bullet or null"
    }
  ],
  "topThreeImprovements": ["one", "two", "three"],
  "elevatorPitch": "pitch here"
}`;

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s timeout

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
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
