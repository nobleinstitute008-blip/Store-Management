import React, { useState, useEffect } from 'react';
import { History, Search, ArrowDownLeft, ArrowUpRight, Filter, Download } from 'lucide-react';
import { ApiService } from '../services/api';
import { StockMovement } from '../types';
import { useNotification } from '../components/common/NotificationContext';

export const StockLedger: React.FC = () => {
  const { showError } = useNotification();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getStockMovements();
      setMovements(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load stock ledger movements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = movements.filter((m) => {
    const matchSearch =
      (m.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.variation_sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.reference_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.movement_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Stock Movement & Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time audit trail of every meter added, sold, adjusted, or returned.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by fabric name, SKU, invoice ref..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Movement Types</option>
            <option value="purchase">Purchases (Stock In)</option>
            <option value="sale">Sales (Stock Out)</option>
            <option value="adjustment">Manual Adjustments</option>
            <option value="damage">Damaged Fabric</option>
            <option value="return_in">Sales Return (In)</option>
            <option value="return_out">Purchase Return (Out)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-2.5">Date & Time</th>
                <th className="px-3.5 py-2.5">Fabric & SKU</th>
                <th className="px-3.5 py-2.5">Type</th>
                <th className="px-3.5 py-2.5 text-right">Quantity</th>
                <th className="px-3.5 py-2.5 text-right">Prev Stock</th>
                <th className="px-3.5 py-2.5 text-right">New Stock</th>
                <th className="px-3.5 py-2.5">Reference</th>
                <th className="px-3.5 py-2.5">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((m: any) => {
                const isPositive = m.quantity > 0 || m.movement_type === 'purchase' || m.movement_type === 'sale_return';
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-500 font-mono">
                      {m.date || (m.created_at ? new Date(m.created_at).toLocaleString('en-GB') : '-')}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="font-bold text-slate-900">{m.product_name || 'Fabric Item'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {m.variation_sku || ''}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isPositive ? <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> : <ArrowUpRight className="w-3 h-3 text-rose-600" />}
                        {String(m.movement_type).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} m
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-slate-500 font-mono text-[11px]">{m.previous_stock ?? '-'}</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono text-[11px]">{m.new_stock ?? '-'}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-mono text-[11px] text-slate-700">{m.reference_no || '-'}</span>
                      {m.reason && <div className="text-[10px] text-slate-400 italic">{m.reason}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-600 font-semibold">{m.user_name || 'System'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No movement records found.
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
