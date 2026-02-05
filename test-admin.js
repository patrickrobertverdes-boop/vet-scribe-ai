const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const saPath = path.join(process.cwd(), 'service-account.json');
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(sa),
            projectId: sa.project_id
        });

        console.log('App Initialized. Testing Auth...');

        // This will trigger the private key parsing
        await admin.auth().createCustomToken('test-uid');
        console.log('Auth Test: SUCCESS (Token generated)');
    } catch (e) {
        console.log('Auth Test: FAILED');
        console.log('Error Message:', e.message);
    }
}

test();
