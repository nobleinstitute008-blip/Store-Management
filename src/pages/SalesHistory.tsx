import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Eye, Printer, FileText, Download, User as UserIcon, Calendar } from 'lucide-react';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdfService';
import { Sale, StoreSettings } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface SalesHistoryProps {
  settings: StoreSettings;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ settings }) => {
  const { showSuccess, showError } = useNotification();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getSales();
      setSales(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load sales invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDetails = async (sale: Sale) => {
    try {
      const full = await ApiService.getSaleById(sale.id);
      setSelectedSale(full || sale);
      setShowDetailModal(true);
    } catch (err: any) {
      showError('Failed to fetch invoice line items');
    }
  };

  const handlePrint = (sale: Sale) => {
    PdfService.printThermalReceipt(sale, settings);
  };

  const handleDownload = (sale: Sale) => {
    PdfService.generateA4InvoicePDF(sale, settings);
    showSuccess(`Invoice ${sale.invoice_no} generated as PDF`);
  };

  const filtered = sales.filter((s) => {
    const matchSearch =
      s.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.payment_method || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Sales Invoices & Billing History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Search, review, reprint thermal receipts, and download PDF tax invoices.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer name, payment method..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid in Full</option>
          <option value="partial">Partially Paid</option>
          <option value="unpaid">Unpaid / Credit</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-2.5">Invoice #</th>
                <th className="px-3.5 py-2.5">Date & Time</th>
                <th className="px-3.5 py-2.5">Customer</th>
                <th className="px-3.5 py-2.5 text-right">Items</th>
                <th className="px-3.5 py-2.5 text-right">Grand Total</th>
                <th className="px-3.5 py-2.5 text-right">Paid</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold font-mono text-indigo-700">{s.invoice_no}</td>
                  <td className="px-3.5 py-2.5 text-[11px] text-slate-500 font-mono">
                    {s.created_at ? new Date(s.created_at).toLocaleString('en-GB') : '-'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{s.customer_name || 'Walk-in Customer'}</div>
                    <div className="text-[10px] text-slate-400">{s.payment_method}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[11px]">{s.items?.length || 0} items</td>
                  <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                    {settings.currency} {s.grand_total.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">
                    {settings.currency} {s.paid_amount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.payment_status === 'partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewDetails(s)}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="View Line Items"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrint(s)}
                        className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Print Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(s)}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Invoice ${selectedSale?.invoice_no}`}
        maxWidth="lg"
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer</span>
                <span className="font-bold text-slate-900">{selectedSale.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Date</span>
                <span className="text-slate-800 font-mono">
                  {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleString('en-GB') : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Method</span>
                <span className="font-semibold text-slate-800">{selectedSale.payment_method}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                <span className="font-bold uppercase text-emerald-700">{selectedSale.payment_status}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Discount</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedSale.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-bold text-slate-900">{it.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {it.variation_sku} {it.color ? `· ${it.color}` : ''}
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {settings.currency} {it.unit_price.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-bold font-mono">
                        {it.quantity} {it.unit_symbol || 'm'}
                      </td>
                      <td className="p-2 text-right text-rose-600 font-mono">
                        {it.discount ? `-${settings.currency} ${it.discount}` : '-'}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900 font-mono">
                        {settings.currency} {it.total_price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <div className="text-slate-500 text-[11px]">
                {selectedSale.notes ? `Notes: ${selectedSale.notes}` : 'No invoice notes'}
              </div>
              <div className="text-right space-y-1">
                <div className="text-slate-600">Subtotal: {settings.currency} {selectedSale.subtotal.toLocaleString()}</div>
                {selectedSale.discount > 0 && (
                  <div className="text-rose-600">Discount: -{settings.currency} {selectedSale.discount.toLocaleString()}</div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="text-slate-600">Tax: +{settings.currency} {selectedSale.tax.toLocaleString()}</div>
                )}
                <div className="text-sm font-black text-slate-900">
                  Grand Total: {settings.currency} {selectedSale.grand_total.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrint(selectedSale)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedSale)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
