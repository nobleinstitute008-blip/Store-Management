import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck } from 'lucide-react';
import { ApiService } from '../services/api';
import { AuditLog } from '../types';
import { useNotification } from '../components/common/NotificationContext';

export const AuditLogs: React.FC = () => {
  const { showError } = useNotification();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter(
    (l) =>
      (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.reference_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            System Audit Trail & Security Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of every user transaction, stock edit, login event, and permission change.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, action type, invoice reference or remarks..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-2.5">Timestamp</th>
                <th className="px-3.5 py-2.5">User</th>
                <th className="px-3.5 py-2.5">Action</th>
                <th className="px-3.5 py-2.5">Entity</th>
                <th className="px-3.5 py-2.5">Reference #</th>
                <th className="px-3.5 py-2.5">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 text-[11px] font-mono text-slate-500">
                    {l.created_at ? new Date(l.created_at).toLocaleString('en-GB') : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">@{l.username}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px] font-semibold">{l.entity}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-indigo-700 font-bold">{l.reference_id || '-'}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 text-xs">{l.details}</td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
