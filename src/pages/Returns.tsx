import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { SalesReturn, StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface ReturnsProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Returns: React.FC<ReturnsProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getSalesReturns();
      setReturns(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load return records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = returns.filter(
    (r) =>
      r.return_no.toLowerCase().includes(search.toLowerCase()) ||
      (r.sale_invoice_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            Customer Returns & Exchanges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage cloth returns, restock inventory, and issue refunds.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by return number, original invoice, customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Return #</th>
                <th className="px-4 py-2.5">Original Invoice</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Refund Amount</th>
                <th className="px-4 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-bold font-mono text-rose-600">{r.return_no}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-700">{r.sale_invoice_no || `INV-${r.sale_id}`}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900">{r.customer_name || 'Walk-in Customer'}</td>
                  <td className="px-4 py-2.5 text-[11px] text-slate-500 font-mono">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-rose-600 font-mono">
                    {settings.currency} {r.total_refund.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.reason || 'Defective / Exchange'}</td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No return records found.
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
