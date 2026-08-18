import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPlatform: () => process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Database Direct Operations (Offline SQLite via Electron main)
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', { sql, params }),
  dbExecute: (sql: string, params?: any[]) => ipcRenderer.invoke('db-execute', { sql, params }),
  dbTransaction: (queries: Array<{ sql: string; params?: any[] }>) => ipcRenderer.invoke('db-transaction', queries),
  dbExportBackup: () => ipcRenderer.invoke('db-export-backup'),
  dbImportBackup: (buffer: Uint8Array) => ipcRenderer.invoke('db-import-backup', buffer),
  
  // Dialogs
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Printing
  printReceipt: (htmlContent: string, options?: any) => ipcRenderer.invoke('print-receipt', { htmlContent, options }),
  printA4: (htmlContent: string) => ipcRenderer.invoke('print-a4', htmlContent),
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});
