import React, { useState, useEffect } from 'react';
import { FileBarChart, DollarSign, TrendingUp, Download, Calendar, Filter, Layers, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ApiService } from '../services/api';
import { StoreSettings } from '../types';
import { useNotification } from '../components/common/NotificationContext';

interface ReportsProps {
  settings: StoreSettings;
}

export const Reports: React.FC<ReportsProps> = ({ settings }) => {
  const { showError, showSuccess } = useNotification();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'pl'>('sales');
  const [isLoading, setIsLoading] = useState(false);

  // Date Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Report Data
  const [salesReport, setSalesReport] = useState<any>(null);
  const [stockReport, setStockReport] = useState<any>(null);
  const [plReport, setPlReport] = useState<any>(null);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'sales') {
        const data = await ApiService.getSalesReport(startDate, endDate);
        setSalesReport(data);
      } else if (activeTab === 'inventory') {
        const data = await ApiService.getStockValuationReport();
        setStockReport(data);
      } else if (activeTab === 'pl') {
        const data = await ApiService.getProfitLossReport(startDate, endDate);
        setPlReport(data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to generate financial report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    showSuccess('Exporting report as CSV...');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-indigo-600" />
            Financial & Stock Intelligence Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive P&L statements, sales velocity, and inventory valuation analytics.</p>
        </div>
      </div>

      {/* Tabs and Date Pickers */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sales' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Analytics
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Valuation
          </button>
          <button
            onClick={() => setActiveTab('pl')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pl' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit & Loss (P&L)
          </button>
        </div>

        {activeTab !== 'inventory' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Sales Report View */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Invoices</span>
              <span className="text-lg font-black text-slate-900 font-mono">{salesReport?.totalOrders || 0} Orders</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross Sales Revenue</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {settings.currency} {(salesReport?.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross Profit</span>
              <span className="text-lg font-black text-indigo-700 font-mono">
                {settings.currency} {(salesReport?.grossProfit || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Order Value</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {settings.currency} {salesReport?.totalOrders ? Math.round(salesReport.totalRevenue / salesReport.totalOrders).toLocaleString() : 0}
              </span>
            </div>
          </div>

          {/* Top Selling Categories */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Sales Breakdown by Category</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesReport?.categoryBreakdown || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category_name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    formatter={(value: any) => [`${settings.currency} ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="total_revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Valuation View */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Fabric Quantity in Stock</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {(stockReport?.totalQuantity || 0).toLocaleString()} Metres
              </span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Cost Valuation (Purchase)</span>
              <span className="text-lg font-black text-indigo-700 font-mono">
                {settings.currency} {(stockReport?.totalCostValue || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Expected Retail Valuation</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {settings.currency} {(stockReport?.totalRetailValue || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5 text-right">Items Count</th>
                  <th className="px-3.5 py-2.5 text-right">Stock Quantity</th>
                  <th className="px-3.5 py-2.5 text-right">Cost Valuation</th>
                  <th className="px-3.5 py-2.5 text-right">Retail Potential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stockReport?.byCategory?.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">{c.category_name}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">{c.product_count}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold">{c.total_qty.toLocaleString()} m</td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-indigo-700">
                      {settings.currency} {c.cost_val.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-700">
                      {settings.currency} {c.retail_val.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* P&L Statement View */}
      {activeTab === 'pl' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs max-w-3xl mx-auto space-y-4">
          <div className="text-center border-b border-slate-200 pb-3">
            <h3 className="text-base font-black text-slate-900">{settings.store_name}</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Income & Profit Statement ({startDate} to {endDate})
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Total Sales Revenue</span>
              <span className="font-mono font-black text-emerald-700 text-sm">
                +{settings.currency} {(plReport?.revenue || 0).toLocaleString()}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Cost of Goods Sold (Fabric Purchase Cost)</span>
              <span className="font-mono font-bold text-rose-600">
                -{settings.currency} {(plReport?.cogs || 0).toLocaleString()}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg border border-slate-200">
              <span className="font-black text-slate-900">Gross Operating Margin</span>
              <span className="font-mono font-black text-indigo-700 text-sm">
                {settings.currency} {(plReport?.grossProfit || 0).toLocaleString()}
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Store Operating Expenses (Rent, Bills, Staff)</span>
              <span className="font-mono font-bold text-rose-600">
                -{settings.currency} {(plReport?.expenses || 0).toLocaleString()}
              </span>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center py-3 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
              <span className="font-black text-emerald-950 text-sm">NET NET PROFIT</span>
              <span className="font-mono font-black text-emerald-700 text-base">
                {settings.currency} {(plReport?.netProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
