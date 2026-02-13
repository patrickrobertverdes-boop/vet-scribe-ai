const fs = require('fs');
const path = require('path');
const os = require('os');

// Standard install locations for Avimark (add more as needed)
const CANDIDATE_PATHS = [
    'C:/Avimark/Data',
    'D:/Avimark/Data',
    'E:/Avimark/Data',
    'C:/PMS/Data',      // Often used as a generic PMS root
    'D:/PMS/Data',
    'E:/PMS/Data',
    path.join(__dirname, '../mock_avimark/Data')
];

function findAvimarkPath() {
    console.log('🔍 Scanning for Avimark installation...');

    for (const candidate of CANDIDATE_PATHS) {
        if (fs.existsSync(candidate)) {
            // Validate it actually contains Avimark files
            const clientFile = path.join(candidate, 'Client.dbf');
            const patientFile = path.join(candidate, 'Patient.dbf');

            if (fs.existsSync(clientFile) || fs.existsSync(patientFile)) {
                console.log(`✅ FOUND Avimark Data at: ${candidate}`);
                return candidate;
            }
        }
    }

    console.log('❌ Could not automatically detect Avimark.');
    return null;
}

// Run if called directly
if (require.main === module) {
    const foundPath = findAvimarkPath();
    if (foundPath) {
        console.log(`\n🎉 Mock Success! The installer would verify this path and start syncing immediately.`);
    } else {
        console.log(`\n⚠️ Fallback: Please select the folder where Avimark is installed.`);
    }
}

module.exports = { findAvimarkPath };
