import React, { useState } from 'react';
import { Scissors, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { User, StoreSettings } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  settings: StoreSettings;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Change Password Modal for first login
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showError('Please enter username and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.login(username, password);
      if (res.success && res.user) {
        if (res.user.must_change_password === 1) {
          setTempUser(res.user);
          setShowChangePassModal(true);
        } else {
          showSuccess(`Welcome back, ${res.user.full_name}!`);
          onLoginSuccess(res.user);
        }
      } else {
        showError(res.message || 'Invalid username or password');
      }
    } catch (err: any) {
      showError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (!tempUser) return;
    const res = await AuthService.changePassword(tempUser.id, newPassword);
    if (res.success) {
      showSuccess('Password updated successfully');
      setShowChangePassModal(false);
      onLoginSuccess(tempUser);
    } else {
      showError(res.message || 'Failed to update password');
    }
  };

  const setDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-xs mb-3">
            <Scissors className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{settings.store_name}</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{settings.tagline}</p>
          <div className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            100% Offline SQLite Desktop System
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username / User ID
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or cashier1"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Store System'}</span>
            </button>
          </form>

          {/* Preset Demo Accounts for Easy Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Test Credentials
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoAccount('admin', 'admin123')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800">Super Admin</div>
                <div className="text-[10px] text-slate-500">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('manager', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800">Store Manager</div>
                <div className="text-[10px] text-slate-500">manager / password123</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('cashier1', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800">POS Cashier</div>
                <div className="text-[10px] text-slate-500">cashier1 / password123</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('storekeeper', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800">Store Keeper</div>
                <div className="text-[10px] text-slate-500">storekeeper / password123</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Force Change Password Modal */}
      <Modal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
        title="Change Default Password"
        subtitle="For security reasons, please change your default password on first login."
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 6 chars)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Update Password & Enter
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

