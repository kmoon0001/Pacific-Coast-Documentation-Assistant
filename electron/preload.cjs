const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  version: '0.0.0', // hardcoded to bypass sandboxed preload restriction
});
