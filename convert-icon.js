const fs = require('fs');
const pngToIco = require('png-to-ico');

console.log('Converting icon...');

// Convert assets/icon.png to build/icon.ico
pngToIco('assets/icon.png')
    .then(buf => {
        fs.writeFileSync('build/icon.ico', buf);
        console.log('Icon converted successfully!');
    })
    .catch(err => {
        console.error('Failed to convert icon:', err);
        process.exit(1);
    });
