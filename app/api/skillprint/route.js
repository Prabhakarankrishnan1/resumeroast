import { createRequire } from "module";
import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

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

const COUNTRY_CURRENCY = {
  "India": "INR",
  "United States": "USD",
  "United Kingdom": "GBP",
  "Singapore": "SGD",
  "Canada": "CAD",
  "Australia": "AUD",
  "United Arab Emirates": "AED",
  "Germany": "EUR",
  "Pakistan": "PKR",
  "Iran": "IRR",
  "Jordan": "JOD",
  "Philippines": "PHP",
};

function buildSalaryInstruction(targetRole, targetCountry, targetCity) {
  const isOther = targetCountry.startsWith("Other");
  const countryName = isOther ? "the candidate's country" : targetCountry;
  const location = targetCity
    ? `${targetCity}, ${isOther ? "their country" : targetCountry}`
    : countryName;
  const countryField = isOther ? (targetCity || "Unknown") : targetCountry;

  return `

ADDITIONALLY, include a "salaryEstimate" field in your JSON with estimated annual salary ranges for ${targetRole} in ${location} based on typical 2026 market rates:
"salaryEstimate": {
  "country": "${countryField}",
  "city": "${targetCity}",
  "currency": "<the appropriate currency code, e.g. PKR, IRR, JOD, PHP>",
  "experienceRanges": [
    { "experience": "0-2 years", "low": <annual amount in local currency>, "high": <annual amount> },
    { "experience": "2-5 years", "low": <annual amount>, "high": <annual amount> },
    { "experience": "5-10 years", "low": <annual amount>, "high": <annual amount> }
  ],
  "note": "AI-estimated based on typical 2026 market rates. Actual salaries may vary."
}`;
}

function buildSkillprintPrompt(targetRole, salaryInstruction = "") {
  return `Analyze this resume against the target role: ${targetRole}

IMPORTANT: Keep your response concise to fit token limits:
- Extract maximum 15 most important skills (not exhaustive list)
- evidenceFromResume should be 1 short sentence, max 80 characters
- overallSummary should be 2 sentences max
- topStrengths should be 3 items max
- criticalGaps should be 5 items max
- Each recommendation should be 1 sentence, max 100 characters
- No verbose explanations, just the data

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
      "recommendation": "Take Andrew Ng's ML course on Coursera",
      "estimatedLearningTime": "2-4 weeks",
      "priority": 1
    }
  ],
  "estimatedTimeToTarget": "3-4 months",
  "overallSummary": "2-3 sentence summary of the candidate's skill profile relative to the ${targetRole} role"
}

Rules:
- proficiencyLevel: 1–10 (1 = beginner, 10 = expert), inferred from context and years of experience
- marketImportance: 1–10, how important each skill category is specifically for the ${targetRole} role
- marketReadinessScore: 0–100 overall percentage readiness for the ${targetRole} role
- Extract every distinct skill mentioned in the resume — be thorough
- Group skills into logical categories (e.g. Programming Languages, Frameworks, Cloud, Databases, Soft Skills, Tools)
- criticalGaps should list the most impactful missing skills for the ${targetRole} role, with actionable recommendations
- criticalGaps[].priority: integer starting at 1 (1 = highest priority gap to close)
- criticalGaps[].estimatedLearningTime: realistic time to reach working proficiency (e.g. "1-2 weeks", "2-4 weeks", "1-2 months")
- estimatedTimeToTarget: realistic total time for this candidate to become job-ready for ${targetRole} given their current skill level (e.g. "1-2 months", "3-6 months")
- evidenceFromResume must reference actual text or context from the resume${salaryInstruction}`;
}

async function callClaude(userContent, targetRole) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000); // 55s — stay under 60s Vercel limit

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
        max_tokens: 16000,
        thinking: { type: "disabled" },
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
    const targetCountry = String(formData.get("targetCountry") || "India").trim();
    const targetCity = String(formData.get("targetCity") || "").trim();

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

    // Query salary DB and read file in parallel before calling Claude so we can
    // conditionally include an AI salary-estimation instruction in the prompt.
    let salaryQuery = supabase
      .from("salary_benchmarks")
      .select("*")
      .eq("role_name", String(targetRole).trim());
    if (targetCity) {
      salaryQuery = salaryQuery.ilike("city", `%${targetCity}%`);
    } else {
      const currency = COUNTRY_CURRENCY[targetCountry];
      if (currency) salaryQuery = salaryQuery.eq("currency", currency);
    }

    const [bytes, { data: salaryData }] = await Promise.all([
      file.arrayBuffer(),
      salaryQuery,
    ]);
    const buffer = Buffer.from(bytes);
    const hasSalaryData = Array.isArray(salaryData) && salaryData.length > 0;
    const salaryInstruction = hasSalaryData
      ? ""
      : buildSalaryInstruction(String(targetRole).trim(), targetCountry, targetCity);
    const prompt = buildSkillprintPrompt(String(targetRole).trim(), salaryInstruction);

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
    let aiText = data.content?.[0]?.text ?? "";

    let jsonString = aiText
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonStart = jsonString.indexOf("{");
    const jsonEnd = jsonString.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
    }

    console.log("SKILLPRINT RAW TEXT:", aiText?.substring(0, 1500));
    console.log("SKILLPRINT TEXT LENGTH:", aiText?.length);
    console.log("SKILLPRINT CLEANED JSON:", jsonString?.substring(0, 1500));

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr.message, "\nRaw:", aiText);
      return NextResponse.json({
        error: "Could not parse AI response",
        parseError: parseErr.message,
        rawPreview: aiText ? aiText.substring(0, 800) : "no raw text",
        cleanedPreview: jsonString ? jsonString.substring(0, 800) : "no cleaned text",
        textLength: aiText?.length || 0,
      }, { status: 500 });
    }

    // ── Enhance with database data ────────────────────────────────────────────
    const { data: roleSkills } = await supabase
      .from("role_skills")
      .select("*")
      .eq("role_name", targetRole);

    if (roleSkills?.length) {
      const skillMap = new Map(
        roleSkills.map((row) => [row.skill_name.toLowerCase(), row])
      );

      // Enhance criticalGaps
      if (Array.isArray(result.criticalGaps)) {
        result.criticalGaps = result.criticalGaps.map((gap) => {
          const match = skillMap.get(gap.skill?.toLowerCase());
          if (!match) return gap;
          return {
            ...gap,
            learning_resource_name: match.learning_resource_name ?? null,
            learning_resource_url: match.learning_resource_url ?? null,
            learning_resource_type: match.learning_resource_type ?? null,
            demand_trend: match.demand_trend ?? null,
            dataEnhanced: true,
          };
        });
      }

      // Enhance extractedSkills with demand_trend
      if (Array.isArray(result.extractedSkills)) {
        result.extractedSkills = result.extractedSkills.map((skill) => {
          const match = skillMap.get(skill.skill?.toLowerCase());
          if (!match?.demand_trend) return skill;
          return { ...skill, demand_trend: match.demand_trend };
        });
      }
    }

    if (hasSalaryData) {
      result.salaryBenchmarks = salaryData;
      result.salaryEstimate = null;
    } else {
      result.salaryBenchmarks = [];
      // salaryEstimate is populated by AI in result when DB had no matching data
    }

    // ── Log the scan ─────────────────────────────────────────────────────────
    await supabase.from("skillprint_scans").insert({
      target_role: targetRole,
      market_readiness_score: result.marketReadinessScore,
    });

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
