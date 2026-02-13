import { SoapNote, Patient } from "./types";

export const callGemini = async (transcript: string, modelName: string = "gemini-2.0-flash"): Promise<SoapNote> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript, modelName }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to generate notes via API");
        }

        const data = await response.json();

        return {
            subjective: data.subjective || "Could not generate",
            objective: data.objective || "Could not generate",
            assessment: data.assessment || "Could not generate",
            plan: data.plan || "Could not generate"
        };
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const chatWithGemini = async (message: string, history: { role: string, parts: string[] }[] = [], modelName: string = "gemini-2.0-flash", systemContext?: string): Promise<string> => {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, history, modelName, systemContext }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to get response from AI Assistant");
        }

        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error("Error in chatWithGemini:", error);
        throw new Error(error.message || "Failed to communicate with AI Assistant. Please try again.");
    }
};

export const generatePatientProfile = async (prompt: string): Promise<Partial<Patient>> => {
    try {
        const response = await fetch('/api/patient-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to generate patient profile");
        }

        return await response.json();
    } catch (error: any) {
        console.error("Error generating profile:", error);
        throw error;
    }
};

export const extractStructuredData = async (soapText: string): Promise<{ diagnoses: string[], medications: string[], treatments: string[] }> => {
    try {
        const response = await fetch('/api/extract-structured', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ soapText }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to extract structured data");
        }

        return await response.json();
    } catch (error: any) {
        console.error("Error extracting structured data:", error);
        throw error;
    }
};

