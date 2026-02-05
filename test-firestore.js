const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const saPath = path.join(process.cwd(), 'service-account.json');
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(sa),
                projectId: sa.project_id
            });
        }

        console.log('App Initialized. Testing Firestore Write...');
        const db = admin.firestore();
        const testRef = db.collection('_diagnostic').doc('test');

        await testRef.set({
            timestamp: new Date().toISOString(),
            test: true
        });

        console.log('Firestore Write Test: SUCCESS');

        // Clean up
        await testRef.delete();
        console.log('Firestore Delete Test: SUCCESS');

    } catch (e) {
        console.log('Firestore Test: FAILED');
        console.log('Error Code:', e.code);
        console.log('Error Message:', e.message);
    }
}

test();
