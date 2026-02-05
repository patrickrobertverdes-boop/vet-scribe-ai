const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

try {
    const saPath = path.join(process.cwd(), 'service-account.json');
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    let key = sa.private_key;

    let base64 = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\s/g, '');

    console.log('Original Base64 Length:', base64.length);

    for (let pad = 0; pad <= 2; pad++) {
        let currentBase64 = base64 + '='.repeat(pad);
        const wrapped = currentBase64.match(/.{1,64}/g).join('\n');
        const testKey = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;

        try {
            crypto.createPrivateKey(testKey);
            console.log(`Test with ${pad} equals passed!`);
            process.exit(0);
        } catch (e) {
            console.log(`Test with ${pad} equals failed:`, e.message);
        }
    }
} catch (e) {
    console.error('Script Error:', e.message);
}
