import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';

let mainWindow: BrowserWindow | null = null;
let db: Database | null = null;
let dbFilePath = '';

function getDbPath(): string {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'cloth_store.db');
}

async function initDatabase() {
  const SQL = await initSqlJs();
  dbFilePath = getDbPath();

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    // Default schema will be initialized on first run
  }
}

function saveDatabaseToDisk() {
  if (db && dbFilePath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'ClothStore Pro - Offline Fabric & Apparel Management',
    frame: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  saveDatabaseToDisk();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Database Handlers
ipcMain.handle('db-query', async (_, { sql, params = [] }) => {
  if (!db) await initDatabase();
  try {
    const stmt = db!.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-execute', async (_, { sql, params = [] }) => {
  if (!db) await initDatabase();
  try {
    db!.run(sql, params);
    saveDatabaseToDisk();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-transaction', async (_, queries: Array<{ sql: string; params?: any[] }>) => {
  if (!db) await initDatabase();
  try {
    db!.run('BEGIN TRANSACTION;');
    for (const q of queries) {
      db!.run(q.sql, q.params || []);
    }
    db!.run('COMMIT;');
    saveDatabaseToDisk();
    return { success: true };
  } catch (error: any) {
    try {
      db!.run('ROLLBACK;');
    } catch {}
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-export-backup', async () => {
  if (!db) await initDatabase();
  saveDatabaseToDisk();
  const data = db!.export();
  return Array.from(data);
});

ipcMain.handle('db-import-backup', async (_, bufferArray: number[]) => {
  const SQL = await initSqlJs();
  const uint8 = new Uint8Array(bufferArray);
  db = new SQL.Database(uint8);
  saveDatabaseToDisk();
  return { success: true };
});

// Dialogs & Utilities
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

ipcMain.handle('show-save-dialog', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('print-receipt', async (_, { htmlContent, options }) => {
  const printWindow = new BrowserWindow({ show: false });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  return new Promise((resolve) => {
    printWindow.webContents.print(
      {
        silent: options?.silent ?? true,
        printBackground: true,
        deviceName: options?.deviceName ?? ''
      },
      (success, failureReason) => {
        printWindow.close();
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());
