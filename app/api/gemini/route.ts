import { NextResponse } from "next/server";
import { callGeminiServer } from "@/lib/gemini-server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log('[Gemini API] 📨 SOAP Request received');

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers });
    }

    try {
        const { transcript, modelName } = await req.json();

        if (!transcript || transcript.trim().length < 5) {
            return NextResponse.json({ error: "A valid transcript is required." }, { status: 400, headers });
        }

        const prompt = `You are an expert veterinary scribe. 
Convert the following consultation transcript into a structured SOAP note.

Transcript:
"${transcript}"

Return ONLY a valid JSON object with these exact keys: "subjective", "objective", "assessment", "plan". 
Each value should be a clear, concise string.
Do not use markdown formatting, code blocks, or any wrapper text.`;

        const text = await callGeminiServer(prompt, modelName, { temperature: 0.1 });

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI returned invalid format (No JSON found)");
        }

        const json = JSON.parse(jsonMatch[0]);

        if (!json.subjective || !json.objective || !json.assessment || !json.plan) {
            throw new Error("AI returned incomplete SOAP fields");
        }

        return NextResponse.json(json, { headers });

    } catch (error: any) {
        console.error("[Gemini SOAP API] ❌ Error:", error.message);
        return NextResponse.json({
            error: error.message || "Failed to generate notes",
        }, { status: 500, headers });
    }
}