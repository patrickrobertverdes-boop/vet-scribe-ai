import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const correlationId = `signup_${Date.now()}`;
    console.log(`[ENTRY] [${correlationId}] Auth Webhook Route Entered`);

    try {
        // 1. Environment Sanity Check
        const WEBHOOK_URL = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";
        const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vet-scribe-a2i--verdes-8568d.us-east4.hosted.app';

        console.log(`[ENV-CHECK] [${correlationId}] App URL: ${PUBLIC_URL}`);
        console.log(`[ENV-CHECK] [${correlationId}] NODE_ENV: ${process.env.NODE_ENV}`);

        if (!PUBLIC_URL) {
            throw new Error(`CRITICAL: NEXT_PUBLIC_APP_URL is missing or undefined for [${correlationId}]`);
        }

        // 2. Body Parsing
        const body = await req.json();
        const { email, displayName, uid } = body;

        console.log(`[PAYLOAD] [${correlationId}] Processing signup for: ${email} (UID: ${uid})`);

        if (!email || !uid) {
            console.error(`[VALIDATION-ERROR] [${correlationId}] Missing required identity fields`);
            return NextResponse.json({ error: 'Identity incomplete: Email and UID required', correlationId }, { status: 400 });
        }

        // 3. Link Generation
        console.log(`[FIREBASE-LINK] [${correlationId}] Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'verdes-8568d'}`);
        console.log(`[FIREBASE-LINK] [${correlationId}] Verification Continue URL: ${PUBLIC_URL}/login`);

        const actionCodeSettings = {
            // FORCE Bypassing allowlist check by using the built-in Project Domain
            // This URL is purely for Firebase metadata and is never seen by the user.
            url: `https://verdes-8568d.firebaseapp.com`,
        };

        const firebaseLink = await getAdminAuth().generateEmailVerificationLink(email, actionCodeSettings);
        console.log(`[FIREBASE-LINK] [${correlationId}] Raw Link Generated Successfully`);

        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');

        if (!oobCode) {
            throw new Error(`SECURITY-TOKEN-ERROR: Could not extract oobCode for [${correlationId}]`);
        }

        const verificationLink = `${PUBLIC_URL}/auth/verify?oobCode=${oobCode}`;
        console.log(`[FINAL-LINK] [${correlationId}] Clinical Verification Link: ${verificationLink}`);

        // 4. n8n Dispatch
        console.log(`[N8N-DISPATCH] [${correlationId}] Attempting webhook request to n8n...`);
        const timestamp = new Date().toISOString();

        const n8nBody = {
            email,
            name: displayName || email.split('@')[0],
            uid,
            verificationLink,
            action: 'signup',
            timestamp,
            correlationId,
            origin: 'server-api'
        };

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Correlation-Id": correlationId,
                "X-Origin": "vet-scribe-server"
            },
            body: JSON.stringify(n8nBody)
        });

        console.log(`[N8N-RESPONSE] [${correlationId}] Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[N8N-FAILURE] [${correlationId}] Response Body:`, errorText);
            throw new Error(`Webhook Delivery Failed: ${response.status} - ${errorText}`);
        }

        const responseData = await response.text();
        console.log(`[SUCCESS] [${correlationId}] n8n confirmed receipt. Payload: ${responseData}`);

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'Verification dispatch confirmed by backend'
        });

    } catch (error: any) {
        console.error(`[FATAL-ROUTE-ERROR] [${correlationId}]`, error.message);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.stack,
            correlationId
        }, { status: 500 });
    }
}
