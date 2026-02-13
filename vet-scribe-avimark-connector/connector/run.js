const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { findAvimarkPath } = require('./auto_detect');

// Configuration
const SHADOW_DIR = path.join(__dirname, '../shadow_data');
const SYNC_INTERVAL_MS = 10000; // Check every 10 seconds for demo

async function runConnector() {
    console.log('🤖 VetScribe Connector Service Starting...');

    // 1. Auto-Detect Source
    const sourcePath = findAvimarkPath();
    if (!sourcePath) {
        console.error('CRITICAL: Cannot find Avimark data source. Exiting.');
        process.exit(1);
    }

    console.log(`📂 Monitoring Source: ${sourcePath}`);
    console.log(`🌑 Shadow Directory: ${SHADOW_DIR}`);

    // 2. Start Sync Loop
    setInterval(() => {
        performSafeSync(sourcePath, SHADOW_DIR);
    }, SYNC_INTERVAL_MS);

    // Perform initial sync immediately
    performSafeSync(sourcePath, SHADOW_DIR);
}

function performSafeSync(source, dest) {
    const scriptPath = path.join(__dirname, 'shadow_copy.ps1');
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${source}" "${dest}"`;

    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Syncing...`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Sync Error: ${error.message}`);
            return;
        }
        if (stderr) {
            // PowerShell might output to stderr for warnings, not always errors
            // console.warn(`⚠️ stderr: ${stderr}`);
        }
        console.log(stdout.trim());

        // After successful sync, we can safely "read" the shadow data
        readShadowData(dest);
    });
}

function readShadowData(shadowPath) {
    // Creating "Zero-Risk" read logic
    const clientFile = path.join(shadowPath, 'Client.dbf');
    if (fs.existsSync(clientFile)) {
        const stats = fs.statSync(clientFile);
        console.log(`📊 Reading Shadow Data: Found client database (${stats.size} bytes). Ready to parse.`);
        // Here we would call the DBF parser library
    } else {
        console.log('⚠️ No client data found in shadow copy yet.');
    }
}

// Start the service
runConnector();
