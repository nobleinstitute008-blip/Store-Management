import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Tags,
  Ruler,
  TrendingUp,
  RotateCcw,
  Truck,
  Users,
  Wallet,
  FileBarChart,
  QrCode,
  ShieldCheck,
  History,
  HardDrive,
  Settings,
  Scissors
} from 'lucide-react';
import { UserRole } from '../../types';
import { AuthService } from '../../services/auth';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: UserRole;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  permission?: string;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, userRole }) => {
  const navigation: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS Cashier', icon: ShoppingCart, permission: 'pos:view' }
      ]
    },
    {
      group: 'CLOTH INVENTORY',
      items: [
        { id: 'inventory', label: 'Fabric Catalog & Stock', icon: Layers, permission: 'inventory:view' },
        { id: 'categories', label: 'Categories & Mills', icon: Tags, permission: 'inventory:view' },
        { id: 'units', label: 'Measurement Units', icon: Ruler, permission: 'inventory:view' },
        { id: 'stock-ledger', label: 'Stock Movement Ledger', icon: History, permission: 'inventory:view' }
      ]
    },
    {
      group: 'SALES & CLIENTS',
      items: [
        { id: 'sales-history', label: 'Sales Invoices', icon: TrendingUp, permission: 'sales:view' },
        { id: 'returns', label: 'Returns & Exchange', icon: RotateCcw, permission: 'sales:return' },
        { id: 'customers', label: 'Customer Accounts', icon: Users, permission: 'customers:view' }
      ]
    },
    {
      group: 'PURCHASES & VENDORS',
      items: [
        { id: 'purchases', label: 'Purchase Orders', icon: Truck, permission: 'purchases:view' },
        { id: 'suppliers', label: 'Mill & Supplier Directory', icon: Scissors, permission: 'suppliers:view' }
      ]
    },
    {
      group: 'FINANCE & REPORTS',
      items: [
        { id: 'expenses', label: 'Expense Tracker', icon: Wallet, permission: 'expenses:view' },
        { id: 'reports', label: 'Financial & Stock Reports', icon: FileBarChart, permission: 'reports:view' }
      ]
    },
    {
      group: 'SYSTEM & TOOLS',
      items: [
        { id: 'barcodes', label: 'Barcode Studio', icon: QrCode, permission: 'barcodes:view' },
        { id: 'users', label: 'User Permissions', icon: ShieldCheck, permission: 'super_admin' },
        { id: 'audit-logs', label: 'Audit Trail Logs', icon: History, permission: 'super_admin' },
        { id: 'backup', label: 'Backup & Restore', icon: HardDrive, permission: 'super_admin' },
        { id: 'settings', label: 'Store Settings', icon: Settings, permission: 'super_admin' }
      ]
    }
  ];

  const isAllowed = (item: NavItem) => {
    if (!item.permission) return true;
    if (item.permission === 'super_admin') return userRole === 'super_admin';
    return AuthService.can(userRole, item.permission);
  };

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800/90 flex flex-col h-screen select-none shrink-0 overflow-y-auto z-20">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Scissors className="w-4 h-4" />
        </div>
        <div>
          <div className="font-black text-xs text-white tracking-tight leading-tight uppercase">ClothStore Pro</div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider">Fabric ERP & POS</div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-2.5 space-y-4 flex-1">
        {navigation.map((group, gIdx) => {
          const visibleItems = group.items.filter(isAllowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx}>
              <div className="px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-500 text-white rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
        <div>SQLite Engine • 100% Offline</div>
        <div className="text-[9px] text-slate-600 mt-0.5">Windows Native Build Ready</div>
      </div>
    </aside>
  );
};

