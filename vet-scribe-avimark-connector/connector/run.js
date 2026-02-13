const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { findAvimarkPath } = require('./auto_detect');
const BridgeSync = require('./sync_logic');

const readline = require('readline');
const os = require('os');

// Configuration Defaults
const PROD_API_URL = 'https://verdes-8568d.web.app/api/bridge'; // Based on .firebaserc project ID
const SHADOW_DIR = path.join(__dirname, '../shadow_data');
const SYNC_INTERVAL_MS = 60000; // Sync every minute in production
const APP_NAME = 'VetScribeConnector';

// Function to handle Zero-Config Setup
async function loadConfig() {
    // 1. Check environment variables (highest priority)
    if (process.env.API_URL && process.env.API_KEY) {
        return { apiUrl: process.env.API_URL, apiKey: process.env.API_KEY };
    }

    // 2. Check persistent config file in AppData
    const configDir = path.join(os.homedir(), 'AppData', 'Roaming', APP_NAME);
    const configFile = path.join(configDir, 'config.json');

    if (fs.existsSync(configFile)) {
        try {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            if (config.apiKey) {
                console.log(`✅ Loaded configuration from: ${configFile}`);
                return {
                    apiUrl: config.apiUrl || PROD_API_URL,
                    apiKey: config.apiKey
                };
            }
        } catch (e) {
            console.warn('⚠️ Config file corrupted, resetting...');
        }
    }

    // 3. Zero-Interaction Default Setup
    console.log('⚡ First-time setup: configuring automatically...');

    // Hardcoded "Universal" Key for Zero-Config Deployment
    // In a sophisticated multi-tenant setup, each EXE might be pre-compiled with a unique ID,
    // but for now, we use a shared secret to allow the data to flow immediately.
    const DEFAULT_KEY = 'vet-scribe-official-connector-key';
    const finalUrl = PROD_API_URL;
    const finalKey = DEFAULT_KEY;

    try {
        // Save for future runs
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        fs.writeFileSync(configFile, JSON.stringify({ apiUrl: finalUrl, apiKey: finalKey }, null, 2));
        console.log(`\n✅ Configuration saved to: ${configFile}`);

        return { apiUrl: finalUrl, apiKey: finalKey };
    } catch (e) {
        throw e;
    }
}

async function runConnector() {
    console.log('🤖 VetScribe Connector Service Starting...');

    // Load Configuration (Zero-Config Flow)
    const { apiUrl, apiKey } = await loadConfig();
    console.log(`🔗 Connecting to API: ${apiUrl}`);

    // 1. Auto-Detect Source
    let sourcePath = findAvimarkPath();
    if (!sourcePath) {
        console.error('CRITICAL: Cannot find Avimark data source automatically.');
        console.error('Please ensure Avimark is installed in a standard location (C:/Avimark/Data, etc.)');
        // prompt user for path if not found? optional improvement
        process.exit(1);
    }

    console.log(`📂 Monitoring Source: ${sourcePath}`);
    console.log(`🌑 Shadow Directory: ${SHADOW_DIR}`);

    // Initialize Bridge
    const bridge = new BridgeSync(SHADOW_DIR, apiUrl, apiKey);

    // 2. Start Sync Loop
    console.log(`⏱️  Sync Interval: ${SYNC_INTERVAL_MS / 1000} seconds`);
    setInterval(() => {
        performSafeSync(sourcePath, SHADOW_DIR, bridge);
    }, SYNC_INTERVAL_MS);

    // Perform initial sync immediately
    performSafeSync(sourcePath, SHADOW_DIR, bridge);
}

function getShadowCopyScript() {
    const scriptName = 'shadow_copy.ps1';
    // If running in pkg, extract the script to a temp location because PowerShell can't read from inside the exe
    if (process.pkg) {
        const tempDir = require('os').tmpdir();
        const destPath = path.join(tempDir, `vet-scribe-${scriptName}`);
        try {
            // Read from the virtual filesystem inside the exe
            const content = fs.readFileSync(path.join(__dirname, scriptName));
            fs.writeFileSync(destPath, content);
            return destPath;
        } catch (e) {
            console.error('Error extracting shadow copy script:', e.message);
            // Fallback: try to find it relative to the exe just in case
            return path.join(path.dirname(process.execPath), scriptName);
        }
    } else {
        // Running via node, just use the local file
        return path.join(__dirname, scriptName);
    }
}

function performSafeSync(source, dest, bridge) {
    const scriptPath = getShadowCopyScript();
    // Ensure destination exists
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${source}" "${dest}"`;

    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Shadow Sync...`);

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Sync Error: ${error.message}`);
            // In mock mode, the powershell script might fail if paths match exactly, but file copy might succeed if permissions are loose.
            // If shadow copy fails, we might still try to read if files exist.
        }

        if (stdout && stdout.trim().length > 0) {
            console.log(stdout.trim());
        }

        // After successful shadow copy, run the Bridge logic
        console.log('📊 Processing Shadow Data...');
        await bridge.syncPatients();
        await bridge.syncCalendar();
        await bridge.checkForExports(); // Check for write-backs
    });
}

// Start the service
runConnector();
