const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchFormats: (url) => ipcRenderer.invoke('fetch-formats', url),
  selectSavePath: (isAudioOnly) => ipcRenderer.invoke('select-save-path', isAudioOnly),
  download: (data) => ipcRenderer.invoke('download', data),
  onProgress: (callback) => ipcRenderer.on('download-progress', (_, percent) => callback(percent)),
});
