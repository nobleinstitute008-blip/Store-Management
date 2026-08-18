import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { Unit } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Units: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isDecimal, setIsDecimal] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getUnits();
      setUnits(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load measurement units');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !symbol.trim()) return;

    try {
      if (editingUnit) {
        await ApiService.updateUnit(editingUnit.id, {
          name: name.trim(),
          symbol: symbol.trim(),
          is_decimal: isDecimal ? 1 : 0
        });
        showSuccess('Unit updated successfully');
      } else {
        await ApiService.createUnit({
          name: name.trim(),
          symbol: symbol.trim(),
          is_decimal: isDecimal ? 1 : 0
        });
        showSuccess('Unit created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Error saving unit');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ApiService.deleteUnit(deleteTarget.id);
      showSuccess('Unit deleted');
      setShowDeleteConfirm(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Cannot delete unit');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-600" />
            Fabric Measurement Units
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage units of measurement (Metres, Yards, Than/Rolls, Pieces, Gaz, Suits).</p>
        </div>
        <button
          onClick={() => {
            setEditingUnit(null);
            setName('');
            setSymbol('');
            setIsDecimal(true);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Unit</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Unit Name</th>
                <th className="px-4 py-2.5">Symbol</th>
                <th className="px-4 py-2.5">Decimal Precision Allowed</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{u.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                      {u.symbol}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.is_decimal ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes (e.g. 2.75 m)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Integer Only (e.g. 1 roll)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingUnit(u);
                          setName(u.name);
                          setSymbol(u.symbol);
                          setIsDecimal(!!u.is_decimal);
                          setShowModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Unit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(u);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {units.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No measurement units configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUnit ? 'Edit Measurement Unit' : 'Create Measurement Unit'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metres, Yards, Than, Gaz"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. m, yd, than, pcs, gaz"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              id="unit-decimal-check"
              type="checkbox"
              checked={isDecimal}
              onChange={(e) => setIsDecimal(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="unit-decimal-check" className="text-xs text-slate-700 select-none cursor-pointer">
              Allow Fractional / Decimal Quantities (e.g. 1.25, 3.50 m)
            </label>
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
              Save Unit
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Measurement Unit"
        message={`Are you sure you want to delete unit "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
