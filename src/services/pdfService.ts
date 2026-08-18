import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { Sale, Purchase, StoreSettings, Product } from '../types';

export const PdfService = {
  // 1. THERMAL POS RECEIPT (80mm / 58mm)
  printThermalReceipt(sale: Sale, settings: StoreSettings) {
    const is58mm = settings.printer_type === 'thermal_58mm';
    const width = is58mm ? '58mm' : '80mm';

    const itemsHtml = (sale.items || [])
      .map(
        (item) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 4px 0; text-align: left;">
          <div style="font-weight: bold; font-size: 11px;">${item.product_name || 'Fabric'}</div>
          <div style="font-size: 9px; color: #555;">${item.color || ''} | SKU: ${item.variation_sku || ''}</div>
          <div style="font-size: 9px;">${item.quantity} ${item.unit_symbol || 'm'} x ${settings.currency} ${item.unit_price.toFixed(2)}</div>
        </td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top; font-weight: bold; font-size: 11px;">
          ${settings.currency} ${item.total_price.toFixed(2)}
        </td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.invoice_no}</title>
        <style>
          @page { size: ${width} auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${width};
            margin: 0 auto;
            padding: 8px;
            font-size: 11px;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          .footer { font-size: 9px; text-align: center; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 15px; font-weight: bold; text-transform: uppercase;">${settings.store_name}</div>
          <div style="font-size: 9px;">${settings.tagline}</div>
          <div style="font-size: 9px;">${settings.address}, ${settings.city}</div>
          <div style="font-size: 9px;">Ph: ${settings.phone} | WA: ${settings.whatsapp}</div>
          ${settings.tax_number ? `<div style="font-size: 9px;">STRN/Tax: ${settings.tax_number}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px; display: flex; justify-content: space-between;">
          <span><strong>Inv #:</strong> ${sale.invoice_no}</span>
          <span><strong>Date:</strong> ${sale.sale_date}</span>
        </div>
        <div style="font-size: 10px;">
          <span><strong>Customer:</strong> ${sale.customer_name || 'Walk-in Customer'}</span>
          ${sale.customer_phone ? ` | <span>${sale.customer_phone}</span>` : ''}
        </div>
        <div style="font-size: 9px; color: #555;">Cashier: ${sale.creator_name || 'POS Station'}</div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 10px;">
              <th style="text-align: left; padding-bottom: 2px;">Fabric / Item</th>
              <th style="text-align: right; padding-bottom: 2px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right bold">${settings.currency} ${sale.subtotal.toFixed(2)}</td>
          </tr>
          ${
            sale.discount > 0
              ? `<tr>
            <td>Discount:</td>
            <td class="text-right bold">-${settings.currency} ${sale.discount.toFixed(2)}</td>
          </tr>`
              : ''
          }
          ${
            sale.tax > 0
              ? `<tr>
            <td>Tax (${settings.tax_rate_percent}%):</td>
            <td class="text-right bold">+${settings.currency} ${sale.tax.toFixed(2)}</td>
          </tr>`
              : ''
          }
          <tr style="font-size: 13px;">
            <td class="bold">GRAND TOTAL:</td>
            <td class="text-right bold">${settings.currency} ${sale.grand_total.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Paid (${sale.payment_method}):</td>
            <td class="text-right bold">${settings.currency} ${sale.paid_amount.toFixed(2)}</td>
          </tr>
          ${
            sale.change_amount > 0
              ? `<tr>
            <td>Change Returned:</td>
            <td class="text-right bold">${settings.currency} ${sale.change_amount.toFixed(2)}</td>
          </tr>`
              : ''
          }
          ${
            sale.balance_amount > 0
              ? `<tr style="color: #b91c1c;">
            <td class="bold">Remaining Due:</td>
            <td class="text-right bold">${settings.currency} ${sale.balance_amount.toFixed(2)}</td>
          </tr>`
              : ''
          }
        </table>

        <div class="double-divider"></div>

        <div class="footer">
          <p>${settings.receipt_footer}</p>
          <p style="font-size: 8px; margin-top: 4px;">Software: ClothStore Pro Offline v1.0</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
  },

  // 2. STANDARD A4 SALES INVOICE PDF
  generateA4InvoicePDF(sale: Sale, settings: StoreSettings) {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    // Store Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(settings.store_name, 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.tagline, 14, 23);
    doc.text(`${settings.address}, ${settings.city}`, 14, 27);
    doc.text(`Phone: ${settings.phone} | WhatsApp: ${settings.whatsapp} | Email: ${settings.email}`, 14, 31);
    if (settings.tax_number) {
      doc.text(`Tax / STRN Registration: ${settings.tax_number}`, 14, 35);
    }

    // Invoice Title Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(140, 12, 56, 26, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('SALES INVOICE', 145, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice #: ${sale.invoice_no}`, 145, 25);
    doc.text(`Date: ${sale.sale_date}`, 145, 30);
    doc.text(`Status: ${sale.payment_status.toUpperCase()}`, 145, 35);

    // Customer Box
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 42, 182, 20, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('Bill To (Customer Details):', 18, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Customer Name: ${sale.customer_name || 'Walk-in Customer'}`, 18, 54);
    if (sale.customer_phone) doc.text(`Contact: ${sale.customer_phone}`, 110, 54);
    doc.text(`Payment Method: ${sale.payment_method}`, 18, 59);
    doc.text(`Served By: ${sale.creator_name || 'Station Cashier'}`, 110, 59);

    // Line Items Table
    const tableRows = (sale.items || []).map((item, idx) => [
      idx + 1,
      `${item.product_name || 'Fabric'}\nColor: ${item.color || 'Standard'} | SKU: ${item.variation_sku || ''}`,
      `${item.quantity} ${item.unit_symbol || 'm'}`,
      `${settings.currency} ${item.unit_price.toFixed(2)}`,
      item.discount > 0 ? `${settings.currency} ${item.discount.toFixed(2)}` : '-',
      `${settings.currency} ${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 66,
      head: [['#', 'Fabric Description & Specification', 'Qty / Length', 'Unit Rate', 'Discount', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 82 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Totals Section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', 135, finalY);
    doc.text(`${settings.currency} ${sale.subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

    let currentY = finalY;
    if (sale.discount > 0) {
      currentY += 5;
      doc.text('Discount:', 135, currentY);
      doc.text(`-${settings.currency} ${sale.discount.toFixed(2)}`, 195, currentY, { align: 'right' });
    }

    if (sale.tax > 0) {
      currentY += 5;
      doc.text(`Tax (${settings.tax_rate_percent}%):`, 135, currentY);
      doc.text(`+${settings.currency} ${sale.tax.toFixed(2)}`, 195, currentY, { align: 'right' });
    }

    currentY += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(130, currentY - 4, 66, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Grand Total:', 135, currentY + 1.5);
    doc.text(`${settings.currency} ${sale.grand_total.toFixed(2)}`, 195, currentY + 1.5, { align: 'right' });

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Paid Amount:', 135, currentY);
    doc.text(`${settings.currency} ${sale.paid_amount.toFixed(2)}`, 195, currentY, { align: 'right' });

    if (sale.balance_amount > 0) {
      currentY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text('Balance Dues:', 135, currentY);
      doc.text(`${settings.currency} ${sale.balance_amount.toFixed(2)}`, 195, currentY, { align: 'right' });
    }

    // Terms & Footer
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Terms & Conditions:', 14, currentY + 15);
    doc.text(settings.receipt_footer, 14, currentY + 19, { maxWidth: 120 });

    doc.save(`Invoice_${sale.invoice_no}.pdf`);
  },

  // 3. PURCHASE ORDER INVOICE PDF
  generatePurchaseInvoicePDF(purchase: Purchase, settings: StoreSettings) {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(settings.store_name, 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PURCHASE ORDER & FABRIC RECEIVING NOTE', 14, 24);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(135, 12, 61, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`PO #: ${purchase.invoice_no}`, 140, 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${purchase.purchase_date}`, 140, 25);
    doc.text(`Status: ${purchase.status.toUpperCase()}`, 140, 31);

    // Supplier Info
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, 182, 18, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Supplier: ${purchase.supplier_name || 'N/A'} (${purchase.supplier_company || ''})`, 18, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Mode: ${purchase.payment_method} | Receiver: ${purchase.creator_name || 'Admin'}`, 18, 52);

    const rows = (purchase.items || []).map((item, idx) => [
      idx + 1,
      `${item.product_name || 'Fabric'} (${item.color || ''}) - SKU: ${item.variation_sku || ''}`,
      `${item.quantity} ${item.unit_symbol || 'm'}`,
      `${settings.currency} ${item.unit_price.toFixed(2)}`,
      `${settings.currency} ${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['#', 'Fabric / Product Variation', 'Quantity Received', 'Purchase Cost', 'Total Cost']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Grand Total: ${settings.currency} ${purchase.grand_total.toFixed(2)}`, 140, finalY);
    doc.text(`Paid: ${settings.currency} ${purchase.paid_amount.toFixed(2)}`, 140, finalY + 6);
    doc.text(`Balance Dues: ${settings.currency} ${purchase.balance_amount.toFixed(2)}`, 140, finalY + 12);

    doc.save(`Purchase_${purchase.invoice_no}.pdf`);
  },

  // 4. INVENTORY STOCK REPORT PDF
  generateStockReportPDF(products: Product[], settings: StoreSettings) {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${settings.store_name} - Fabric Inventory Valuation Report`, 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Generated On: ${new Date().toLocaleString()}`, 14, 24);

    const rows: any[] = [];
    let totalStockMeters = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      (p.variations || []).forEach((v) => {
        const val = v.current_stock * v.purchase_price;
        totalStockMeters += v.current_stock;
        totalValuation += val;

        rows.push([
          p.name,
          v.sku,
          v.color,
          p.category_name || '-',
          `${v.current_stock} ${v.unit_symbol || 'm'}`,
          `${settings.currency} ${v.purchase_price.toFixed(2)}`,
          `${settings.currency} ${v.sale_price.toFixed(2)}`,
          `${settings.currency} ${val.toFixed(2)}`,
          v.current_stock <= v.min_stock ? 'LOW STOCK' : 'OK'
        ]);
      });
    });

    autoTable(doc, {
      startY: 30,
      head: [['Fabric Name', 'SKU', 'Color', 'Category', 'Stock Qty', 'Cost Price', 'Sale Price', 'Valuation', 'Status']],
      body: rows,
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Total Stock Quantity: ${totalStockMeters.toFixed(2)} Units`, 14, finalY);
    doc.text(`Total Inventory Value: ${settings.currency} ${totalValuation.toLocaleString()}`, 120, finalY);

    doc.save('Inventory_Valuation_Report.pdf');
  },

  // 5. BARCODE LABELS SHEET
  printBarcodeLabels(
    variations: Array<{ sku: string; barcode: string; name: string; color: string; price: number }>,
    settings: StoreSettings,
    copies = 1
  ) {
    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) return;

    let labelsHtml = '';

    variations.forEach((v) => {
      for (let i = 0; i < copies; i++) {
        labelsHtml += `
          <div class="barcode-card">
            <div class="store-name">${settings.store_name}</div>
            <div class="prod-name">${v.name}</div>
            <div class="prod-attr">${v.color} | SKU: ${v.sku}</div>
            <svg id="barcode-${v.barcode}-${i}"></svg>
            <div class="prod-price">${settings.currency} ${v.price.toFixed(2)}</div>
          </div>
        `;
      }
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { size: auto; margin: 10mm; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .barcode-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .barcode-card {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            border-radius: 4px;
            page-break-inside: avoid;
          }
          .store-name { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #444; }
          .prod-name { font-size: 11px; font-weight: bold; margin: 2px 0; }
          .prod-attr { font-size: 9px; color: #666; margin-bottom: 4px; }
          .prod-price { font-size: 12px; font-weight: bold; margin-top: 2px; }
          svg { width: 100%; max-height: 40px; }
        </style>
      </head>
      <body>
        <div class="barcode-grid">
          ${labelsHtml}
        </div>
        <script>
          window.onload = function() {
            ${variations
              .map((v) => {
                let s = '';
                for (let i = 0; i < copies; i++) {
                  s += `try { JsBarcode("#barcode-${v.barcode}-${i}", "${v.barcode}", { format: "CODE128", width: 1.5, height: 35, displayValue: true, fontSize: 10 }); } catch(e){} \n`;
                }
                return s;
              })
              .join('\n')}
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(fullHtml);
    printWin.document.close();
  }
};
