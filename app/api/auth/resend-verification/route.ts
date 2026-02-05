import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { email, displayName, uid } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app'}/login`,
        };

        const firebaseLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

        // Construct custom premium verification link
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app'}/auth/verify?oobCode=${oobCode}`;

        // PLACEHOLDER: Put your RESEND webhook URL here if it is different
        const n8nWebhookUrl = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                name: displayName || email.split('@')[0],
                verificationLink,
                action: 'resend'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `n8n Error: ${response.status}`, details: errorText }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Resend webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
