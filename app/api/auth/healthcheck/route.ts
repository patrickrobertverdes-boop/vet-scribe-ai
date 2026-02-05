import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const correlationId = `health_${Date.now()}`;
    console.log(`[HEALTH-CHECK] [${correlationId}] Connectivity test initiated`);

    try {
        const TEST_WEBHOOK = "https://vbintelligenceblagaverde.app.n8n.cloud/webhook/ad6e1227-ad9a-4483-8bce-720937c9363a";

        console.log(`[HEALTH-CHECK] [${correlationId}] Testing n8n connectivity to: ${TEST_WEBHOOK}`);

        const response = await fetch(TEST_WEBHOOK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Correlation-Id": correlationId,
                "X-Health-Check": "true"
            },
            body: JSON.stringify({
                status: 'ping',
                timestamp: new Date().toISOString(),
                correlationId,
                origin: 'vet-scribe-healthcheck'
            })
        });

        console.log(`[HEALTH-CHECK] [${correlationId}] n8n Response: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n Unreachable: ${response.status} - ${errorText}`);
        }

        return NextResponse.json({
            status: 'online',
            n8n: 'connected',
            correlationId,
            details: `Successfully reached n8n at ${new Date().toISOString()}`
        });

    } catch (error: any) {
        console.error(`[HEALTH-CHECK-FAILURE] [${correlationId}]`, error.message);
        return NextResponse.json({
            status: 'degraded',
            n8n: 'unreachable',
            error: error.message,
            correlationId
        }, { status: 502 });
    }
}
