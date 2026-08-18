import React from 'react';
import {
  ShoppingCart,
  Bell,
  WifiOff,
  User as UserIcon,
  LogOut,
  Maximize2,
  Minimize2,
  HardDrive
} from 'lucide-react';
import { User, StoreSettings } from '../../types';
import { AuthService } from '../../services/auth';

interface HeaderProps {
  currentUser: User | null;
  settings: StoreSettings;
  lowStockCount: number;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  lowStockCount,
  onNavigate,
  onLogout
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const roleBadgeColor = {
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    store_keeper: 'bg-amber-50 text-amber-700 border-amber-200'
  }[currentUser?.role || 'cashier'];

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Store Branding & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">{settings.store_name}</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <WifiOff className="w-3 h-3 text-emerald-600" />
            OFFLINE SQLITE
          </span>
        </div>
      </div>

      {/* Right: Quick Actions, POS Button, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick POS Cashier Button */}
        {AuthService.can(currentUser?.role, 'pos:view') && (
          <button
            id="header-pos-btn"
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS CASHIER</span>
          </button>
        )}

        {/* Low Stock Alert Bell */}
        <button
          id="header-stock-alert-btn"
          onClick={() => onNavigate('inventory')}
          title={`${lowStockCount} items have low stock`}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-600 text-white shadow-xs">
              {lowStockCount}
            </span>
          )}
        </button>

        {/* Fullscreen Button */}
        <button
          id="header-fullscreen-btn"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Mode"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Backup Database Quick Link */}
        {currentUser?.role === 'super_admin' && (
          <button
            id="header-backup-btn"
            onClick={() => onNavigate('backup')}
            title="Database Backup & Restore"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
          </button>
        )}

        {/* User Card */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.full_name || currentUser?.username}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider border ${roleBadgeColor}`}>
                  {currentUser?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            id="header-logout-btn"
            onClick={onLogout}
            title="Sign Out of Session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

