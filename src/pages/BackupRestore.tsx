import React, { useState } from 'react';
import { HardDrive, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ApiService } from '../services/api';
import { db } from '../services/db/database';
import { useNotification } from '../components/common/NotificationContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const BackupRestore: React.FC = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const binaryData = await db.exportBackup();
      const blob = new Blob([binaryData], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `silk_weave_backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('SQLite Database binary backup downloaded successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to export SQLite binary');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      await db.importBackup(bytes);
      showSuccess('Database successfully restored! Reloading application data...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      showError('Invalid database file or corrupt SQLite binary format');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetToSeed = async () => {
    try {
      localStorage.removeItem('cloth_store_sqlite_bin');
      showWarning('Local database reset. Reloading demo seed store data...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      showError('Failed to reset store database');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-600" />
          Database Backup & Disaster Recovery
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Safeguard your entire store inventory, transactions, and customer accounts with offline SQLite binary backups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Download Full SQLite Database</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export an exact, encrypted binary snapshot (`.sqlite`) of all fabric catalogs, variation stock counts, sales history, customer ledgers, and audit logs.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Binary...' : 'Export Database Backup'}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Restore from Backup File</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a previously exported `.sqlite` database file to restore store data on this or another cashier terminal.
            </p>
          </div>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Restoring Snapshot...' : 'Select .sqlite File to Restore'}</span>
            <input type="file" accept=".sqlite,.db,.bin" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Danger Zone / Reset Data</span>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Resetting will clear custom changes and restore default demo cloth store stock, categories, and dummy sales invoices.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          Reset Store to Factory Demo State
        </button>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetToSeed}
        title="Reset Store Database?"
        message="Are you sure you want to erase all current store transactions and restore the default demo seed data? This cannot be undone."
        confirmLabel="Erase & Reset"
        variant="danger"
      />
    </div>
  );
};
