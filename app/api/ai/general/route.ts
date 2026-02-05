import { NextResponse } from "next/server";
import { callGeminiServer } from "@/lib/gemini-server";

export async function POST(req: Request) {
    try {
        const { prompt, modelName = "gemini-2.0-flash", temperature = 0.1 } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const text = await callGeminiServer(prompt, modelName, { temperature });

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("[General AI API] ❌ Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate AI response"
        }, { status: 500 });
    }
}
