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

            // Parse Date & Time
            const startDate = new Date(e.start);
            const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = startDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            batch.set(docRef, {
                ...e,
                // Frontend Compatibility Mappings
                id: e.externalId,
                date: dateStr,
                time: timeStr,
                patientName: `Patient #${e.patientId}`, // Fallback
                classification: 'Consultation', // Default class
                note: e.title || e.note || 'Synced Appointment',
                vector: 'clinic',
                status: e.status || 'scheduled',
                start: startDate.toISOString(),
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
