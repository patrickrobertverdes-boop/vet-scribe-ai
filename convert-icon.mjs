import fs from 'fs';
import pngToIco from 'png-to-ico';
import path from 'path';

console.log('Converting icon...');

const inputPath = 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png';
const outputPath = 'build/icon.ico';

// Validate input exists
if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

try {
    const buf = await pngToIco(inputPath);
    fs.writeFileSync(outputPath, buf);
    console.log(`Icon converted successfully! Saved to ${outputPath}`);
} catch (err) {
    console.error('Failed to convert icon:', err);
    // Fallback: Copy as png
    console.log('Fallback: Copying as build/icon.png');
    fs.copyFileSync(inputPath, 'build/icon.png');
    process.exit(0); // Exit successfully since we have a fallback
}
