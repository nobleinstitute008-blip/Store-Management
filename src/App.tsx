import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { db } from './services/db/database';
import { ApiService } from './services/api';
import { AuthService } from './services/auth';
import { User, StoreSettings } from './types';
import { NotificationProvider } from './components/common/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';

// Page Imports
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Categories } from './pages/Categories';
import { Units } from './pages/Units';
import { StockLedger } from './pages/StockLedger';
import { SalesHistory } from './pages/SalesHistory';
import { Returns } from './pages/Returns';
import { Customers } from './pages/Customers';
import { Purchases } from './pages/Purchases';
import { Suppliers } from './pages/Suppliers';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { BarcodeStudio } from './pages/BarcodeStudio';
import { UsersManagement } from './pages/UsersManagement';
import { AuditLogs } from './pages/AuditLogs';
import { BackupRestore } from './pages/BackupRestore';
import { Settings } from './pages/Settings';
import { Loader2, AlertTriangle, RefreshCw, Scissors } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleResetDb = () => {
    localStorage.removeItem('cloth_store_sqlite_bin');
    localStorage.removeItem('cloth_store_session_user');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Application Notice</h2>
              <p className="text-xs text-slate-500 mt-1">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleResetDb}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Silk & Weave Fabric Emporium',
  tagline: 'The House of Premium Unstitched & Designer Fabrics',
  phone: '+92 42 35789012',
  whatsapp: '+92 300 9876543',
  email: 'info@silknweave.com',
  address: 'Plaza 14-C, Main Boulevard, Gulberg III',
  city: 'Lahore, Pakistan',
  tax_number: 'STRN-3277876129841',
  currency: 'PKR',
  tax_rate_percent: 0,
  invoice_prefix: 'INV-2026-',
  receipt_prefix: 'REC-',
  purchase_prefix: 'PUR-2026-',
  return_prefix: 'RET-',
  costing_method: 'average_cost',
  low_stock_default: 10,
  receipt_footer: 'Thank you for shopping at Silk & Weave! Sold fabrics once cut cannot be exchanged.',
  printer_type: 'thermal_80mm',
  auto_backup_frequency: 'daily',
  backup_copies_to_keep: 10
};

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Initialize SQLite Database
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        await db.init();
        if (!isMounted) return;

        // Load Store Settings
        try {
          const loadedSettings = await ApiService.getSettings();
          setSettings(loadedSettings);
        } catch (e) {
          console.warn('Could not load settings, using defaults', e);
        }

        // Check active login session
        const savedUser = AuthService.getCurrentUser();
        if (savedUser) {
          setCurrentUser(savedUser);
        }

        // Get low stock alert count
        try {
          const stats = await ApiService.getDashboardStats();
          setLowStockCount(stats.lowStockCount + stats.outOfStockCount);
        } catch (e) {
          console.warn('Could not load stats', e);
        }

        setIsDbReady(true);
      } catch (err: any) {
        console.error('Database initialization error:', err);
        if (isMounted) {
          setInitError(err.message || 'Failed to initialize local SQLite database.');
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshSettings = async () => {
    try {
      const updated = await ApiService.getSettings();
      setSettings(updated);
    } catch (e) {
      console.warn('Failed to refresh settings', e);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
  };

  // Loading Screen
  if (!isDbReady) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans p-4 select-none">
        <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Scissors className="w-7 h-7 animate-pulse" />
            </div>
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">Silk & Weave Fabric POS</h1>
            <p className="text-xs text-slate-400 mt-1">Initializing offline SQLite database engine & fabric catalog...</p>
          </div>
          {initError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs space-y-2 text-left w-full">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Initialization Error</span>
              </div>
              <p className="text-[11px] opacity-90">{initError}</p>
              <button
                onClick={() => {
                  localStorage.removeItem('cloth_store_sqlite_bin');
                  window.location.reload();
                }}
                className="w-full px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded text-xs transition-colors cursor-pointer text-center"
              >
                Reset Database & Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <NotificationProvider>
          <Login onLoginSuccess={(user) => setCurrentUser(user)} settings={settings} />
        </NotificationProvider>
      </ErrorBoundary>
    );
  }

  // Render Page Content
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} settings={settings} onNavigate={setCurrentPage} />;
      case 'pos':
        return <POS currentUser={currentUser} settings={settings} />;
      case 'inventory':
        return <Inventory currentUser={currentUser} settings={settings} />;
      case 'categories':
        return <Categories currentUser={currentUser} />;
      case 'units':
        return <Units />;
      case 'stock-ledger':
        return <StockLedger />;
      case 'sales-history':
        return <SalesHistory settings={settings} />;
      case 'returns':
        return <Returns currentUser={currentUser} settings={settings} />;
      case 'customers':
        return <Customers currentUser={currentUser} settings={settings} />;
      case 'purchases':
        return <Purchases currentUser={currentUser} settings={settings} />;
      case 'suppliers':
        return <Suppliers currentUser={currentUser} settings={settings} />;
      case 'expenses':
        return <Expenses currentUser={currentUser} settings={settings} />;
      case 'reports':
        return <Reports settings={settings} />;
      case 'barcodes':
        return <BarcodeStudio settings={settings} />;
      case 'users':
        return <UsersManagement currentUser={currentUser} settings={settings} />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'backup':
        return <BackupRestore />;
      case 'settings':
        return <Settings currentUser={currentUser} settings={settings} onSettingsUpdated={refreshSettings} />;
      default:
        return <Dashboard currentUser={currentUser} settings={settings} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppLayout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          currentUser={currentUser}
          settings={settings}
          lowStockCount={lowStockCount}
          onLogout={handleLogout}
        >
          {renderCurrentPage()}
        </AppLayout>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
