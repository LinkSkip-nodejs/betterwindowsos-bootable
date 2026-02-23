const { contextBridge, ipcRenderer } = require("electron");

// Expose APIs so the renderer knows it's in Electron + can scan WiFi
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  wifi: {
    scan: () => ipcRenderer.invoke("wifi:scan"),
    connect: (ssid, password) => ipcRenderer.invoke("wifi:connect", ssid, password),
    disconnect: () => ipcRenderer.invoke("wifi:disconnect"),
    current: () => ipcRenderer.invoke("wifi:current"),
  },
  onOAuthCallback: (callback) => {
    ipcRenderer.on("oauth-callback", (_event, url) => callback(url));
  },
});
