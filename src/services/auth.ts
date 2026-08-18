import { User, UserRole } from '../types';
import { db } from './db/database';

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Session key
const SESSION_USER_KEY = 'cloth_store_session_user';

export const AuthService = {
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const passwordHash = await hashPassword(password);
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE username = ? AND password_hash = ? AND status = "active"',
        [username.trim(), passwordHash]
      );

      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Save session
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));

      // Log login action
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'USER_LOGIN', 'AUTH', `USR-${user.id}`, 'User logged into application']
      );

      return { success: true, user };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed' };
    }
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.username, 'USER_LOGOUT', 'AUTH', `USR-${user.id}`, 'User logged out']
        );
      } catch {}
    }
    localStorage.removeItem(SESSION_USER_KEY);
  },

  async changePassword(userId: number, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const passwordHash = await hashPassword(newPassword);
      await db.execute(
        'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, userId]
      );

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.must_change_password = 0;
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(currentUser));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  can(role: UserRole | undefined, permission: string): boolean {
    if (!role) return false;
    if (role === 'super_admin') return true; // Super admin has full permissions

    const matrix: Record<UserRole, string[]> = {
      super_admin: ['*'],
      manager: [
        'pos:view',
        'pos:sell',
        'inventory:view',
        'inventory:create',
        'inventory:edit',
        'inventory:adjust',
        'purchases:view',
        'purchases:create',
        'sales:view',
        'sales:return',
        'customers:view',
        'customers:manage',
        'suppliers:view',
        'suppliers:manage',
        'expenses:view',
        'expenses:manage',
        'reports:view',
        'barcodes:view',
        'barcodes:print'
      ],
      cashier: [
        'pos:view',
        'pos:sell',
        'sales:view',
        'customers:view',
        'customers:manage',
        'barcodes:view',
        'barcodes:print'
      ],
      store_keeper: [
        'inventory:view',
        'inventory:create',
        'inventory:edit',
        'inventory:adjust',
        'purchases:view',
        'purchases:create',
        'suppliers:view',
        'barcodes:view',
        'barcodes:print'
      ]
    };

    const allowed = matrix[role] || [];
    return allowed.includes('*') || allowed.includes(permission);
  }
};
