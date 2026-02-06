import * as admin from 'firebase-admin';

function getAdminApp() {
    if (admin.apps.length > 0) return admin.app();

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // 1. Try Service Account File (Local Development Only)
    // We skip this if running on Cloud Run/Firebase App Hosting (detected via K_SERVICE)
    if (!process.env.K_SERVICE) {
        try {
            const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'service-account.json';
            if (require('fs').existsSync(saPath)) {
                const sa = JSON.parse(require('fs').readFileSync(saPath, 'utf8'));
                console.log(`[Firebase-Admin] Initializing with Service Account: ${projectId}`);
                return admin.initializeApp({
                    credential: admin.credential.cert(sa),
                    projectId
                });
            }
        } catch (e) {
            // Silent fail on local file check
        }
    }

    // 2. Try Environment Variable Service Account
    try {
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (saJson) {
            const sa = JSON.parse(saJson);
            console.log(`[Firebase-Admin] Initializing with Env SA: ${projectId}`);
            return admin.initializeApp({
                credential: admin.credential.cert(sa),
                projectId
            });
        }
    } catch (e) {
        // Silent fail
    }

    // 3. Fallback to Application Default Credentials (ADC) - Best for Google Cloud/Firebase App Hosting
    console.log(`[Firebase-Admin] Initializing with ADC: ${projectId}`);
    return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId
    });
}

const app = getAdminApp();

export const adminAuth = app.auth();
export const adminDb = app.firestore();
export const adminStorage = app.storage();
