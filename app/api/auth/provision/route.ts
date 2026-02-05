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

        if (!emailVerified) {
            console.warn(`[PROVISION] [${correlationId}] Provisioning halted: Email not verified`);
            return NextResponse.json({ error: 'Email verification required for provisioning', correlationId }, { status: 403 });
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

        // 4. Set Custom Claims (Optional but recommended for robust rules)
        console.log(`[PROVISION] [${correlationId}] Setting custom claims...`);
        await adminAuth.setCustomUserClaims(uid, {
            role: 'owner',
            verified: true
        });

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'User provisioned successfully with fresh claims'
        });

    } catch (error: any) {
        console.error(`[PROVISION-FATAL] [${correlationId}]`, error.message);
        return NextResponse.json({
            error: error.message || 'Internal Provisioning Error',
            correlationId
        }, { status: 500 });
    }
}
