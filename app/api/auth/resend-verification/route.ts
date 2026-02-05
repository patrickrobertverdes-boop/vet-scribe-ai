import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const correlationId = `resend_${Date.now()}`;
    console.log(`[Auth-Webhook] [${correlationId}] Starting resend verification flow`);

    try {
        const { email, displayName, uid } = await req.json();

        if (!email) {
            console.error(`[Auth-Webhook] [${correlationId}] Missing email in request`);
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log(`[Auth-Webhook] [${correlationId}] Generating verification link for: ${email}`);

        const appUrl = process.env.NODE_ENV === 'production'
            ? 'https://vets-scribe.web.app'
            : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

        const actionCodeSettings = {
            url: `${appUrl}/login`,
        };

        const firebaseLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

        // Construct custom premium verification link
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');

        if (!oobCode) {
            console.error(`[Auth-Webhook] [${correlationId}] Failed to extract oobCode from Firebase link`);
            return NextResponse.json({ error: 'Failed to generate security token', correlationId }, { status: 500 });
        }

        const verificationLink = `${appUrl}/auth/verify?oobCode=${oobCode}`;

        // Resend verification webhook (PROD) - DISTINCT from signup
        const n8nWebhookUrl = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/2da4cd33-aee8-422c-bc07-d5826e915e7c";

        console.log(`[Auth-Webhook] [${correlationId}] Dispatching n8n resend webhook. Email: ${email}`);

        const timestamp = new Date().toISOString();
        const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Correlation-Id": correlationId
            },
            body: JSON.stringify({
                email,
                name: displayName || email.split('@')[0],
                uid,
                verificationLink,
                action: 'resend',
                timestamp,
                correlationId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Auth-Webhook] [${correlationId}] n8n delivery failed: ${response.status}`, errorText);
            return NextResponse.json({
                error: `n8n Webhook Error: ${response.status}`,
                details: errorText,
                correlationId
            }, { status: 500 });
        }

        console.log(`[Auth-Webhook] [${correlationId}] Webhook confirmed by n8n`);
        return NextResponse.json({ success: true, correlationId });
    } catch (error: any) {
        console.error(`[Auth-Webhook] [${correlationId}] Fatal route error:`, error);
        return NextResponse.json({ error: `Internal error: ${error.message}`, correlationId }, { status: 500 });
    }
}
