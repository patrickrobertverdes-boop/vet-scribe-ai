import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Simple API Key check
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || 'dev_key';

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== BRIDGE_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { patients } = await req.json();

        if (!Array.isArray(patients)) {
            return NextResponse.json({ error: 'Invalid payload: patients must be an array' }, { status: 400 });
        }

        const db = getAdminDb();
        const batch = db.batch();
        let operationCount = 0;

        // Process in chunks of 500 (Firestore batch limit)
        // For now, we'll just take the first 500 to keep it simple, or implement chunking logic if needed.
        // In a real scenario with thousands of patients, we'd need a more robust queuing system.

        for (const p of patients) {
            if (operationCount >= 490) break; // Safety buffer

            // Use externalId (Avimark ID) as the document ID or a field to query against.
            // Using it as Doc ID makes updates easier: idempotent.
            const docRef = db.collection('patients').doc(p.externalId);

            batch.set(docRef, {
                ...p,
                lastSyncedAt: new Date().toISOString(),
                source: 'avimark'
            }, { merge: true });

            operationCount++;
        }

        await batch.commit();

        return NextResponse.json({ success: true, count: operationCount });
    } catch (error: any) {
        console.error('Error syncing patients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
