import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Barcode,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Scissors
} from 'lucide-react';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdfService';
import { Product, ProductVariation, Category, Brand, Unit, StoreSettings, User } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useNotification } from '../components/common/NotificationContext';
import { BarcodeDisplay } from '../components/common/BarcodeDisplay';

interface InventoryProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Inventory: React.FC<InventoryProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError, showWarning } = useNotification();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tabs
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Product Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [brandId, setBrandId] = useState<number | undefined>();
  const [unitId, setUnitId] = useState<number | undefined>();
  const [fabricType, setFabricType] = useState('100% Egyptian Cotton');
  const [description, setDescription] = useState('');
  const [variations, setVariations] = useState<Partial<ProductVariation>[]>([]);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingVariation, setAdjustingVariation] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'damage'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');

  // Barcode Print Preview Modal
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedBarcodeVariation, setSelectedBarcodeVariation] = useState<any | null>(null);
  const [labelCopies, setLabelCopies] = useState(6);

  // Delete Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prods, cats, brnds, unts] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getBrands(),
        ApiService.getUnits()
      ]);
      setProducts(prods);
      setCategories(cats);
      setBrands(brnds);
      setUnits(unts);
    } catch (err: any) {
      showError('Failed to load inventory: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'all') return true;
    const totalStock = (p.variations || []).reduce((acc, v) => acc + v.current_stock, 0);
    const minStock = (p.variations || []).reduce((acc, v) => acc + v.min_stock, 0);

    if (statusFilter === 'out') return totalStock <= 0;
    if (statusFilter === 'low') return totalStock > 0 && totalStock <= minStock;
    return true;
  });

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCode(`FAB-${Date.now().toString().slice(-4)}`);
    setCategoryId(categories[0]?.id);
    setBrandId(brands[0]?.id);
    setUnitId(units[0]?.id);
    setFabricType('100% Pure Lawn');
    setDescription('');
    setVariations([
      {
        sku: `SKU-${Date.now().toString().slice(-4)}-01`,
        barcode: `890${Date.now().toString().slice(-9)}`,
        color: 'Navy Blue',
        size: '54" Width',
        fabric_type: 'Cotton',
        purchase_price: 350,
        sale_price: 650,
        current_stock: 50,
        min_stock: 10
      }
    ]);
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setCategoryId(p.category_id);
    setBrandId(p.brand_id);
    setUnitId(p.unit_id);
    setFabricType(p.fabric_type || '');
    setDescription(p.description || '');
    setVariations(p.variations ? JSON.parse(JSON.stringify(p.variations)) : []);
    setShowProductModal(true);
  };

  // Add Variation Row
  const handleAddVariationRow = () => {
    const nextIdx = variations.length + 1;
    setVariations([
      ...variations,
      {
        sku: `SKU-${Date.now().toString().slice(-4)}-0${nextIdx}`,
        barcode: `890${Date.now().toString().slice(-9)}`,
        color: 'Off-White',
        size: '54" Width',
        fabric_type: fabricType,
        purchase_price: variations[0]?.purchase_price || 350,
        sale_price: variations[0]?.sale_price || 650,
        current_stock: 30,
        min_stock: 10
      }
    ]);
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !unitId) {
      showError('Product name, code and unit are required');
      return;
    }

    if (variations.length === 0) {
      showError('At least one fabric color/cut variation is required');
      return;
    }

    try {
      if (editingProduct) {
        await ApiService.updateProduct(
          editingProduct.id,
          {
            name,
            code,
            category_id: categoryId,
            brand_id: brandId,
            unit_id: unitId,
            fabric_type: fabricType,
            description
          },
          variations,
          currentUser || undefined
        );
        showSuccess(`Product "${name}" updated successfully`);
      } else {
        await ApiService.createProduct(
          {
            name,
            code,
            category_id: categoryId,
            brand_id: brandId,
            unit_id: unitId,
            fabric_type: fabricType,
            description
          },
          variations,
          currentUser || undefined
        );
        showSuccess(`Fabric "${name}" added to catalog`);
      }

      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      showError('Failed to save product: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await ApiService.deleteProduct(productToDelete.id, currentUser || undefined);
      showSuccess(`Deleted ${productToDelete.name}`);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      showError('Failed to delete product: ' + err.message);
    }
  };

  // Handle Stock Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariation || adjustQty <= 0) {
      showError('Please enter a valid adjustment quantity');
      return;
    }

    try {
      await ApiService.adjustStock(
        adjustingVariation.id,
        adjustType,
        adjustQty,
        adjustReason || 'Manual Inventory Audit Correction',
        currentUser || undefined
      );

      showSuccess(`Stock for ${adjustingVariation.color} updated successfully`);
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      showError('Stock adjustment failed: ' + err.message);
    }
  };

  // Table Columns
  const columns: Column<Product>[] = [
    {
      header: 'Fabric Name & Details',
      accessor: (p) => (
        <div>
          <div className="font-bold text-white text-xs">{p.name}</div>
          <div className="text-[11px] text-slate-400">
            {p.category_name} • <span className="text-slate-300">{p.fabric_type}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Code / Brand',
      accessor: (p) => (
        <div>
          <div className="font-mono text-xs text-indigo-400">{p.code}</div>
          <div className="text-[10px] text-slate-400">{p.brand_name || '-'}</div>
        </div>
      )
    },
    {
      header: 'Variations & Colors',
      accessor: (p) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(p.variations || []).map((v) => (
            <span
              key={v.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBarcodeVariation({ ...v, product_name: p.name });
                setShowBarcodeModal(true);
              }}
              title="Click to print barcode"
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 cursor-pointer transition-colors"
            >
              {v.color} ({v.current_stock} {p.unit_symbol})
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Total Stock',
      accessor: (p) => {
        const total = (p.variations || []).reduce((acc, v) => acc + v.current_stock, 0);
        const min = (p.variations || []).reduce((acc, v) => acc + v.min_stock, 0);
        const isLow = total <= min;
        const isOut = total <= 0;

        return (
          <div className="text-left">
            <div
              className={`font-extrabold text-xs ${
                isOut ? 'text-rose-500' : isLow ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {total.toFixed(2)} {p.unit_symbol}
            </div>
            <div className="text-[10px] text-slate-500">Min: {min} {p.unit_symbol}</div>
          </div>
        );
      }
    },
    {
      header: 'Price Range',
      accessor: (p) => {
        const prices = (p.variations || []).map((v) => v.sale_price);
        const minP = Math.min(...(prices.length ? prices : [0]));
        const maxP = Math.max(...(prices.length ? prices : [0]));
        return (
          <div className="text-xs font-semibold text-slate-200">
            {settings.currency} {minP === maxP ? minP.toFixed(2) : `${minP} - ${maxP}`}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              if (p.variations && p.variations.length > 0) {
                setAdjustingVariation({ ...p.variations[0], product_name: p.name, unit_symbol: p.unit_symbol });
                setShowAdjustModal(true);
              }
            }}
            title="Adjust Stock"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEditModal(p)}
            title="Edit Fabric Product"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setProductToDelete(p);
              setShowDeleteConfirm(true);
            }}
            title="Delete Product"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Fabric Inventory & Stock Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage fabric types, rolls, meters, widths, color swatches, and stock limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => PdfService.generateStockReportPDF(products, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Valuation PDF</span>
          </button>

          <button
            id="inventory-add-product-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/50 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fabric</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Items ({products.length})
        </button>
        <button
          onClick={() => setStatusFilter('low')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'low'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Low Stock Alert
        </button>
        <button
          onClick={() => setStatusFilter('out')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'out'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Out of Stock
        </button>
      </div>

      {/* Main Datatable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search by fabric name, code, composition, color..."
        searchKeys={['name', 'code', 'fabric_type']}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Fabric Product' : 'Add New Fabric Product'}
        subtitle="Specify fabric compositions, units, and color variation rolls."
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fabric Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Swiss Voile"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Code / Article *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FAB-1092"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fabric Composition</label>
              <input
                type="text"
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                placeholder="e.g. 100% Linen / Pure Silk"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mill / Brand</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Measurement Unit *</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color & Cut Variations Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Color & Size Variations</h4>
                <p className="text-[11px] text-slate-400">Each variation maintains its own stock quantity, SKU, and barcode</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariationRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-indigo-400"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Color Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 font-semibold text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">Color / Shade</th>
                    <th className="p-2">Width / Size</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Barcode</th>
                    <th className="p-2">Cost Price</th>
                    <th className="p-2">Sale Price</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Min Alert</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {variations.map((v, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.color || ''}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].color = e.target.value;
                            setVariations(updated);
                          }}
                          placeholder="e.g. Royal Blue"
                          required
                          className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.size || ''}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].size = e.target.value;
                            setVariations(updated);
                          }}
                          placeholder='e.g. 54" Width'
                          className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].sku = e.target.value;
                            setVariations(updated);
                          }}
                          className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.barcode || ''}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].barcode = e.target.value;
                            setVariations(updated);
                          }}
                          className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.purchase_price ?? 0}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].purchase_price = parseFloat(e.target.value) || 0;
                            setVariations(updated);
                          }}
                          className="w-18 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.sale_price ?? 0}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].sale_price = parseFloat(e.target.value) || 0;
                            setVariations(updated);
                          }}
                          className="w-18 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right font-bold text-emerald-400"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.current_stock ?? 0}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].current_stock = parseFloat(e.target.value) || 0;
                            setVariations(updated);
                          }}
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.min_stock ?? 10}
                          onChange={(e) => {
                            const updated = [...variations];
                            updated[idx].min_stock = parseFloat(e.target.value) || 0;
                            setVariations(updated);
                          }}
                          className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white text-center"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {variations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/50"
            >
              {editingProduct ? 'Save Changes' : 'Create Fabric Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {adjustingVariation && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title="Manual Stock Adjustment"
          subtitle={`Adjust physical roll meters for ${adjustingVariation.product_name} (${adjustingVariation.color})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
              <div className="text-slate-400">Current Stock:</div>
              <div className="text-lg font-bold text-white">
                {adjustingVariation.current_stock} {adjustingVariation.unit_symbol}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['add', 'subtract', 'damage'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdjustType(t)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      adjustType === t
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {t === 'add' ? '+ Add Stock' : t === 'subtract' ? '- Deduct' : 'Damage/Shrinkage'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity to Adjust ({adjustingVariation.unit_symbol})
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note for Audit Log</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. End of month physical inventory audit variance"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Confirm Stock Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Barcode Print Preview Modal */}
      {selectedBarcodeVariation && (
        <Modal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          title="Print Fabric Barcode Label"
          subtitle={selectedBarcodeVariation.product_name}
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">{settings.store_name}</div>
              <div className="text-sm font-extrabold text-white">{selectedBarcodeVariation.product_name}</div>
              <div className="text-xs text-slate-400 mb-2">
                {selectedBarcodeVariation.color} • SKU: {selectedBarcodeVariation.sku}
              </div>
              <BarcodeDisplay value={selectedBarcodeVariation.barcode} width={1.8} height={45} />
              <div className="text-base font-extrabold text-emerald-400 mt-2">
                {settings.currency} {selectedBarcodeVariation.sale_price.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <label className="text-xs text-slate-300 font-semibold">Number of Labels:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={labelCopies}
                onChange={(e) => setLabelCopies(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-center text-xs text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBarcodeModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  PdfService.printBarcodeLabels(
                    [
                      {
                        sku: selectedBarcodeVariation.sku,
                        barcode: selectedBarcodeVariation.barcode,
                        name: selectedBarcodeVariation.product_name,
                        color: selectedBarcodeVariation.color,
                        price: selectedBarcodeVariation.sale_price
                      }
                    ],
                    settings,
                    labelCopies
                  );
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker Labels</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Fabric Product?"
        message={`Are you sure you want to remove "${productToDelete?.name}" and all its color variations? This action will update the SQLite database.`}
        confirmLabel="Delete Fabric"
        variant="danger"
      />
    </div>
  );
};
