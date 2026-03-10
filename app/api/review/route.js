import { NextResponse } from 'next/server';

// Use CommonJS require for pdf-parse as requested
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const PERSONA_SYSTEM_PROMPTS = {
  kind:
    'You are a warm, encouraging career coach who gives constructive feedback with empathy.',
  tough:
    'You are a strict hiring manager at a Fortune 500 company who has reviewed 10,000 resumes and has very high standards.',
  brutal:
    "You are a brutally honest friend who pulls no punches. You're funny, sarcastic, but ultimately helpful.",
};

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get('file');
    const personaRaw = formData.get('persona');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const personaKey =
      typeof personaRaw === 'string' ? personaRaw.toLowerCase() : 'kind';

    const systemPrompt =
      PERSONA_SYSTEM_PROMPTS[personaKey] ?? PERSONA_SYSTEM_PROMPTS.kind;

    // Convert the uploaded PDF (Web File) to a Node Buffer for pdf-parse
    let resumeText;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } catch (err) {
      console.error('PDF parsing error:', err);
      return NextResponse.json(
        { error: 'Could not read PDF' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return NextResponse.json(
        { error: 'AI configuration error' },
        { status: 500 }
      );
    }

    const userPrompt = `Review this resume and provide feedback in the following JSON format. Return ONLY valid JSON, no other text:
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment in your persona's voice>",
  "sections": [
    {
      "name": "<section name like Experience, Education, Skills, etc.>",
      "score": <number 1-10>,
      "feedback": "<2-3 sentences of specific feedback>",
      "rewrite": "<if applicable, a rewritten version of the weakest bullet point in this section, or null>"
    }
  ],
  "topThreeImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "elevatorPitch": "<a strong one-line personal pitch for this person based on their resume>"
}

Here is the resume text:
---
${resumeText}
---`;

    let anthropicJson;
    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!anthropicRes.ok) {
        const errorText = await anthropicRes.text().catch(() => '');
        console.error(
          'Anthropic API error:',
          anthropicRes.status,
          anthropicRes.statusText,
          errorText
        );
        return NextResponse.json(
          { error: 'AI call failed' },
          { status: 500 }
        );
      }

      anthropicJson = await anthropicRes.json();
    } catch (err) {
      console.error('Anthropic API request failed:', err);
      return NextResponse.json(
        { error: 'AI call failed' },
        { status: 500 }
      );
    }

    const contentText =
      anthropicJson?.content?.[0]?.text ??
      anthropicJson?.content?.[0]?.content ??
      '';

    if (!contentText || typeof contentText !== 'string') {
      console.error('Unexpected Anthropic response shape:', anthropicJson);
      return NextResponse.json(
        { error: 'AI response was empty or invalid' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(contentText);
    } catch (err) {
      // Fallback: try to extract JSON between the first "{" and last "}"
      try {
        const start = contentText.indexOf('{');
        const end = contentText.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) {
          throw new Error('No JSON object found in AI response');
        }
        const jsonSlice = contentText.slice(start, end + 1);
        parsed = JSON.parse(jsonSlice);
      } catch (innerErr) {
        console.error('Failed to parse AI JSON response:', {
          originalError: err,
          extractionError: innerErr,
          contentText,
        });
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Unexpected error in review route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

