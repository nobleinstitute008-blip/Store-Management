import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { Category, Brand, User } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useNotification } from '../components/common/NotificationContext';

interface CategoriesProps {
  currentUser: User | null;
}

export const Categories: React.FC<CategoriesProps> = ({ currentUser }) => {
  const { showSuccess, showError } = useNotification();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Brand Modal
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // Delete Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'cat' | 'brand'; item: any } | null>(null);

  const loadData = async () => {
    try {
      const [cats, brnds] = await Promise.all([ApiService.getCategories(), ApiService.getBrands()]);
      setCategories(cats);
      setBrands(brnds);
    } catch (err: any) {
      showError('Failed to load categories: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCat) {
        await ApiService.updateCategory(editingCat.id, { name: catName, description: catDesc });
        showSuccess('Category updated');
      } else {
        await ApiService.createCategory({ name: catName, description: catDesc });
        showSuccess('Category created');
      }
      setShowCatModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Save Brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      if (editingBrand) {
        await ApiService.updateBrand(editingBrand.id, { name: brandName, description: brandDesc });
        showSuccess('Mill / Brand updated');
      } else {
        await ApiService.createBrand({ name: brandName, description: brandDesc });
        showSuccess('Mill / Brand added');
      }
      setShowBrandModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'cat') {
        await ApiService.deleteCategory(deleteTarget.item.id);
        showSuccess('Category deleted');
      } else {
        await ApiService.deleteBrand(deleteTarget.item.id);
        showSuccess('Brand deleted');
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tags className="w-4 h-4 text-indigo-600" />
            Cloth Categories & Textile Mills
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Organize fabrics by categories, weaves, and manufacturer mills.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories Section */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Tags className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fabric Categories</h3>
            </div>
            <button
              onClick={() => {
                setEditingCat(null);
                setCatName('');
                setCatDesc('');
                setShowCatModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                  <div className="text-[11px] text-slate-500">{cat.description || 'No description'}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCat(cat);
                      setCatName(cat.name);
                      setCatDesc(cat.description || '');
                      setShowCatModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'cat', item: cat });
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mills / Brands Section */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mills & Brands</h3>
            </div>
            <button
              onClick={() => {
                setEditingBrand(null);
                setBrandName('');
                setBrandDesc('');
                setShowBrandModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Mill / Brand</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {brands.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{b.name}</div>
                  <div className="text-[11px] text-slate-500">{b.description || 'Textile mill / brand'}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingBrand(b);
                      setBrandName(b.name);
                      setBrandDesc(b.description || '');
                      setShowBrandModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'brand', item: b });
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title={editingCat ? 'Edit Category' : 'Create Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Lawn Fabric / Chiffon / Velvet"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              rows={3}
              placeholder="Category details..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCatModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Brand Modal */}
      <Modal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title={editingBrand ? 'Edit Mill / Brand' : 'Add Mill / Brand'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBrand} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Textile Mill Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Gul Ahmed / Alkaram / Sapphire"
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              rows={3}
              placeholder="Mill details..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowBrandModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save Mill
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Item?"
        message={`Are you sure you want to delete "${deleteTarget?.item?.name}"?`}
      />
    </div>
  );
};

