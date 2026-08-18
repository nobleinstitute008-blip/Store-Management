import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, KeyRound, UserCheck, Trash2, Edit2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { User, StoreSettings } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface UsersManagementProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'manager' | 'cashier' | 'store_keeper'>('cashier');

  // Password reset modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getUsers();
      setUsers(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) return;

    try {
      if (editingUser) {
        await ApiService.updateUser(
          editingUser.id,
          { username, full_name: fullName, email, role },
          currentUser || undefined
        );
        showSuccess('User account updated');
      } else {
        if (!password) {
          showError('Password is required for new accounts');
          return;
        }
        await ApiService.createUser(
          { username, full_name: fullName, email, role, status: 'active', password_hash: password },
          currentUser || undefined
        );
        showSuccess('New staff user account created');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to save user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword) return;

    try {
      await ApiService.changePassword(resetTargetUser.id, newPassword, currentUser || undefined);
      showSuccess(`Password updated for ${resetTargetUser.username}`);
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      showError(err.message || 'Failed to update password');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser?.id) {
      showError('You cannot delete your own active account');
      return;
    }
    try {
      await ApiService.deleteUser(id, currentUser || undefined);
      showSuccess('User account deactivated');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            User Roles & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage operator accounts, cashier permissions, managers, and store keepers.</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setUsername('');
            setFullName('');
            setEmail('');
            setPassword('');
            setRole('cashier');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Staff Name & Username</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">System Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'manager'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : u.role === 'cashier'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'active' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setResetTargetUser(u);
                          setNewPassword('');
                          setShowPasswordModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Change Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setUsername(u.username);
                          setFullName(u.full_name);
                          setEmail(u.email);
                          setRole(u.role);
                          setShowModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Deactivate Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Edit/Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User Account' : 'Create New User Account'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Usman Ali"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username (Login)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usman_ali"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usman@store.com"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Access Level</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="cashier">Cashier (POS Checkout Only)</option>
              <option value="store_keeper">Store Keeper (Inventory & Purchases)</option>
              <option value="manager">Store Manager (POS, Inventory, Expenses, Reports)</option>
              <option value="super_admin">Super Administrator (Full System Access)</option>
            </select>
          </div>
          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save User
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={`Change Password: @${resetTargetUser?.username}`}
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
