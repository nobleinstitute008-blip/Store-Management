import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Receipt, Printer, Database } from 'lucide-react';
import { ApiService } from '../services/api';
import { StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';

interface SettingsProps {
  currentUser: User | null;
  settings: StoreSettings;
  onSettingsUpdated: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, settings: initialSettings, onSettingsUpdated }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState<StoreSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleChange = (key: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await ApiService.updateSettings(formData, currentUser || undefined);
      showSuccess('Store configuration & printing preferences updated!');
      onSettingsUpdated();
    } catch (err: any) {
      showError(err.message || 'Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-600" />
            Emporium Settings & Hardware Setup
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure store branding, tax rates, thermal printer sizes, and invoice prefixes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Profile */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
            <Store className="w-4 h-4" />
            <span>Store Profile & Tax Identifiers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Brand Name</label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Orders Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Tax / STRN / NTN Number</label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => handleChange('tax_number', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tax_rate_percent}
                onChange={(e) => handleChange('tax_rate_percent', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* POS & Receipt Printing */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
            <Printer className="w-4 h-4" />
            <span>Thermal Receipt & Printer Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Printer Target Output</label>
              <select
                value={formData.printer_type}
                onChange={(e) => handleChange('printer_type', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="thermal_80mm">Thermal 80mm (Standard POS)</option>
                <option value="thermal_58mm">Thermal 58mm (Compact Mobile)</option>
                <option value="a4_laser">A4 Laser / Letterhead Tax Invoice</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={formData.low_stock_default}
                onChange={(e) => handleChange('low_stock_default', parseFloat(e.target.value) || 10)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note / Return Policy</label>
            <textarea
              rows={2}
              value={formData.receipt_footer}
              onChange={(e) => handleChange('receipt_footer', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
