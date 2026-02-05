import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function callGeminiServer(prompt: string, modelName: string = "gemini-2.0-flash", options: { temperature?: number, maxTokens?: number, systemInstruction?: string } = {}) {
    if (!genAI) {
        throw new Error("Gemini API key not configured on server");
    }

    // Force gemini-2.0-flash for all non-pro requests to ensure stability
    let targetModel = "gemini-2.0-flash";
    if (modelName.includes("pro") || modelName === "gemini-1.5-pro") {
        targetModel = "gemini-1.5-pro";
    }

    console.log(`[Gemini Server] Using model: ${targetModel}`);

    const model = genAI.getGenerativeModel({
        model: targetModel,
        systemInstruction: options.systemInstruction
    });

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: options.temperature ?? 0.1,
            maxOutputTokens: options.maxTokens ?? 2048,
        }
    });

    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
        throw new Error("Gemini returned an empty response. This might be due to safety filters.");
    }

    return text;
}
