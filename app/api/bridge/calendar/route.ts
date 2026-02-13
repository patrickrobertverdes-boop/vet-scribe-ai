import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || 'dev_key';

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== BRIDGE_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { events } = await req.json();

        if (!Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid payload: events must be an array' }, { status: 400 });
        }

        const db = getAdminDb();
        const batch = db.batch();
        let operationCount = 0;

        for (const e of events) {
            if (operationCount >= 490) break;

            const docRef = db.collection('calendar_events').doc(e.externalId);

            batch.set(docRef, {
                ...e,
                start: new Date(e.start).toISOString(), // Ensure date is ISO string
                lastSyncedAt: new Date().toISOString(),
                source: 'avimark'
            }, { merge: true });

            operationCount++;
        }

        await batch.commit();

        return NextResponse.json({ success: true, count: operationCount });
    } catch (error: any) {
        console.error('Error syncing calendar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
