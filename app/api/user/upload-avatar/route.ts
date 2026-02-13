import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminStorage, getAdminDb } from '@/lib/firebase-admin';

/**
 * PRO-TIER: Dedicated Avatar Upload Endpoint
 * Handles both Multipart (for efficiency) and Base64 (for Capacitor compatibility)
 */
export async function POST(req: NextRequest) {
    const correlationId = `avatar_upload_${Date.now()}`;
    console.log(`[UPLOAD] [${correlationId}] Initiating avatar synchronization...`);

    try {
        // 1. Authenticate Request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.error(`[UPLOAD] [${correlationId}] Missing or invalid Authorization header`);
            return NextResponse.json({ error: 'Unauthorized: Missing Token', correlationId }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        console.log(`[UPLOAD] [${correlationId}] Request verified for UID: ${uid}`);

        // 2. Identify and Parse Payload (Multipart vs Base64)
        const contentType = req.headers.get('content-type') || '';
        let buffer: Buffer;
        let mimeType = 'image/jpeg';

        if (contentType.includes('multipart/form-data')) {
            console.log(`[UPLOAD] [${correlationId}] Decoding Multipart/Form-Data...`);
            const formData = await req.formData();
            const file = formData.get('file') as File;
            if (!file) throw new Error("File missing in multipart payload");

            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            mimeType = file.type || 'image/jpeg';
        } else {
            console.log(`[UPLOAD] [${correlationId}] Decoding Base64/JSON payload...`);
            const body = await req.json();
            const base64 = body.image || body.base64;
            if (!base64) throw new Error("Image data missing in JSON payload");

            // Handle potential data URL prefix
            const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
            buffer = Buffer.from(base64Data, 'base64');
            mimeType = body.mimeType || 'image/jpeg';
        }

        console.log(`[UPLOAD] [${correlationId}] Buffer generated. Size: ${buffer.length} bytes`);

        // 3. Upload to Firebase Storage via Admin SDK
        const timestamp = Date.now();
        const filename = `avatar_${timestamp}.jpg`;
        const bucket = getAdminStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const fileRef = bucket.file(`users/${uid}/profile/${filename}`);

        await fileRef.save(buffer, {
            metadata: {
                contentType: mimeType,
                metadata: {
                    uploadedBy: uid,
                    correlationId
                }
            },
            public: true // Optional: depending on your security rules
        });

        // Get public URL or signed URL (Public preferred for avatars)
        const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
        console.log(`[UPLOAD] [${correlationId}] Storage success. Path: ${fileRef.name}`);

        // 4. Update Atomic Identity (Firestore + Auth Profile)
        console.log(`[UPLOAD] [${correlationId}] Synchronizing identity records...`);

        const updateTasks = [
            getAdminDb().collection('users').doc(uid).set({
                image: url,
                updatedAt: new Date()
            }, { merge: true }),
            getAdminAuth().updateUser(uid, { photoURL: url })
        ];

        await Promise.all(updateTasks);

        console.log(`[UPLOAD] [${correlationId}] Profile synchronized successfully. URL: ${url}`);

        return NextResponse.json({
            success: true,
            url,
            correlationId
        });

    } catch (error: any) {
        console.error(`[UPLOAD-FATAL] [${correlationId}]`, error.message);
        return NextResponse.json({
            error: error.message || 'Avatar synchronization failed',
            status: error.status || 500,
            correlationId
        }, { status: error.status || 500 });
    }
}
