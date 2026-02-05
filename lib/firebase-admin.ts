import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

function getAdminApp() {
    if (admin.apps.length > 0) return admin.app();

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

    try {
        if (fs.existsSync(serviceAccountPath)) {
            console.log('--- Firebase Admin: Local File Mode ---');
            const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

            // Normalize private key newlines
            if (sa.private_key) {
                sa.private_key = sa.private_key.replace(/\\n/g, '\n');
            }

            return admin.initializeApp({
                credential: admin.credential.cert(sa),
                projectId: projectId
            });
        }
    } catch (e) {
        console.error('--- Firebase Admin: Local File Error ---', e);
    }

    // Fallback to ADC if file missing or fails
    return admin.initializeApp({
        projectId: projectId,
    });
}

const app = getAdminApp();

export const adminAuth = app.auth();
export const adminDb = app.firestore();
export const adminStorage = app.storage();
