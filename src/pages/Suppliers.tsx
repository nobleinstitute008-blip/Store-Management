import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Search, Phone, Edit2, Building2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { Supplier, StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface SuppliersProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Suppliers: React.FC<SuppliersProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim() || !phone.trim()) return;

    try {
      if (editingSupplier) {
        await ApiService.updateSupplier(
          editingSupplier.id,
          { name, company, phone, whatsapp, email, address, city, tax_number: taxNumber, notes },
          currentUser || undefined
        );
        showSuccess('Supplier profile updated');
      } else {
        await ApiService.createSupplier(
          {
            name,
            company,
            phone,
            whatsapp,
            email,
            address,
            city,
            tax_number: taxNumber,
            opening_balance: openingBalance,
            notes
          },
          currentUser || undefined
        );
        showSuccess('Textile mill / supplier registered');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to save supplier');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Mill & Supplier Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage fabric mills, wholesalers, master distributors, and account payables.</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setName('');
            setCompany('');
            setPhone('');
            setWhatsapp('');
            setEmail('');
            setAddress('');
            setCity('');
            setTaxNumber('');
            setOpeningBalance(0);
            setNotes('');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Mill / Supplier</span>
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
            placeholder="Search mills by name, brand, phone number or city..."
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
                <th className="px-3.5 py-2.5">Supplier / Representative</th>
                <th className="px-3.5 py-2.5">Mill Company</th>
                <th className="px-3.5 py-2.5">Contact Phone</th>
                <th className="px-3.5 py-2.5">City & NTN</th>
                <th className="px-3.5 py-2.5 text-right">Payable Balance</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 font-bold">{s.supplier_code}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-indigo-700">{s.company}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-700">{s.phone}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">
                    <div>{s.city || 'Karachi / Faisalabad'}</div>
                    <div className="text-[10px] text-slate-400">{s.tax_number ? `NTN: ${s.tax_number}` : '-'}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span
                      className={`font-mono font-black ${
                        s.current_balance > 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {settings.currency} {s.current_balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditingSupplier(s);
                        setName(s.name);
                        setCompany(s.company);
                        setPhone(s.phone);
                        setWhatsapp(s.whatsapp || '');
                        setEmail(s.email || '');
                        setAddress(s.address || '');
                        setCity(s.city || '');
                        setTaxNumber(s.tax_number || '');
                        setNotes(s.notes || '');
                        setShowModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No supplier mills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Edit Supplier Profile' : 'Add Textile Mill / Supplier'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mill / Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Gul Ahmed Textile Mills"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 21 34567890"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Karachi / Faisalabad"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NTN / Tax Number</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="NTN-9182371-2"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Mill Unit</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot 14, SITE Industrial Area, Karachi"
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
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
