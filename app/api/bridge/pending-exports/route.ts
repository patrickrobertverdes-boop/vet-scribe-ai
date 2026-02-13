import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || 'dev_key';

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== BRIDGE_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getAdminDb();
        const pendingRef = db.collection('bridge_queue').where('status', '==', 'pending').limit(10);
        const snapshot = await pendingRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ commands: [] });
        }

        const commands = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // After fetching, we should mark them as 'processing' or 'fetched' so they aren't picked up again immediately.
        // Or implement an "ACK" flow. For simplicity here, we'll return them, but in a real app, an ACK is better.
        // Let's assume the connector will successfully process them and maybe we mark them 'processing' now.

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'fetched', fetchedAt: new Date().toISOString() });
        });
        await batch.commit();

        return NextResponse.json({ commands });
    } catch (error: any) {
        console.error('Error fetching export commands:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
