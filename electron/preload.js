const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('avimarkConnector', {
    shadowCopy: (source, dest) => ipcRenderer.invoke('shadow-copy', source, dest),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    platform: process.platform
});
