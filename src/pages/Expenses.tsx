import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Trash2, Calendar, Tag } from 'lucide-react';
import { ApiService } from '../services/api';
import { Expense, ExpenseCategory, StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface ExpensesProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Expenses: React.FC<ExpensesProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eData, cData] = await Promise.all([
        ApiService.getExpenses(),
        ApiService.getExpenseCategories()
      ]);
      setExpenses(eData);
      setCategories(cData);
      if (cData.length > 0) setCategoryId(cData[0].id);
    } catch (err: any) {
      showError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0 || !categoryId) return;

    try {
      await ApiService.createExpense(
        {
          category_id: categoryId,
          description: notes ? `${title} - ${notes}` : title,
          amount,
          date: expenseDate,
          payment_method: paymentMethod as any
        },
        currentUser || undefined
      );
      showSuccess('Expense recorded');
      setShowModal(false);
      setTitle('');
      setAmount(0);
      setNotes('');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to record expense');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ApiService.deleteExpense(id, currentUser || undefined);
      showSuccess('Expense deleted');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to delete expense');
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filtered = expenses.filter(
    (e) =>
      (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.payment_method || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600" />
            Store Expense Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track shop rent, electricity bills, staff salaries, refreshments, and operational costs.</p>
        </div>
        <button
          onClick={() => {
            setTitle('');
            setAmount(0);
            setNotes('');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Recorded Expenses</span>
          <span className="text-lg font-black text-rose-600 font-mono">
            {settings.currency} {totalExpense.toLocaleString()}
          </span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Categories</span>
          <span className="text-lg font-black text-slate-800 font-mono">{categories.length} Categories</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Transactions Count</span>
          <span className="text-lg font-black text-slate-800 font-mono">{expenses.length} Entries</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by title, category, remarks..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Category</th>
                <th className="px-3.5 py-2.5">Title / Description</th>
                <th className="px-3.5 py-2.5">Payment Method</th>
                <th className="px-3.5 py-2.5 text-right">Amount</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">{e.date}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                      {e.category_name}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{e.description}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600">{e.payment_method}</td>
                  <td className="px-3.5 py-2.5 text-right font-black text-rose-600 font-mono">
                    {settings.currency} {e.amount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Shop Operating Expense"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Electricity Bill / Staff Lunch / Generator Fuel"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ({settings.currency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Cash">Cash Drawer</option>
              <option value="Bank Transfer">Bank Transfer / Online</option>
              <option value="Petty Cash">Petty Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid to WAPDA / LESCO"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
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
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
