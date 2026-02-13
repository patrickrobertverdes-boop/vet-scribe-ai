const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const clientFile = path.join(__dirname, '../mock_avimark/Data/Client.dbf');
const shadowScript = path.join(__dirname, 'shadow_copy.ps1');
const shadowDest = path.join(__dirname, '../shadow_data');

console.log('🔒 LOCKING the database file to simulate Avimark usage...');
// Open file in 'r+' mode (read/write) which creates a lock on Windows if we don't close it
const fd = fs.openSync(clientFile, 'r+');

console.log('✅ File is LOCKED. Start the shadow copy script now...');

// Attempt to copy while locked
const command = `powershell -ExecutionPolicy Bypass -File "${shadowScript}" "${path.dirname(clientFile)}" "${shadowDest}"`;

exec(command, (error, stdout, stderr) => {
    console.log('\n--- SHADOW COPY RESULT ---');
    if (error) {
        console.log('❌ Copy Failed (Expected?)', error.message);
    } else {
        console.log(stdout);
    }

    console.log('\n🔓 Unlocking file...');
    fs.closeSync(fd);
    console.log('✅ Test Complete.');
});
