import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const correlationId = `provision_${Date.now()}`;
    console.log(`[PROVISION] [${correlationId}] Provisioning Request Received`);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.error(`[PROVISION] [${correlationId}] Missing or invalid Authorization header`);
            return NextResponse.json({ error: 'Unauthorized', correlationId }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // 1. Verify ID Token
        console.log(`[PROVISION] [${correlationId}] Verifying ID Token...`);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        console.log(`[PROVISION] [${correlationId}] Token Verified. UID: ${uid}, Email: ${email}`);

        // Gate removed: Verification no longer mandatory for provisioning
        if (!email) {
            console.warn(`[PROVISION] [${correlationId}] Provisioning halted: Email missing`);
            return NextResponse.json({ error: 'Clinical identity incomplete', correlationId }, { status: 400 });
        }

        // 2. Body parsing for optional metadata
        const body = await req.json().catch(() => ({}));
        const { firstName, lastName, displayName } = body;

        // 3. Provision Firestore Document
        console.log(`[PROVISION] [${correlationId}] Creating/Updating Firestore document...`);
        const userRef = adminDb.collection('users').doc(uid);

        const provisionData: any = {
            email: email,
            uid: uid,
            updatedAt: new Date(),
            provisionedAt: new Date(),
            role: 'owner', // Default role
            status: 'active'
        };

        if (firstName) provisionData.firstName = firstName;
        if (lastName) provisionData.lastName = lastName;
        if (displayName) provisionData.displayName = displayName;

        // Bypassing security rules via Admin SDK
        await userRef.set(provisionData, { merge: true });
        console.log(`[PROVISION] [${correlationId}] Firestore document provisioned successfully`);

        // 4. Set Custom Claims
        console.log(`[PROVISION] [${correlationId}] Setting custom claims...`);
        await adminAuth.setCustomUserClaims(uid, {
            role: 'owner',
            verified: true
        });

        // 5. DISPATCH TO n8n
        const N8N_WEBHOOK_URL = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        try {
            await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    uid,
                    displayName: displayName || `${firstName} ${lastName}`.trim() || email.split('@')[0],
                    action: 'provisioned',
                    status: 'active',
                    timestamp: new Date().toISOString(),
                    correlationId
                })
            });
        } catch (webhookErr: any) {
            console.error(`[PROVISION] [${correlationId}] n8n notification failed:`, webhookErr.message);
        }

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'User provisioned successfully'
        });

    } catch (error: any) {
        console.error(`[PROVISION-FATAL] [${correlationId}]`, error.message);
        return NextResponse.json({
            error: error.message || 'Internal Provisioning Error',
            correlationId
        }, { status: 500 });
    }
}
