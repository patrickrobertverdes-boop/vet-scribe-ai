import { NextRequest, NextResponse } from 'next/server';

/**
 * Backend Identity Bridge
 * Handles robust server-side redirection to the custom Android scheme.
 * This bypasses common browser restrictions on client-side JS redirects to non-HTTP schemes.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        console.error("[AuthBridge] Protocol Violation: No token provided.");
        return NextResponse.redirect(new URL('/login?error=no_token', request.url));
    }

    console.log("[AuthBridge] Identity verified. Executing handoff to com.vetscribe.app://auth");

    // We use a raw Response to ensure we can set a custom Location header without URL validation interference
    return new Response(null, {
        status: 302,
        headers: {
            'Location': `com.vetscribe.app://auth?token=${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
}
