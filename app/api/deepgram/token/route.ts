import { NextResponse } from 'next/server';

export async function GET() {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

    if (!DEEPGRAM_API_KEY) {
        console.error('[Deepgram Token] DEEPGRAM_API_KEY is not defined in environment variables');
        return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
    }

    try {
        return NextResponse.json({ apiKey: DEEPGRAM_API_KEY.trim() });
    } catch (error) {
        console.error('[Deepgram Token] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
