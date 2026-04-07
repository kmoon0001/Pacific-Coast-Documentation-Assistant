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
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Log failures
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load URL: ${validatedURL}`);
    console.error(`Error: ${errorDescription} (${errorCode})`);
  });

  if (devServerUrl) {
    win.loadURL(devServerUrl).catch((err) => {
      console.error('Failed to load dev server:', err);
    });
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    // In production, we use app.getAppPath() to ensure we find the dist folder
    // The structure inside asar is:
    // - /dist/index.html
    // - /electron/main.cjs
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('Failed to load local file:', err);
    });
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

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

