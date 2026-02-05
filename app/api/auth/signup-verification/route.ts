import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const correlationId = `signup_${Date.now()}`;
    console.log(`[Auth-Webhook] [${correlationId}] Starting signup verification flow`);

    try {
        const { email, displayName, uid } = await req.json();

        if (!email) {
            console.error(`[Auth-Webhook] [${correlationId}] Missing email in request`);
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log(`[Auth-Webhook] [${correlationId}] Generating verification link for: ${email}`);

        // Generate verification link using Firebase Admin
        const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app'}/login`,
        };

        const firebaseLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

        // Construct custom premium verification link for optimal UX
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app'}/auth/verify?oobCode=${oobCode}`;

        // Signup verification webhook (PROD)
        const n8nWebhookUrl = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        console.log(`[Auth-Webhook] [${correlationId}] Dispatching n8n signup webhook...`);

        const timestamp = new Date().toISOString();
        const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                name: displayName || email.split('@')[0],
                uid,
                verificationLink,
                action: 'signup',
                timestamp,
                correlationId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Auth-Webhook] [${correlationId}] n8n delivery failed: ${response.status}`, errorText);
            return NextResponse.json({
                error: `Webhook delivery failed: ${response.status}`,
                details: errorText,
                correlationId
            }, { status: 500 });
        }

        console.log(`[Auth-Webhook] [${correlationId}] Webhook dispatched successfully`);
        return NextResponse.json({ success: true, correlationId });
    } catch (error: any) {
        console.error(`[Auth-Webhook] [${correlationId}] Execution error:`, error);
        return NextResponse.json({ error: error.message, correlationId }, { status: 500 });
    }
}
