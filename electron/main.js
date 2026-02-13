const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: true
        },
    });

    // Load the app
    // For development (and to match Capacitor usage), we load the hosted URL
    const prodUrl = 'https://vet-scribe-a2i--verdes-8568d.us-east4.hosted.app';
    const devUrl = 'http://localhost:3000';

    win.loadURL(isDev ? devUrl : prodUrl).catch((e) => {
        console.error('Failed to load URL:', e);
    });

    // Open DevTools in dev mode
    if (isDev) {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    // IPC Handler for Shadow Copy
    ipcMain.handle('shadow-copy', async (event, source, dest) => {
        return new Promise((resolve, reject) => {
            // Path to the PS script
            const scriptPath = isDev
                ? path.join(__dirname, '../vet-scribe-avimark-connector/connector/shadow_copy.ps1')
                : path.join(process.resourcesPath, 'connector/shadow_copy.ps1');

            console.log(`Executing Shadow Copy: ${scriptPath} "${source}" "${dest}"`);

            // Invoke PowerShell
            const ps = spawn('powershell.exe', [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                source,
                dest
            ]);

            let output = '';
            let errorOutput = '';

            ps.stdout.on('data', (data) => {
                output += data.toString();
                console.log(`[PS stdout]: ${data}`);
            });

            ps.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`[PS stderr]: ${data}`);
            });

            ps.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, log: output });
                } else {
                    reject(new Error(`Shadow Copy failed with code ${code}. Error: ${errorOutput}`));
                }
            });
        });
    });

    // Handle Folder Selection
    ipcMain.handle('select-folder', async () => {
        let win = BrowserWindow.getFocusedWindow();
        if (!win) {
            win = BrowserWindow.getAllWindows()[0];
        }

        console.log('[Native] Requesting folder selection...');
        try {
            const result = await dialog.showOpenDialog(win, {
                title: 'Select Clinical Data Root',
                properties: ['openDirectory', 'dontAddToRecent'],
                buttonLabel: 'Select Folder'
            });

            if (result.canceled) {
                console.log('[Native] Folder selection canceled.');
                return null;
            }

            console.log(`[Native] Folder selected: ${result.filePaths[0]}`);
            return result.filePaths[0];
        } catch (err) {
            console.error('[Native] Dialog Error:', err);
            return null;
        }
    });

    // Bridge Health Check
    ipcMain.handle('bridge-ping', () => {
        return { status: 'connected', version: '1.0.4', platform: process.platform };
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
