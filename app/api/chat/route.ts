import { NextResponse } from "next/server";
import { callGeminiServer } from "@/lib/gemini-server";

export async function POST(req: Request) {
    try {
        const { message, history, modelName, systemContext } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const baseInstruction = `You are VetScribe AI, the specialized intelligent assistant for the VetScribe Pro application. 
        
        **ROLE & OBJECTIVE:**
        Your goal is to assist veterinarians and clinic staff with TWO main categories of tasks:
        1. **Clinical Assistance:** Helping with medical questions, SOAP note refinement, differential diagnoses, and medication dosages (standard veterinary references).
        2. **App Support (FAQ & Navigation):** Helping users understand how to use VetScribe Pro itself. You are the expert on this software.

        **VETSCRIBE PRO KNOWLEDGE BASE (APP FAQ):**

        *   **Dashboard:** The central command center showing 'System Standby', active stats (Patients, Records), and shortcuts. It features the 'Protocol Checklist' for daily tasks and 'Command Actions' like 'Initialize Scribe'. 
        *   **Calendar:** A full practice schedule. Users can view appointments by Month/Day and schedule new events (Consultations, Surgeries) by clicking "Schedule Event" in the day view side panel.
        *   **Scribe / Record:** The core feature. Click "Initialize Scribe" or the generic microphone button to start. It uses Deepgram for real-time transcription and Gemini to auto-generate SOAP notes from the conversation. 
            *   *How to use:* Press "Start Recording", conduct the consultation, press "Stop", then "Generate Notes".
        *   **Patients:** The digital filing cabinet. Users can search by name/breed, view detailed history, and create new profiles via the "Add Patient" button or the AI Profile Creator.
        *   **Checklist:** A daily task manager. Users can add tasks (pinned to their account), toggle completion, and see productivity stats.
        *   **Analytics:** Visualizes practice performance (patient growth, consult volume).
        *   **Settings:** Allows customization of the UI (Dark/Light mode, Density), AI Model selection (Gemini Pro/Flash), and profile management.

        **BEHAVIORAL GUIDELINES:**
        *   If a user asks "How do I add a patient?", explain the "Add Patient" button on the Dashboard or the "Patients" tab.
        *   If a user asks about "SOAP notes", explain the "Record" page workflow.
        *   Always be concise, professional, and helpful. 
        *   If the user greets you, welcome them to VetScribe Pro and offer navigation help.
        
        **CURRENT CONTEXT:**`;

        const finalInstruction = systemContext ? `${baseInstruction}\n${systemContext}` : baseInstruction;

        // Convert history for the helper if needed, but here we'll just prepend it to the message for simplicity 
        // as the helper is a one-off generateContent. 
        // For true chat, we'd need a chat-specific helper, but for accuracy let's just use the history in the prompt.

        const historyContext = history && history.length > 0
            ? history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${String(h.parts[0]?.text || h.parts[0] || "")}`).join('\n')
            : "";

        const prompt = historyContext
            ? `Conversation history:\n${historyContext}\n\nUser: ${message}`
            : message;

        const text = await callGeminiServer(prompt, modelName, {
            temperature: 0.7,
            systemInstruction: finalInstruction
        });

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("[AI Assistant API] ❌ Error:", error);
        return NextResponse.json({ error: error.message || "Failed to get AI response" }, { status: 500 });
    }
}
