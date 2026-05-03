import { createRequire } from "module";
import { NextResponse } from "next/server";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OVERLOAD_RETRY_DELAY_MS = 3000;
const OVERLOAD_ERROR_MESSAGE =
  "Our AI is experiencing high demand right now. Please try again in a minute.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSkillprintPrompt(targetRole) {
  return `Analyze this resume against the target role: ${targetRole}

Return ONLY valid JSON, no other text, in exactly this format:
{
  "extractedSkills": [
    {
      "skill": "Python",
      "category": "Programming Languages",
      "proficiencyLevel": 8,
      "yearsOfExperience": 3,
      "evidenceFromResume": "Brief quote or reference from the resume that shows this skill"
    }
  ],
  "categories": [
    {
      "name": "Programming Languages",
      "skills": ["Python", "SQL"],
      "averageProficiency": 7,
      "marketImportance": 9
    }
  ],
  "marketReadinessScore": 72,
  "topStrengths": ["Strong data analysis", "Cloud certifications"],
  "criticalGaps": [
    {
      "skill": "Machine Learning",
      "importance": "Critical for ${targetRole} roles",
      "recommendation": "Take Andrew Ng's ML course on Coursera"
    }
  ],
  "overallSummary": "2-3 sentence summary of the candidate's skill profile relative to the ${targetRole} role"
}

Rules:
- proficiencyLevel: 1–10 (1 = beginner, 10 = expert), inferred from context and years of experience
- marketImportance: 1–10, how important each skill category is specifically for the ${targetRole} role
- marketReadinessScore: 0–100 overall percentage readiness for the ${targetRole} role
- Extract every distinct skill mentioned in the resume — be thorough
- Group skills into logical categories (e.g. Programming Languages, Frameworks, Cloud, Databases, Soft Skills, Tools)
- criticalGaps should list the most impactful missing skills for the ${targetRole} role, with actionable recommendations
- evidenceFromResume must reference actual text or context from the resume`;
}

async function callClaude(userContent, targetRole) {
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
        system:
          "You are SkillPrint, an expert career skill analyst. You extract skills from resumes, categorize them, rate proficiency, and compare against market demand for specific roles.",
        messages: [{ role: "user", content: userContent }],
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

/** @param {import("next/server").NextRequest} request */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const targetRole = formData.get("targetRole");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!targetRole || !String(targetRole).trim()) {
      return NextResponse.json(
        { error: "Target role is required" },
        { status: 400 }
      );
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
    const prompt = buildSkillprintPrompt(String(targetRole).trim());

    let userContent;
    if (fileType === "application/pdf") {
      const base64 = buffer.toString("base64");
      userContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        },
        { type: "text", text: prompt },
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
        { type: "text", text: `Resume content:\n\n${resumeText}\n\n${prompt}` },
      ];
    }

    let response = await callClaude(userContent, targetRole);

    if (!response.ok) {
      let { errorText, isOverloaded } = await parseErrorDetails(response);
      if (isOverloaded) {
        await sleep(OVERLOAD_RETRY_DELAY_MS);
        response = await callClaude(userContent, targetRole);
        if (!response.ok) {
          ({ errorText, isOverloaded } = await parseErrorDetails(response));
          if (isOverloaded) {
            console.error("Claude API overloaded after retry:", errorText);
            return NextResponse.json(
              { error: OVERLOAD_ERROR_MESSAGE },
              { status: 503 }
            );
          }
          console.error("Claude API error after retry:", errorText);
          return NextResponse.json(
            { error: "AI service error" },
            { status: 500 }
          );
        }
      } else {
        console.error("Claude API error:", errorText);
        return NextResponse.json({ error: "AI service error" }, { status: 500 });
      }
    }

    const data = await response.json();
    const aiText = data.content?.[0]?.text ?? "";

    let result;
    try {
      result = JSON.parse(aiText);
    } catch {
      const start = aiText.indexOf("{");
      const end = aiText.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          result = JSON.parse(aiText.slice(start, end + 1));
        } catch {
          console.error("Failed to extract JSON from AI response:", aiText);
          return NextResponse.json(
            { error: "Could not parse AI response" },
            { status: 500 }
          );
        }
      } else {
        console.error("No JSON found in AI response:", aiText);
        return NextResponse.json(
          { error: "Could not parse AI response" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("SkillPrint server error:", error);
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "The AI is taking too long. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
