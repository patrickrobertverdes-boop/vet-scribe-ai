const { contextBridge, ipcRenderer } = require('electron');

console.log('⚡ VetScribe Native Bridge Initializing...');

contextBridge.exposeInMainWorld('avimarkConnector', {
    shadowCopy: (source, dest) => ipcRenderer.invoke('shadow-copy', source, dest),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    ping: () => ipcRenderer.invoke('bridge-ping'),
    platform: process.platform
});
