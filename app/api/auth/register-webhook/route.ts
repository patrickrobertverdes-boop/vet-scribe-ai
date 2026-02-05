import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { email, displayName, uid, action = 'signup' } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Generate verification link using Firebase Admin
        const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vets-scribe.web.app'}/login`,
        };

        let verificationLink;
        try {
            verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
        } catch (linkError: any) {
            console.error('Firebase Admin Link Error:', linkError);
            return NextResponse.json({
                error: `Firebase Admin Error: ${linkError.message}`,
                code: linkError.code
            }, { status: 500 });
        }

        // POST to n8n webhook
        const n8nWebhookUrl = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                name: displayName || email.split('@')[0],
                verificationLink,
                action
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('n8n webhook error response:', errorText);
            return NextResponse.json({
                error: `n8n Error: ${response.status} ${response.statusText}`,
                details: errorText
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Registration webhook error:', error);
        // Return the specific error message to help debugging
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
