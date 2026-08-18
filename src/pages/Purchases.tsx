import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Eye, FileText, Calendar, Building } from 'lucide-react';
import { ApiService } from '../services/api';
import { Purchase, PurchaseItem, Supplier, Product, StoreSettings, User } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface PurchasesProps {
  currentUser: User | null;
  settings: StoreSettings;
}

export const Purchases: React.FC<PurchasesProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError } = useNotification();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Selected for line item addition
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedVariationId, setSelectedVariationId] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemPrice, setItemPrice] = useState<number>(0);

  // Detail Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pData, sData, prData] = await Promise.all([
        ApiService.getPurchases(),
        ApiService.getSuppliers(),
        ApiService.getProducts()
      ]);
      setPurchases(pData);
      setSuppliers(sData);
      setProducts(prData);
    } catch (err: any) {
      showError(err.message || 'Failed to load purchase records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLineItem = () => {
    if (!selectedProductId || !selectedVariationId || itemQty <= 0 || itemPrice <= 0) {
      showError('Please choose product, variation, valid quantity and purchase cost');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const variation = prod?.variations?.find((v) => v.id === selectedVariationId);

    const newItem = {
      product_id: selectedProductId,
      variation_id: selectedVariationId,
      product_name: prod?.name || 'Fabric',
      variation_sku: variation?.sku || '',
      color: variation?.color || '',
      quantity: itemQty,
      unit_price: itemPrice,
      discount: 0,
      total_price: itemQty * itemPrice
    };

    setItems([...items, newItem]);
    setItemQty(10);
  };

  const handleRemoveLineItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + it.total_price, 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      showError('Please select a textile mill/supplier and add at least one line item');
      return;
    }

    try {
      const generatedInvoiceNo = invoiceNo || `${settings.purchase_prefix}${Date.now().toString().slice(-6)}`;
      await ApiService.createPurchase(
        {
          invoice_no: generatedInvoiceNo,
          supplier_id: supplierId,
          purchase_date: purchaseDate,
          subtotal: subtotal,
          discount: 0,
          tax: 0,
          grand_total: subtotal,
          paid_amount: paidAmount,
          balance_amount: Math.max(0, subtotal - paidAmount),
          payment_method: paymentMethod as any,
          notes
        },
        items,
        currentUser || undefined
      );

      showSuccess('Purchase order recorded and stock quantities updated!');
      setShowModal(false);
      setItems([]);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to record purchase');
    }
  };

  const filtered = purchases.filter(
    (p) =>
      p.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier_company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            Mill Purchase Orders & Fabric Receiving
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Record incoming fabric rolls/thans from mills, update stock, and track payable balances.</p>
        </div>
        <button
          onClick={() => {
            setSupplierId(suppliers[0]?.id || 0);
            setInvoiceNo('');
            setItems([]);
            setPaidAmount(0);
            setNotes('');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, mill name, company..."
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
                <th className="px-3.5 py-2.5">Invoice #</th>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Mill / Supplier</th>
                <th className="px-3.5 py-2.5 text-right">Items</th>
                <th className="px-3.5 py-2.5 text-right">Grand Total</th>
                <th className="px-3.5 py-2.5 text-right">Paid</th>
                <th className="px-3.5 py-2.5 text-right">Payable Dues</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold font-mono text-indigo-700">{p.invoice_no}</td>
                  <td className="px-3.5 py-2.5 text-[11px] text-slate-500 font-mono">{p.purchase_date}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-slate-900">{p.supplier_name}</div>
                    <div className="text-[10px] text-slate-400">{p.supplier_company}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[11px]">{p.items?.length || 0} items</td>
                  <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                    {settings.currency} {p.grand_total.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">
                    {settings.currency} {p.paid_amount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-600">
                    {settings.currency} {p.balance_amount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedPurchase(p);
                        setShowDetailModal(true);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No purchase orders recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Textile Mill Purchase Order"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePurchase} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mill / Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(parseInt(e.target.value))}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Mill...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.company})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Invoice # (Optional)</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. GA-9821"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Add Line Items Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 tracking-wider block">Add Fabric Line Item</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    setSelectedProductId(pid);
                    const prod = products.find((p) => p.id === pid);
                    if (prod && prod.variations && prod.variations.length > 0) {
                      setSelectedVariationId(prod.variations[0].id);
                      setItemPrice(prod.variations[0].purchase_price || prod.purchase_price || 0);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Fabric...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category_name || 'Fabric'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Quantity (m/rolls)"
                  value={itemQty}
                  onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  placeholder="Cost Price"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Items */}
            {items.length > 0 && (
              <div className="border border-slate-200 rounded-md overflow-hidden mt-2 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-1.5">Fabric</th>
                      <th className="p-1.5 text-right">Quantity</th>
                      <th className="p-1.5 text-right">Cost Price</th>
                      <th className="p-1.5 text-right">Total</th>
                      <th className="p-1.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 font-semibold text-slate-900">{it.product_name} ({it.variation_sku})</td>
                        <td className="p-1.5 text-right font-mono">{it.quantity}</td>
                        <td className="p-1.5 text-right font-mono">{settings.currency} {it.unit_price}</td>
                        <td className="p-1.5 text-right font-bold font-mono">{settings.currency} {it.total_price.toLocaleString()}</td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Amount ({settings.currency})</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / Cheque</option>
                <option value="Credit">Pay Later (Mill Credit)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <div className="text-sm font-black text-slate-900">
              Total: {settings.currency} {subtotal.toLocaleString()}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Purchase & Restock
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Purchase Order: ${selectedPurchase?.invoice_no}`}
        maxWidth="lg"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mill / Supplier</span>
                <span className="font-bold text-slate-900">{selectedPurchase.supplier_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Date</span>
                <span className="text-slate-800 font-mono">{selectedPurchase.purchase_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Amount</span>
                <span className="font-bold text-slate-900 font-mono">
                  {settings.currency} {selectedPurchase.grand_total.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Dues Remaining</span>
                <span className="font-bold text-rose-600 font-mono">
                  {settings.currency} {selectedPurchase.balance_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Fabric Item</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Unit Cost</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedPurchase.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <div className="font-bold text-slate-900">{it.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{it.variation_sku}</div>
                      </td>
                      <td className="p-2 text-right font-bold font-mono">{it.quantity} {it.unit_symbol || 'm'}</td>
                      <td className="p-2 text-right font-mono">{settings.currency} {it.unit_price.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold font-mono">{settings.currency} {it.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
