import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Edit2, DollarSign, CreditCard } from 'lucide-react';
import { ApiService } from '../services/api';
import { Customer, StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface CustomersProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Customers: React.FC<CustomersProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment settlement modal
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      if (editingCustomer) {
        await ApiService.updateCustomer(
          editingCustomer.id,
          { name, phone, whatsapp, email, address, city, notes },
          currentUser || undefined
        );
        showSuccess('Customer profile updated');
      } else {
        await ApiService.createCustomer(
          {
            name,
            phone,
            whatsapp,
            email,
            address,
            city,
            opening_balance: openingBalance,
            notes
          },
          currentUser || undefined
        );
        showSuccess('Customer registered successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to save customer');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || payAmount <= 0) return;

    try {
      await ApiService.recordCustomerPayment(
        payingCustomer.id,
        payAmount,
        payMethod,
        payNotes,
        currentUser || undefined
      );
      showSuccess(`Payment of ${settings.currency} ${payAmount.toLocaleString()} recorded`);
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to record payment');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.customer_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Customer Directory & Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer contact details, credit dues, and payment settlement ledgers.</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setName('');
            setPhone('');
            setWhatsapp('');
            setEmail('');
            setAddress('');
            setCity('');
            setOpeningBalance(0);
            setNotes('');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, code or city..."
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
                <th className="px-3.5 py-2.5">Code</th>
                <th className="px-3.5 py-2.5">Customer Name</th>
                <th className="px-3.5 py-2.5">Phone / WhatsApp</th>
                <th className="px-3.5 py-2.5">City & Address</th>
                <th className="px-3.5 py-2.5 text-right">Current Dues / Balance</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 font-bold">{c.customer_code}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-700">{c.phone}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">
                    <div>{c.city || 'Lahore'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{c.address || '-'}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span
                      className={`font-mono font-black ${
                        c.current_balance > 0
                          ? 'text-rose-600'
                          : c.current_balance < 0
                          ? 'text-emerald-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {settings.currency} {c.current_balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.current_balance > 0 && (
                        <button
                          onClick={() => {
                            setPayingCustomer(c);
                            setPayAmount(c.current_balance);
                            setPayMethod('Cash');
                            setPayNotes('');
                            setShowPayModal(true);
                          }}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Receive Payment
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingCustomer(c);
                          setName(c.name);
                          setPhone(c.phone);
                          setWhatsapp(c.whatsapp || '');
                          setEmail(c.email || '');
                          setAddress(c.address || '');
                          setCity(c.city || '');
                          setNotes(c.notes || '');
                          setShowModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mrs. Ayesha Tariq / Tariq Fabrics"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Karachi"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House 12, Street 4, Gulberg III"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {!editingCustomer && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance / Dues ({settings.currency})</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`Receive Payment: ${payingCustomer?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
            <span className="text-slate-600 font-semibold">Total Outstanding Balance:</span>
            <span className="font-mono font-bold text-rose-600 text-sm">
              {settings.currency} {payingCustomer?.current_balance.toLocaleString()}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ({settings.currency})</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              max={payingCustomer?.current_balance}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer / Raast</option>
              <option value="Card">Card POS</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Raast Ref #491028"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
