const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  version: require('../package.json').version,
});
