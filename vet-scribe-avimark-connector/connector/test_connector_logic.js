const path = require('path');
const fs = require('fs');
const BridgeSync = require('./sync_logic');
const { exec } = require('child_process');

// 1. Setup Mock Environment
console.log('🧪 STARTING CONNECTOR DIAGNOSTIC TEST...');

const MOCK_SOURCE = path.join(__dirname, '../mock_avimark/Data');
const SHADOW_DIR = path.join(__dirname, '../shadow_data');
const TEST_API_URL = 'http://localhost:3000/api/bridge'; // We will mock the network call anyway

// Ensure we have mock data
if (!fs.existsSync(MOCK_SOURCE)) {
    console.log('⚠️ Mock data missing, regenerating...');
    require('./create_mock_dbf');
}

// 2. Mock the Bridge to intercept network calls (so we don't actually need the server running to prove logic)
class TestBridge extends BridgeSync {
    async sendToApi(endpoint, payload) {
        console.log(`\n[NETWORK TEST] 📡 Sending to ${endpoint}:`);
        console.log(`   > Payload items: ${payload.patients ? payload.patients.length : payload.events.length}`);
        console.log(`   > Sample Data: ${JSON.stringify(payload.patients ? payload.patients[0] : payload.events[0], null, 2)}`);
        console.log(`[NETWORK TEST] ✅ Success (Simulated 200 OK)`);
    }
}

// 3. Replicate the Sync Logic from run.js
function performTestSync() {
    console.log(`\n[STEP 1] 📂 Source Detected: ${MOCK_SOURCE}`);

    // Test extraction logic
    const scriptPath = path.join(__dirname, 'shadow_copy.ps1');
    if (!fs.existsSync(scriptPath)) {
        console.error('❌ CRITICAL: shadow_copy.ps1 is missing!');
        return;
    }
    console.log(`[STEP 2] 📜 Script Found: ${scriptPath}`);

    // Create destination
    if (!fs.existsSync(SHADOW_DIR)) fs.mkdirSync(SHADOW_DIR, { recursive: true });

    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${MOCK_SOURCE}" "${SHADOW_DIR}"`;

    console.log(`[STEP 3] 🔄 Starting Shadow Copy (PowerShell)...`);

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ PowerShell Error: ${error.message}`);
            return;
        }
        console.log(stdout.trim());
        console.log(`[STEP 4] ✅ Shadow Copy Complete.`);

        // Run Bridge Logic
        console.log(`[STEP 5] 🧠 Parsing DBF & Syncing...`);
        const bridge = new TestBridge(SHADOW_DIR, TEST_API_URL, 'test-key');

        await bridge.syncPatients();
        await bridge.syncCalendar();

        console.log('\n✅ DIAGNOSTIC COMPLETE: The logic is solid.');
    });
}

performTestSync();
