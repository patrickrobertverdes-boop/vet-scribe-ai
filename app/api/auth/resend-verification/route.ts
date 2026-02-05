import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const correlationId = `resend_${Date.now()}`;
    console.log(`[ENTRY] [${correlationId}] Resend Webhook Route Entered`);

    try {
        // 1. Environment Sanity Check
        const WEBHOOK_URL = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/2da4cd33-aee8-422c-bc07-d5826e915e7c";
        const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app';

        console.log(`[ENV-CHECK] [${correlationId}] App URL: ${PUBLIC_URL}`);

        if (!PUBLIC_URL) {
            throw new Error(`CRITICAL: NEXT_PUBLIC_APP_URL is missing or undefined for [${correlationId}]`);
        }

        // 2. Body Parsing
        const body = await req.json();
        const { email, displayName, uid } = body;

        console.log(`[PAYLOAD] [${correlationId}] Processing resend for: ${email} (UID: ${uid})`);

        if (!email || !uid) {
            console.error(`[VALIDATION-ERROR] [${correlationId}] Missing required identity fields`);
            return NextResponse.json({ error: 'Identity incomplete: Email and UID required', correlationId }, { status: 400 });
        }

        // 3. Link Generation
        console.log(`[FIREBASE-LINK] [${correlationId}] Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'verdes-8568d'}`);
        console.log(`[FIREBASE-LINK] [${correlationId}] Resend Continue URL: ${PUBLIC_URL}/login`);

        const actionCodeSettings = {
            // Reverting to preferred domain as user confirmed authorization
            url: `${PUBLIC_URL}/login`,
        };

        const firebaseLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
        console.log(`[FIREBASE-LINK] [${correlationId}] Raw Link Generated Successfully`);

        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');

        if (!oobCode) {
            throw new Error(`SECURITY-TOKEN-ERROR: Could not extract oobCode for [${correlationId}]`);
        }

        const verificationLink = `${PUBLIC_URL}/auth/verify?oobCode=${oobCode}`;
        console.log(`[FINAL-LINK] [${correlationId}] Clinical Verification Link: ${verificationLink}`);

        // 4. n8n Dispatch
        console.log(`[N8N-DISPATCH] [${correlationId}] Attempting resend webhook request to n8n...`);
        const timestamp = new Date().toISOString();

        const n8nBody = {
            email,
            name: displayName || email.split('@')[0],
            uid,
            verificationLink,
            action: 'resend',
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
        console.log(`[SUCCESS] [${correlationId}] n8n confirmed resend receipt. Payload: ${responseData}`);

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'Resend verification confirmed by backend'
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
