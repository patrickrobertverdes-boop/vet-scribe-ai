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
        // FIX C6: Detailed error categorization
        console.error("[Gemini SOAP API] ❌ Error:", error.message);

        let userMessage = error.message || "Failed to generate notes";
        let statusCode = 500;

        if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
            userMessage = "API configuration error. Please contact support.";
            statusCode = 503;
        } else if (error.message?.includes('quota') || error.message?.includes('rate') || error.message?.includes('429')) {
            userMessage = "Service temporarily unavailable. Please try again in 1 minute.";
            statusCode = 429;
        } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('ENOTFOUND')) {
            userMessage = "Network error. Please check your connection.";
            statusCode = 503;
        } else if (error.message?.includes('timeout')) {
            userMessage = "Request timed out. Please try again.";
            statusCode = 504;
        }

        return NextResponse.json({
            error: userMessage,
            code: error.code || 'UNKNOWN_ERROR'
        }, { status: statusCode, headers });
    }
}