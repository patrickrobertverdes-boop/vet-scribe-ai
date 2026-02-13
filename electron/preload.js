const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('avimarkConnector', {
    shadowCopy: (source, dest) => ipcRenderer.invoke('shadow-copy', source, dest),
    platform: process.platform
});
