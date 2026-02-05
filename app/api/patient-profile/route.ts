import { NextResponse } from "next/server";
import { callGeminiServer } from "@/lib/gemini-server";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const fullPrompt = `
    You are an expert veterinary practice manager. 
    Create a detailed patient profile from the following description.
    
    Description:
    "${prompt}"

    Return ONLY a raw JSON object with keys: 
    "name", "species", "breed", "age", "age_months", "weight", "owner", "allergies" (array), "medications" (array), "historySummary".
    
    Guidelines:
    - If Name is missing, use "Unnamed".
    - Use "Canine", "Feline", etc. for species. Default to "Canine" if unclear.
    - If breed is missing, use "Mixed".
    - age and age_months should be numbers. Default to 0 if unknown.
    - weight should be a number (lbs). Default to 0 if unknown.
    - If a field is unknown, use an empty string or empty array.
    - Return ONLY the JSON object. No markdown, no extra text.
  `;

        const text = await callGeminiServer(fullPrompt, "gemini-2.0-flash", { temperature: 0.1 });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI returned invalid format for patient profile.");
        }

        return NextResponse.json(JSON.parse(jsonMatch[0]));

    } catch (error: any) {
        console.error("[Patient Profile API] ❌ Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate patient profile" }, { status: 500 });
    }
}
