const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

try {
    const saPath = path.join(process.cwd(), 'service-account.json');
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    let key = sa.private_key;

    // Strategy: Clean and Reformat
    let base64 = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\s/g, '');

    // Wrap at 64 chars
    const wrapped = base64.match(/.{1,64}/g).join('\n');
    const cleanKey = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;

    try {
        crypto.createPrivateKey(cleanKey);
        console.log('Test 3 Passed: Key valid after aggressive reformatting');
        // If passed, update the file
        sa.private_key = cleanKey;
        fs.writeFileSync(saPath, JSON.stringify(sa, null, 2));
    } catch (e) {
        console.log('Test 3 Failed:', e.message);
    }
} catch (e) {
    console.error('Script Error:', e.message);
}
