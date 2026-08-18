import React, { useState, useEffect } from 'react';
import { QrCode, Printer, Search, Tag, Eye } from 'lucide-react';
import { ApiService } from '../services/api';
import { Product, StoreSettings } from '../types';
import { BarcodeDisplay } from '../components/common/BarcodeDisplay';
import { useNotification } from '../components/common/NotificationContext';

interface BarcodeStudioProps {
  settings: StoreSettings;
}

export const BarcodeStudio: React.FC<BarcodeStudioProps> = ({ settings }) => {
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<any[]>([]);
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getProducts();
      setProducts(data);
    } catch (err: any) {
      showError('Failed to load fabric list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleSelect = (prod: Product, variation: any) => {
    const itemKey = `${prod.id}-${variation.id}`;
    const exists = selectedVariations.find((v) => v.key === itemKey);
    if (exists) {
      setSelectedVariations(selectedVariations.filter((v) => v.key !== itemKey));
    } else {
      setSelectedVariations([
        ...selectedVariations,
        {
          key: itemKey,
          productId: prod.id,
          productName: prod.name,
          fabricType: prod.fabric_type || 'Fabric',
          color: variation.color,
          sku: variation.sku,
          barcode: variation.barcode || variation.sku,
          retailPrice: variation.sale_price || prod.sale_price,
          unitSymbol: variation.unit_symbol || 'm'
        }
      ]);
    }
  };

  const handlePrintLabels = () => {
    if (selectedVariations.length === 0) {
      showError('Please select at least one fabric variation to print stickers');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Price Labels</title>
          <style>
            body { font-family: monospace; padding: 10px; margin: 0; }
            .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .label-card { border: 1px dashed #333; padding: 8px; text-align: center; border-radius: 6px; page-break-inside: avoid; }
            .store-name { font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .prod-name { font-size: 11px; font-weight: bold; margin: 2px 0; }
            .sku { font-size: 10px; color: #555; }
            .price { font-size: 13px; font-weight: 900; margin-top: 4px; }
            @media print {
              body { padding: 0; }
              .label-card { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${selectedVariations
              .flatMap((item) => Array(copiesPerItem).fill(item))
              .map(
                (item) => `
              <div class="label-card">
                <div class="store-name">${settings.store_name}</div>
                <div class="prod-name">${item.productName} (${item.color})</div>
                <div class="sku">${item.sku}</div>
                <div style="margin: 4px 0;">
                  <svg id="bc-${item.barcode}"></svg>
                </div>
                <div class="price">${settings.currency} ${item.retailPrice.toLocaleString()} / ${item.unitSymbol}</div>
              </div>
            `
              )
              .join('')}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              ${selectedVariations
                .map(
                  (item) => `
                try {
                  JsBarcode("#bc-${item.barcode}", "${item.barcode}", { format: "CODE128", width: 1.5, height: 35, displayValue: true, fontSize: 10 });
                } catch(e) {}
              `
                )
                .join('')}
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase()) ||
      (p.fabric_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600" />
            Barcode Generator & Price Tag Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate Code128 barcodes and print standard price stickers for fabric bolts and rolls.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 font-semibold">Stickers/Item:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={handlePrintLabels}
            disabled={selectedVariations.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print {selectedVariations.length * copiesPerItem} Tags</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fabrics to generate barcode stickers..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Available Fabric Variations</span>
              <span className="text-slate-500 text-[11px]">{selectedVariations.length} items selected</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-xs text-slate-900">{p.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">({p.product_code})</span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700">
                      {settings.currency} {p.sale_price} / {p.default_unit_symbol || 'm'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                    {p.variations?.map((v) => {
                      const itemKey = `${p.id}-${v.id}`;
                      const isSelected = selectedVariations.some((item) => item.key === itemKey);
                      return (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(p, v)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="text-[11px]">{v.color || 'Standard'} ({v.sku})</div>
                              <div className="text-[10px] font-mono text-slate-400">{v.barcode || v.sku}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold font-mono">Stock: {v.current_stock}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs sticky top-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Live Sticker Preview
            </h3>

            {selectedVariations.length > 0 ? (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    {settings.store_name}
                  </div>
                  <div className="font-black text-xs text-slate-900">
                    {selectedVariations[0].productName} ({selectedVariations[0].color})
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    SKU: {selectedVariations[0].sku}
                  </div>
                  <div className="flex justify-center my-2">
                    <BarcodeDisplay
                      value={selectedVariations[0].barcode}
                      width={1.6}
                      height={40}
                      fontSize={11}
                    />
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    PRICE: {settings.currency} {selectedVariations[0].retailPrice.toLocaleString()} / {selectedVariations[0].unitSymbol}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 text-center italic">
                  Showing preview for 1 of {selectedVariations.length} selected items
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Check boxes on the left to preview price tag stickers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
