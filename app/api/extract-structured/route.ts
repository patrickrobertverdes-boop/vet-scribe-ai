import { NextResponse } from "next/server";
import { callGeminiServer } from "@/lib/gemini-server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log('[Extract Structured API] 📨 Request received');

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
        const { soapText } = await req.json();

        if (!soapText || soapText.trim().length < 5) {
            return NextResponse.json({ error: "Valid SOAP text is required." }, { status: 400, headers });
        }

        const prompt = `You are a veterinary clinical data extraction specialist.

Extract structured clinical information from this SOAP note. Be precise and extract EXACTLY what the patient has/received.

SOAP Note:
"""
${soapText}
"""

Extract the following:

1. **Diagnoses**: Medical conditions identified (from Assessment section)
   - Include primary and differential diagnoses
   - Use proper medical terminology
   - Example: ["Gastroenteritis", "Dehydration - mild", "Suspected dietary indiscretion"]

2. **Medications**: Pharmaceutical drugs prescribed or administered
   - Include drug name, dosage, frequency, and duration
   - Example: ["Metronidazole 250mg PO BID x 5 days", "Cerenia 16mg SQ once", "Famotidine 10mg PO SID x 7 days"]

3. **Treatments**: Non-pharmaceutical interventions and procedures
   - Include fluids, diagnostics, procedures, diet changes
   - Example: ["Subcutaneous fluids 200ml LRS", "Bland diet (boiled chicken and rice)", "Fecal flotation performed"]

Return ONLY a valid JSON object with these exact keys:
{
  "diagnoses": [...],
  "medications": [...],
  "treatments": [...]
}

If any category is empty, return an empty array for that key.
Do not use markdown formatting, code blocks, or any wrapper text. Return ONLY the JSON object.`;

        const text = await callGeminiServer(prompt, "gemini-2.0-flash", { temperature: 0.1 });

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI returned invalid format (No JSON found)");
        }

        const json = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(json.diagnoses) || !Array.isArray(json.medications) || !Array.isArray(json.treatments)) {
            throw new Error("AI returned invalid structure");
        }

        return NextResponse.json(json, { headers });

    } catch (error: any) {
        console.error("[Extract Structured API] ❌ Error:", error.message);

        let userMessage = error.message || "Failed to extract structured data";
        let statusCode = 500;

        if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
            userMessage = "API configuration error. Please contact support.";
            statusCode = 503;
        } else if (error.message?.includes('quota') || error.message?.includes('rate') || error.message?.includes('429')) {
            userMessage = "Service temporarily unavailable. Please try again in 1 minute.";
            statusCode = 429;
        }

        return NextResponse.json({
            error: userMessage,
            code: error.code || 'UNKNOWN_ERROR'
        }, { status: statusCode, headers });
    }
}
