import { createClient } from "@deepgram/sdk";

async function testDeepgram() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    console.log("Testing Deepgram key:", apiKey ? `Present (ends in ...${apiKey.slice(-4)})` : "MISSING");

    if (!apiKey) return;

    try {
        const deepgram = createClient(apiKey);
        console.log("Client created. Attempting to list projects...");

        const { result, error } = await deepgram.manage.getProjects();

        if (error) {
            console.error("Deepgram API Error:", error);
        } else {
            console.log("Success! Projects found:", result.projects.length);
        }
    } catch (err) {
        console.error("Deepgram SDK Exception:", err);
    }
}

testDeepgram();
