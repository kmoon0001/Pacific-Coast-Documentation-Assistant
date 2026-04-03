const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
