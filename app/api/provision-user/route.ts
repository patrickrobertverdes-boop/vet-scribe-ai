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
        const emailVerified = decodedToken.email_verified;

        console.log(`[PROVISION] [${correlationId}] Token Verified. UID: ${uid}, Email: ${email}, Verified: ${emailVerified}`);

        if (!email || !emailVerified) {
            console.warn(`[PROVISION] [${correlationId}] Provisioning halted: Email missing or not verified`);
            return NextResponse.json({ error: 'Clinical identity incomplete or unverified', correlationId }, { status: 403 });
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

        await userRef.set(provisionData, { merge: true });
        console.log(`[PROVISION] [${correlationId}] Firestore document provisioned successfully`);

        // 4. Set Custom Claims
        console.log(`[PROVISION] [${correlationId}] Setting custom claims...`);
        await adminAuth.setCustomUserClaims(uid, {
            role: 'owner',
            verified: true
        });

        // 5. DISPATCH TO n8n (Server-side only per architecture requirement)
        console.log(`[PROVISION] [${correlationId}] Dispatching status update to n8n...`);
        const N8N_WEBHOOK_URL = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        try {
            const n8nRes = await fetch(N8N_WEBHOOK_URL, {
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

            if (!n8nRes.ok) {
                console.warn(`[PROVISION] [${correlationId}] n8n notification failed: ${n8nRes.status}`);
            } else {
                console.log(`[PROVISION] [${correlationId}] n8n notification successful`);
            }
        } catch (webhookErr: any) {
            console.error(`[PROVISION] [${correlationId}] n8n fetch error:`, webhookErr.message);
            // We don't fail the whole request if n8n is down, as Firestore is already provisioned
        }

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'User provisioned successfully with fresh claims and n8n notification'
        });

    } catch (error: any) {
        console.error(`[PROVISION-FATAL] [${correlationId}]`, error.message);
        return NextResponse.json({
            error: error.message || 'Internal Provisioning Error',
            correlationId
        }, { status: 500 });
    }
}
