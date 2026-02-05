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

    console.log('Base64 Length:', base64.length);

    try {
        const buf = Buffer.from(base64, 'base64');
        console.log('Buffer Length:', buf.length);
        console.log('Decoded successfully? Yes');
    } catch (e) {
        console.log('Base64 Decode Failed:', e.message);
    }
} catch (e) {
    console.error('Script Error:', e.message);
}
