import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User as UserIcon,
  Printer,
  FileText,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
  CheckCircle,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdfService';
import { Customer, SaleItem, StoreSettings, User, Category } from '../types';
import { useNotification } from '../components/common/NotificationContext';
import { Modal } from '../components/common/Modal';

interface POSProps {
  currentUser: User | null;
  settings: StoreSettings;
}

interface CartItem extends SaleItem {
  max_stock: number;
  is_decimal: number;
  product_code?: string;
}

export const POS: React.FC<POSProps> = ({ currentUser, settings }) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Search & Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Store Credit'>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed Sale Modal for Instant Printing
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Quick Customer Creation Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [cats, custs] = await Promise.all([ApiService.getCategories(), ApiService.getCustomers()]);
      setCategories(cats);
      setCustomers(custs);
    } catch (err: any) {
      showError('Failed to load POS data: ' + err.message);
    }
  };

  // Search variations on query change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      ApiService.searchVariations(searchQuery).then((res) => {
        setSearchResults(res);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle Barcode Scan / Keydown
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const results = await ApiService.searchVariations(searchQuery.trim());
      if (results.length > 0) {
        // Direct match
        const match = results[0];
        addItemToCart(match);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        showWarning(`No fabric found matching barcode / SKU: ${searchQuery}`);
      }
    } catch (err: any) {
      showError('Barcode lookup failed');
    }
  };

  // Add Item to Cart
  const addItemToCart = (item: any) => {
    if (item.current_stock <= 0) {
      showError(`Item '${item.product_name} (${item.color})' is out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((c) => c.variation_id === item.variation_id);
      if (existingIdx >= 0) {
        const existing = prevCart[existingIdx];
        const newQty = existing.quantity + 1.0;
        if (newQty > item.current_stock) {
          showWarning(`Cannot add more. Available stock is ${item.current_stock} ${item.unit_symbol}`);
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          total_price: newQty * existing.unit_price - (existing.discount || 0)
        };
        return updated;
      } else {
        const newItem: CartItem = {
          product_id: item.product_id,
          product_name: item.product_name,
          variation_id: item.variation_id,
          variation_sku: item.sku,
          color: item.color,
          size: item.size,
          fabric_type: item.fabric_type,
          quantity: 1.0,
          unit_symbol: item.unit_symbol || 'm',
          unit_price: item.sale_price,
          discount: 0,
          total_price: item.sale_price,
          max_stock: item.current_stock,
          is_decimal: item.is_decimal ?? 1
        };
        return [newItem, ...prevCart];
      }
    });

    showSuccess(`Added ${item.product_name} (${item.color}) to cart`);
  };

  // Update Cart Item Quantity
  const updateQuantity = (variationId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(variationId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.variation_id === variationId) {
          if (newQty > item.max_stock) {
            showWarning(`Maximum available stock is ${item.max_stock} ${item.unit_symbol}`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            total_price: newQty * item.unit_price - item.discount
          };
        }
        return item;
      })
    );
  };

  // Adjust Decimal Length (e.g. +0.25m, +0.5m, +1.0m)
  const addLength = (variationId: number, lengthToAdd: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.variation_id === variationId) {
          const newQty = Math.round((item.quantity + lengthToAdd) * 100) / 100;
          if (newQty > item.max_stock) {
            showWarning(`Stock limit exceeded. Only ${item.max_stock} ${item.unit_symbol} in stock`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            total_price: newQty * item.unit_price - item.discount
          };
        }
        return item;
      })
    );
  };

  // Remove from Cart
  const removeFromCart = (variationId: number) => {
    setCart((prev) => prev.filter((i) => i.variation_id !== variationId));
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOverallDiscountPercent(0);
    setPaidAmount(0);
    setSaleNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = (subtotal * overallDiscountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (settings.tax_rate_percent || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const changeAmount = Math.max(0, paidAmount - grandTotal);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  // Auto-set paid amount when grand total changes if not explicitly overridden
  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

  // Submit and Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError('Cart is empty. Add fabric items to checkout.');
      return;
    }

    setIsProcessing(true);
    try {
      const invoiceNo = `${settings.invoice_prefix || 'INV-2026-'}${Date.now().toString().slice(-6)}`;

      const saleData = {
        invoice_no: invoiceNo,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customer_phone: selectedCustomer ? selectedCustomer.phone : '',
        sale_date: new Date().toISOString().split('T')[0],
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        grand_total: grandTotal,
        paid_amount: Math.min(paidAmount, grandTotal),
        balance_amount: balanceDue,
        change_amount: changeAmount,
        payment_method: paymentMethod,
        payment_status: (balanceDue <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid') as any,
        notes: saleNotes,
        items: cart
      };

      const saleId = await ApiService.createSale(saleData, cart, currentUser || undefined);

      // Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showSuccess(`Invoice #${invoiceNo} processed successfully!`);

      // Prepare for receipt print modal
      setLastCompletedSale({ ...saleData, id: saleId });
      setShowReceiptModal(true);

      // Reset Cart
      handleClearCart();
    } catch (err: any) {
      showError(err.message || 'Transaction failed. Stock was not modified.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showError('Name and phone are required');
      return;
    }
    try {
      const code = `CUST-${Date.now().toString().slice(-4)}`;
      const id = await ApiService.createCustomer(
        { customer_code: code, name: newCustName, phone: newCustPhone },
        currentUser || undefined
      );
      const newCust: Customer = {
        id,
        customer_code: code,
        name: newCustName,
        phone: newCustPhone,
        opening_balance: 0,
        current_balance: 0,
        created_at: new Date().toISOString()
      };
      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomer(newCust);
      setShowNewCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      showSuccess(`Customer ${newCustName} created and selected`);
    } catch (err: any) {
      showError('Failed to create customer: ' + err.message);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-6 select-none">
      {/* Left Column: Product Search, Catalog & Category Pills */}
      <div className="flex-1 flex flex-col bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm overflow-hidden min-w-0">
        {/* Barcode & Search Bar */}
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2.5 mb-4">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              id="pos-barcode-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode or Search Fabric by Name, SKU, Color..."
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-950/50 transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Cloth Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            All Fabrics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Fabric Items Grid / Search Results */}
        <div className="flex-1 overflow-y-auto pr-1">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {searchResults.map((item) => (
                <div
                  key={item.variation_id}
                  onClick={() => addItemToCart(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    item.current_stock <= 0
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-indigo-500/50 hover:shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        {item.category_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          item.current_stock <= item.min_stock
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.current_stock} {item.unit_symbol}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-white line-clamp-1">{item.product_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Color: <span className="text-slate-300 font-semibold">{item.color}</span> • {item.size}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                    <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {settings.currency} {item.sale_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Barcode className="w-12 h-12 text-slate-600 stroke-[1.2] mb-3" />
              <div className="text-sm font-bold text-slate-300">Scan Barcode or Search Fabrics</div>
              <div className="text-xs text-slate-500 mt-1 text-center max-w-xs">
                Scan fabric bolt barcodes directly or type keywords to quickly select colors and cuts.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Cart, Customer Selection, Length Editor & Checkout */}
      <div className="w-full lg:w-[440px] flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md shrink-0">
        {/* Customer Selector Row */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer Account
            </label>
            <select
              id="pos-customer-select"
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const found = customers.find((c) => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Walk-in Customer (Cash Sale)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Due: {settings.currency} {c.current_balance}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCustomerModal(true)}
            title="Add New Customer"
            className="mt-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.variation_id}
                className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white line-clamp-1">{item.product_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.color} • <span className="font-mono text-[10px]">{item.variation_sku}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.variation_id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Length / Quantity Selector with Quick Decimal Buttons */}
                <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.variation_id, item.quantity - 0.5)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step={item.is_decimal ? '0.25' : '1'}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.variation_id, parseFloat(e.target.value) || 0)}
                      className="w-14 text-center text-xs font-bold text-white bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">{item.unit_symbol}</span>
                    <button
                      onClick={() => updateQuantity(item.variation_id, item.quantity + 0.5)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Fabric Quick Adders */}
                  {item.is_decimal === 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addLength(item.variation_id, 0.25)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        +0.25
                      </button>
                      <button
                        onClick={() => addLength(item.variation_id, 0.5)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        +0.5
                      </button>
                      <button
                        onClick={() => addLength(item.variation_id, 1.0)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        +1.0
                      </button>
                    </div>
                  )}

                  <div className="text-right font-extrabold text-xs text-emerald-400">
                    {settings.currency} {item.total_price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
              <Tag className="w-8 h-8 text-slate-600 mb-2" />
              <div className="text-xs font-semibold text-slate-400">POS Cart is Empty</div>
            </div>
          )}
        </div>

        {/* Pricing Summary & Payment Controls */}
        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
          {/* Subtotal & Discount Row */}
          <div className="flex items-center justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-200">
              {settings.currency} {subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              Discount (%):
              <input
                type="number"
                min="0"
                max="100"
                value={overallDiscountPercent}
                onChange={(e) => setOverallDiscountPercent(parseFloat(e.target.value) || 0)}
                className="w-12 px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-center text-xs text-white"
              />
            </span>
            <span className="text-rose-400 font-semibold">
              -{settings.currency} {discountAmount.toFixed(2)}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between py-2 border-y border-slate-800 bg-slate-950/40 px-2 rounded-xl">
            <span className="font-extrabold text-sm text-white">GRAND TOTAL:</span>
            <span className="font-extrabold text-base text-emerald-400">
              {settings.currency} {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Method Pills */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {(['Cash', 'Card', 'Bank Transfer', 'Store Credit'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                  paymentMethod === method
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Amount Paid & Change Calculation */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Amount Paid</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                {changeAmount > 0 ? 'Change to Return' : 'Balance Due'}
              </label>
              <div
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                  changeAmount > 0
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                    : balanceDue > 0
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {settings.currency} {(changeAmount > 0 ? changeAmount : balanceDue).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Checkout & Clear Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              id="pos-clear-cart-btn"
              type="button"
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="pos-complete-sale-btn"
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isProcessing ? 'Processing Transaction...' : 'COMPLETE SALE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completed Sale Receipt Modal */}
      {lastCompletedSale && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Sale Completed Successfully"
          subtitle={`Invoice #${lastCompletedSale.invoice_no} has been recorded in SQLite.`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
              <div className="font-bold text-sm">Amount Paid: {settings.currency} {lastCompletedSale.paid_amount.toFixed(2)}</div>
              {lastCompletedSale.change_amount > 0 && (
                <div className="mt-1 font-semibold text-emerald-400">
                  Change Returned: {settings.currency} {lastCompletedSale.change_amount.toFixed(2)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="pos-print-thermal-btn"
                type="button"
                onClick={() => {
                  PdfService.printThermalReceipt(lastCompletedSale, settings);
                }}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Thermal 80mm Receipt</span>
              </button>

              <button
                id="pos-print-a4-btn"
                type="button"
                onClick={() => {
                  PdfService.generateA4InvoicePDF(lastCompletedSale, settings);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download A4 Invoice</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        title="Add New Customer"
        subtitle="Register customer for store ledger & credit tracking"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Full Name</label>
            <input
              type="text"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Master Tailors / Ayesha Khan"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / WhatsApp</label>
            <input
              type="text"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewCustomerModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md"
            >
              Save & Select Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
