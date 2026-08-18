import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User, StoreSettings } from '../../types';

interface AppLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User | null;
  settings: StoreSettings;
  lowStockCount: number;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  settings,
  lowStockCount,
  onLogout,
  children
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} userRole={currentUser?.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-100">
        <Header
          currentUser={currentUser}
          settings={settings}
          lowStockCount={lowStockCount}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/90">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

