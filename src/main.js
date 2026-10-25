import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;
let breakWindow;
let breakTimeout;

function closeBreakWindow() {
  clearTimeout(breakTimeout);
  if (!breakWindow || breakWindow.isDestroyed()) return;
  const windowToClose = breakWindow;
  breakWindow = null;
  windowToClose.destroy();
}

function createBreakWindow({ durationSeconds, type }) {
  closeBreakWindow();
  const safeDuration = Math.min(Math.max(Number(durationSeconds) || 0, 1), 90 * 60);
  const endsAt = Date.now() + safeDuration * 1000;
  const targetDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  breakWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    show: false,
    frame: false,
    alwaysOnTop: true,
    closable: false,
    minimizable: false,
    maximizable: false,
    movable: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#101511',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  breakWindow.setAlwaysOnTop(true, 'screen-saver');
  breakWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  breakWindow.setKiosk(true);
  breakWindow.once('ready-to-show', () => {
    breakWindow?.show();
    breakWindow?.focus();
  });
  breakWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' || (input.meta && input.key.toLowerCase() === 'w') || (input.alt && input.key === 'F4')) event.preventDefault();
  });
  breakWindow.on('closed', () => { breakWindow = undefined; });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const breakUrl = new URL('break.html', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    breakUrl.searchParams.set('endsAt', String(endsAt));
    breakUrl.searchParams.set('type', type);
    breakWindow.loadURL(breakUrl.toString());
  } else {
    breakWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/break.html`), { query: { endsAt: String(endsAt), type } });
  }

  breakTimeout = setTimeout(closeBreakWindow, safeDuration * 1000 + 250);
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

};

ipcMain.handle('break-enforcement:start', (_event, breakDetails) => {
  createBreakWindow(breakDetails ?? {});
});

ipcMain.handle('break-enforcement:end', () => {
  closeBreakWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => closeBreakWindow());

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
