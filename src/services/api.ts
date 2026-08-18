import { db } from './db/database';
import {
  Product,
  ProductVariation,
  Category,
  Brand,
  Unit,
  Supplier,
  Customer,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  SalesReturn,
  PurchaseReturn,
  StockMovement,
  Expense,
  ExpenseCategory,
  StoreSettings,
  AuditLog,
  DashboardStats,
  User
} from '../types';

export const ApiService = {
  // ===================== STORE SETTINGS =====================
  async getSettings(): Promise<StoreSettings> {
    const rows = await db.query<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    return {
      store_name: settingsMap.store_name || 'Silk & Weave Fabric Emporium',
      tagline: settingsMap.tagline || 'The House of Premium Unstitched & Designer Fabrics',
      phone: settingsMap.phone || '+92 42 35789012',
      whatsapp: settingsMap.whatsapp || '+92 300 9876543',
      email: settingsMap.email || 'info@silknweave.com',
      address: settingsMap.address || 'Plaza 14-C, Main Boulevard, Gulberg III',
      city: settingsMap.city || 'Lahore, Pakistan',
      tax_number: settingsMap.tax_number || 'STRN-3277876129841',
      currency: settingsMap.currency || 'PKR',
      tax_rate_percent: parseFloat(settingsMap.tax_rate_percent || '0'),
      invoice_prefix: settingsMap.invoice_prefix || 'INV-2026-',
      receipt_prefix: settingsMap.receipt_prefix || 'REC-',
      purchase_prefix: settingsMap.purchase_prefix || 'PUR-2026-',
      return_prefix: settingsMap.return_prefix || 'RET-',
      costing_method: (settingsMap.costing_method as any) || 'average_cost',
      low_stock_default: parseFloat(settingsMap.low_stock_default || '10'),
      receipt_footer:
        settingsMap.receipt_footer ||
        'Thank you for shopping at Silk & Weave! Sold fabrics once cut cannot be exchanged.',
      printer_type: (settingsMap.printer_type as any) || 'thermal_80mm',
      auto_backup_frequency: (settingsMap.auto_backup_frequency as any) || 'daily',
      backup_copies_to_keep: parseInt(settingsMap.backup_copies_to_keep || '10', 10)
    };
  },

  async updateSettings(settings: Partial<StoreSettings>, user?: User): Promise<void> {
    const queries: Array<{ sql: string; params: any[] }> = [];
    for (const [key, value] of Object.entries(settings)) {
      queries.push({
        sql: 'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
        params: [key, String(value)]
      });
    }

    if (user) {
      queries.push({
        sql: 'INSERT INTO audit_logs (user_id, username, action, entity, details) VALUES (?, ?, ?, ?, ?)',
        params: [user.id, user.username, 'SETTINGS_UPDATED', 'SETTINGS', 'Store configuration settings updated']
      });
    }

    await db.transaction(queries);
  },

  // ===================== DASHBOARD METRICS =====================
  async getDashboardStats(): Promise<DashboardStats> {
    // 1. Total Products
    const prodCountRow = await db.queryOne<{ count: number }>('SELECT count(*) as count FROM products WHERE status = "active"');
    const totalProducts = prodCountRow ? prodCountRow.count : 0;

    // 2. Stock Totals & Inventory Valuation
    const stockRow = await db.queryOne<{ total_qty: number; total_val: number }>(`
      SELECT 
        COALESCE(SUM(current_stock), 0) as total_qty,
        COALESCE(SUM(current_stock * purchase_price), 0) as total_val
      FROM product_variations
      WHERE status = "active"
    `);

    // 3. Low stock and out of stock counts
    const lowStockRow = await db.queryOne<{ low_count: number; out_count: number }>(`
      SELECT 
        COUNT(CASE WHEN current_stock > 0 AND current_stock <= min_stock THEN 1 END) as low_count,
        COUNT(CASE WHEN current_stock <= 0 THEN 1 END) as out_count
      FROM product_variations
      WHERE status = "active"
    `);

    // 4. Today's Sales
    const todaySalesRow = await db.queryOne<{ count: number; total_revenue: number }>(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total_revenue
      FROM sales
      WHERE sale_date = date('now')
    `);

    // Today's COGS & Profit
    const todayProfitRow = await db.queryOne<{ cogs: number }>(`
      SELECT COALESCE(SUM(si.quantity * pv.purchase_price), 0) as cogs
      FROM sale_items si
      JOIN product_variations pv ON si.variation_id = pv.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date = date('now')
    `);
    const todayRevenue = todaySalesRow ? todaySalesRow.total_revenue : 0;
    const todayProfit = todayRevenue - (todayProfitRow ? todayProfitRow.cogs : 0);

    // 5. Monthly Metrics
    const monthlySalesRow = await db.queryOne<{ revenue: number }>(`
      SELECT COALESCE(SUM(grand_total), 0) as revenue
      FROM sales
      WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
    `);

    const monthlyPurchasesRow = await db.queryOne<{ purchases: number }>(`
      SELECT COALESCE(SUM(grand_total), 0) as purchases
      FROM purchases
      WHERE strftime('%Y-%m', purchase_date) = strftime('%Y-%m', 'now')
    `);

    const monthlyExpensesRow = await db.queryOne<{ expenses: number }>(`
      SELECT COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);

    const monthlyCogsRow = await db.queryOne<{ cogs: number }>(`
      SELECT COALESCE(SUM(si.quantity * pv.purchase_price), 0) as cogs
      FROM sale_items si
      JOIN product_variations pv ON si.variation_id = pv.id
      JOIN sales s ON si.sale_id = s.id
      WHERE strftime('%Y-%m', s.sale_date) = strftime('%Y-%m', 'now')
    `);

    const monthlyRevenue = monthlySalesRow ? monthlySalesRow.revenue : 0;
    const monthlyNetProfit = monthlyRevenue - (monthlyCogsRow ? monthlyCogsRow.cogs : 0) - (monthlyExpensesRow ? monthlyExpensesRow.expenses : 0);

    // 6. Top Selling Fabrics
    const topSellingFabrics = await db.query<any>(`
      SELECT 
        p.name as product_name,
        c.name as category_name,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.total_price) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY p.id
      ORDER BY total_quantity_sold DESC
      LIMIT 5
    `);

    // 7. Recent Sales
    const recentSales = await db.query<Sale>(`
      SELECT s.*, u.full_name as creator_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    // 8. Recent Purchases
    const recentPurchases = await db.query<Purchase>(`
      SELECT p.*, sup.name as supplier_name, sup.company as supplier_company, u.full_name as creator_name
      FROM purchases p
      JOIN suppliers sup ON p.supplier_id = sup.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    // 9. Low Stock Items
    const lowStockItems = await db.query<any>(`
      SELECT 
        p.name as product_name,
        pv.color,
        pv.sku,
        pv.current_stock,
        pv.min_stock,
        u.symbol as unit_symbol
      FROM product_variations pv
      JOIN products p ON pv.product_id = p.id
      JOIN units u ON pv.unit_id = u.id
      WHERE pv.status = "active" AND pv.current_stock <= pv.min_stock
      ORDER BY pv.current_stock ASC
      LIMIT 6
    `);

    return {
      totalProducts,
      totalStockQuantity: stockRow ? stockRow.total_qty : 0,
      totalInventoryValue: stockRow ? stockRow.total_val : 0,
      lowStockCount: lowStockRow ? lowStockRow.low_count : 0,
      outOfStockCount: lowStockRow ? lowStockRow.out_count : 0,
      todaySalesCount: todaySalesRow ? todaySalesRow.count : 0,
      todayRevenue,
      todayProfit,
      monthlyRevenue,
      monthlyPurchases: monthlyPurchasesRow ? monthlyPurchasesRow.purchases : 0,
      monthlyExpenses: monthlyExpensesRow ? monthlyExpensesRow.expenses : 0,
      monthlyNetProfit,
      topSellingFabrics,
      recentSales,
      recentPurchases,
      lowStockItems
    };
  },

  // ===================== UNITS, CATEGORIES, BRANDS =====================
  async getUnits(): Promise<Unit[]> {
    return await db.query<Unit>('SELECT * FROM units ORDER BY name ASC');
  },

  async createUnit(unit: Partial<Unit>): Promise<number> {
    const res = await db.execute(
      'INSERT INTO units (name, symbol, is_decimal) VALUES (?, ?, ?)',
      [unit.name, unit.symbol, unit.is_decimal ? 1 : 0]
    );
    return res.lastInsertRowId || 0;
  },

  async updateUnit(id: number, unit: Partial<Unit>): Promise<void> {
    await db.execute('UPDATE units SET name = ?, symbol = ?, is_decimal = ? WHERE id = ?', [
      unit.name,
      unit.symbol,
      unit.is_decimal ? 1 : 0,
      id
    ]);
  },

  async deleteUnit(id: number): Promise<void> {
    const inUse = await db.queryOne<{ cnt: number }>('SELECT count(*) as cnt FROM products WHERE default_unit_id = ?', [id]);
    if (inUse && inUse.cnt > 0) {
      throw new Error(`Cannot delete unit because it is used by ${inUse.cnt} products.`);
    }
    await db.execute('DELETE FROM units WHERE id = ?', [id]);
  },

  async getCategories(): Promise<Category[]> {
    return await db.query<Category>('SELECT * FROM categories ORDER BY name ASC');
  },

  async createCategory(cat: Partial<Category>): Promise<number> {
    const res = await db.execute('INSERT INTO categories (name, description) VALUES (?, ?)', [
      cat.name,
      cat.description || ''
    ]);
    return res.lastInsertRowId || 0;
  },

  async updateCategory(id: number, cat: Partial<Category>): Promise<void> {
    await db.execute('UPDATE categories SET name = ?, description = ? WHERE id = ?', [cat.name, cat.description, id]);
  },

  async deleteCategory(id: number): Promise<void> {
    const inUse = await db.queryOne<{ cnt: number }>('SELECT count(*) as cnt FROM products WHERE category_id = ?', [id]);
    if (inUse && inUse.cnt > 0) {
      throw new Error(`Cannot delete category because it contains ${inUse.cnt} active products.`);
    }
    await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  },

  async getBrands(): Promise<Brand[]> {
    return await db.query<Brand>('SELECT * FROM brands ORDER BY name ASC');
  },

  async createBrand(brand: Partial<Brand>): Promise<number> {
    const res = await db.execute('INSERT INTO brands (name, description) VALUES (?, ?)', [
      brand.name,
      brand.description || ''
    ]);
    return res.lastInsertRowId || 0;
  },

  async updateBrand(id: number, brand: Partial<Brand>): Promise<void> {
    await db.execute('UPDATE brands SET name = ?, description = ? WHERE id = ?', [brand.name, brand.description, id]);
  },

  async deleteBrand(id: number): Promise<void> {
    await db.execute('DELETE FROM brands WHERE id = ?', [id]);
  },

  // ===================== PRODUCTS & VARIATIONS =====================
  async getProducts(filters?: {
    search?: string;
    categoryId?: number;
    brandId?: number;
    stockStatus?: 'all' | 'low' | 'out' | 'in_stock';
  }): Promise<Product[]> {
    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        u.symbol as default_unit_symbol,
        (SELECT COALESCE(SUM(current_stock), 0) FROM product_variations WHERE product_id = p.id AND status = "active") as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN units u ON p.default_unit_id = u.id
      WHERE p.status = 'active'
    `;
    const params: any[] = [];

    if (filters?.search) {
      sql += ` AND (p.name LIKE ? OR p.product_code LIKE ? OR p.barcode LIKE ? OR p.fabric_type LIKE ? OR p.material LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s, s);
    }

    if (filters?.categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(filters.categoryId);
    }

    if (filters?.brandId) {
      sql += ` AND p.brand_id = ?`;
      params.push(filters.brandId);
    }

    sql += ' ORDER BY p.id DESC';

    const products = await db.query<Product>(sql, params);

    // Fetch variations for each product
    for (const prod of products) {
      prod.variations = await db.query<ProductVariation>(
        `
        SELECT pv.*, u.name as unit_name, u.symbol as unit_symbol, u.is_decimal
        FROM product_variations pv
        LEFT JOIN units u ON pv.unit_id = u.id
        WHERE pv.product_id = ? AND pv.status = 'active'
        ORDER BY pv.id ASC
      `,
        [prod.id]
      );
    }

    if (filters?.stockStatus && filters.stockStatus !== 'all') {
      return products.filter((p) => {
        const stock = p.total_stock || 0;
        if (filters.stockStatus === 'out') return stock <= 0;
        if (filters.stockStatus === 'low') return stock > 0 && stock <= p.min_stock;
        if (filters.stockStatus === 'in_stock') return stock > p.min_stock;
        return true;
      });
    }

    return products;
  },

  async getProductById(id: number): Promise<Product | null> {
    const prod = await db.queryOne<Product>(
      `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        u.symbol as default_unit_symbol
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN units u ON p.default_unit_id = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (prod) {
      prod.variations = await db.query<ProductVariation>(
        `
        SELECT pv.*, u.name as unit_name, u.symbol as unit_symbol, u.is_decimal
        FROM product_variations pv
        LEFT JOIN units u ON pv.unit_id = u.id
        WHERE pv.product_id = ?
        ORDER BY pv.id ASC
      `,
        [prod.id]
      );
    }

    return prod;
  },

  async createProduct(
    product: Partial<Product>,
    variations: Array<Partial<ProductVariation>>,
    user?: User
  ): Promise<number> {
    // 1. Insert Master Product
    const res = await db.execute(
      `
      INSERT INTO products (
        product_code, barcode, name, brand_id, category_id, fabric_type, material, pattern,
        description, default_unit_id, min_stock, purchase_price, sale_price, wholesale_price, retail_price, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        product.product_code,
        product.barcode || product.product_code,
        product.name,
        product.brand_id || null,
        product.category_id,
        product.fabric_type || '',
        product.material || '',
        product.pattern || '',
        product.description || '',
        product.default_unit_id,
        product.min_stock || 10,
        product.purchase_price || 0,
        product.sale_price || 0,
        product.wholesale_price || 0,
        product.retail_price || product.sale_price || 0,
        'active'
      ]
    );

    const productId = res.lastInsertRowId!;

    // 2. Insert Variations
    for (const v of variations) {
      const varRes = await db.execute(
        `
        INSERT INTO product_variations (
          product_id, sku, barcode, color, size, fabric_type, unit_id,
          purchase_price, sale_price, wholesale_price, current_stock, min_stock, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          productId,
          v.sku,
          v.barcode || v.sku,
          v.color || 'Default',
          v.size || 'Standard',
          v.fabric_type || product.fabric_type || '',
          v.unit_id || product.default_unit_id,
          v.purchase_price || product.purchase_price || 0,
          v.sale_price || product.sale_price || 0,
          v.wholesale_price || product.wholesale_price || 0,
          v.current_stock || 0,
          v.min_stock || 5,
          'active'
        ]
      );

      // If initial stock > 0, log opening stock movement
      if (v.current_stock && v.current_stock > 0) {
        await db.execute(
          `
          INSERT INTO stock_movements (
            date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason
          ) VALUES (CURRENT_TIMESTAMP, ?, ?, 'opening_stock', ?, 0, ?, ?, ?, 'Initial Opening Stock Entry')
        `,
          [productId, varRes.lastInsertRowId, v.current_stock, v.current_stock, user?.id || 1, `OPN-${productId}`]
        );
      }
    }

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'PRODUCT_CREATED', 'PRODUCT', `PRD-${productId}`, `Created product ${product.name} with ${variations.length} variations`]
      );
    }

    return productId;
  },

  async updateProduct(
    id: number,
    product: Partial<Product>,
    variations: Array<Partial<ProductVariation>>,
    user?: User
  ): Promise<void> {
    await db.execute(
      `
      UPDATE products SET
        product_code = ?, barcode = ?, name = ?, brand_id = ?, category_id = ?, fabric_type = ?,
        material = ?, pattern = ?, description = ?, default_unit_id = ?, min_stock = ?,
        purchase_price = ?, sale_price = ?, wholesale_price = ?, retail_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        product.product_code,
        product.barcode,
        product.name,
        product.brand_id || null,
        product.category_id,
        product.fabric_type,
        product.material,
        product.pattern,
        product.description,
        product.default_unit_id,
        product.min_stock,
        product.purchase_price,
        product.sale_price,
        product.wholesale_price,
        product.retail_price,
        id
      ]
    );

    // Update / Insert variations
    for (const v of variations) {
      if (v.id) {
        await db.execute(
          `
          UPDATE product_variations SET
            sku = ?, barcode = ?, color = ?, size = ?, fabric_type = ?, unit_id = ?,
            purchase_price = ?, sale_price = ?, wholesale_price = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [
            v.sku,
            v.barcode,
            v.color,
            v.size,
            v.fabric_type,
            v.unit_id,
            v.purchase_price,
            v.sale_price,
            v.wholesale_price,
            v.min_stock,
            v.id
          ]
        );
      } else {
        await db.execute(
          `
          INSERT INTO product_variations (
            product_id, sku, barcode, color, size, fabric_type, unit_id,
            purchase_price, sale_price, wholesale_price, current_stock, min_stock, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            id,
            v.sku,
            v.barcode || v.sku,
            v.color || 'Standard',
            v.size || 'Standard',
            v.fabric_type || product.fabric_type || '',
            v.unit_id || product.default_unit_id,
            v.purchase_price || product.purchase_price || 0,
            v.sale_price || product.sale_price || 0,
            v.wholesale_price || product.wholesale_price || 0,
            v.current_stock || 0,
            v.min_stock || 5,
            'active'
          ]
        );
      }
    }

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'PRODUCT_UPDATED', 'PRODUCT', `PRD-${id}`, `Updated product specifications for ${product.name}`]
      );
    }
  },

  async deleteProduct(id: number, user?: User): Promise<void> {
    await db.execute('UPDATE products SET status = "inactive" WHERE id = ?', [id]);
    await db.execute('UPDATE product_variations SET status = "inactive" WHERE product_id = ?', [id]);

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'PRODUCT_DELETED', 'PRODUCT', `PRD-${id}`, `Soft-deleted product ID ${id}`]
      );
    }
  },

  // Stock Adjustment
  async adjustStock(
    variationId: number,
    adjustedQty: number,
    movementType: 'adjustment' | 'damage' | 'transfer' | 'return',
    reason: string,
    notes: string,
    user?: User
  ): Promise<void> {
    const variation = await db.queryOne<ProductVariation>(
      'SELECT * FROM product_variations WHERE id = ?',
      [variationId]
    );
    if (!variation) throw new Error('Variation not found');

    const previousStock = variation.current_stock;
    const newStock = previousStock + adjustedQty;

    if (newStock < 0) {
      throw new Error(`Adjustment would result in negative stock (Current: ${previousStock}, Adjustment: ${adjustedQty})`);
    }

    await db.transaction([
      {
        sql: 'UPDATE product_variations SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [newStock, variationId]
      },
      {
        sql: `
          INSERT INTO stock_movements (
            date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason, notes
          ) VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          variation.product_id,
          variationId,
          movementType,
          adjustedQty,
          previousStock,
          newStock,
          user?.id || 1,
          `ADJ-${Date.now()}`,
          reason,
          notes
        ]
      },
      {
        sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        params: [
          user?.id || 1,
          user?.username || 'admin',
          'STOCK_ADJUSTED',
          'INVENTORY',
          `VAR-${variationId}`,
          `Adjusted stock for SKU ${variation.sku} from ${previousStock} to ${newStock} (${reason})`
        ]
      }
    ]);
  },

  // Search Variations / Products for POS
  async searchVariations(query: string): Promise<any[]> {
    if (!query.trim()) return [];
    const q = `%${query.trim()}%`;
    return await db.query<any>(
      `
      SELECT 
        pv.id as variation_id,
        pv.sku,
        pv.barcode,
        pv.color,
        pv.size,
        pv.purchase_price,
        pv.sale_price,
        pv.wholesale_price,
        pv.current_stock,
        pv.min_stock,
        p.id as product_id,
        p.name as product_name,
        p.fabric_type,
        p.material,
        p.pattern,
        c.name as category_name,
        b.name as brand_name,
        u.symbol as unit_symbol,
        u.is_decimal
      FROM product_variations pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN units u ON pv.unit_id = u.id
      WHERE pv.status = 'active' AND p.status = 'active'
        AND (pv.sku LIKE ? OR pv.barcode LIKE ? OR p.name LIKE ? OR pv.color LIKE ? OR p.fabric_type LIKE ?)
      ORDER BY p.name ASC, pv.color ASC
      LIMIT 20
    `,
      [q, q, q, q, q]
    );
  },

  // ===================== SUPPLIERS & CUSTOMERS =====================
  async getSuppliers(): Promise<Supplier[]> {
    return await db.query<Supplier>('SELECT * FROM suppliers ORDER BY name ASC');
  },

  async createSupplier(supplier: Partial<Supplier>, user?: User): Promise<number> {
    const res = await db.execute(
      `
      INSERT INTO suppliers (
        supplier_code, name, company, phone, whatsapp, email, address, city, tax_number, opening_balance, current_balance, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        supplier.supplier_code,
        supplier.name,
        supplier.company,
        supplier.phone,
        supplier.whatsapp || '',
        supplier.email || '',
        supplier.address || '',
        supplier.city || '',
        supplier.tax_number || '',
        supplier.opening_balance || 0,
        supplier.opening_balance || 0,
        supplier.notes || '',
        'active'
      ]
    );

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'SUPPLIER_CREATED', 'SUPPLIERS', `SUP-${res.lastInsertRowId}`, `Added supplier ${supplier.name} (${supplier.company})`]
      );
    }
    return res.lastInsertRowId!;
  },

  async updateSupplier(id: number, supplier: Partial<Supplier>, user?: User): Promise<void> {
    await db.execute(
      `
      UPDATE suppliers SET
        name = ?, company = ?, phone = ?, whatsapp = ?, email = ?, address = ?,
        city = ?, tax_number = ?, notes = ?, status = ?
      WHERE id = ?
    `,
      [
        supplier.name,
        supplier.company,
        supplier.phone,
        supplier.whatsapp,
        supplier.email,
        supplier.address,
        supplier.city,
        supplier.tax_number,
        supplier.notes,
        supplier.status || 'active',
        id
      ]
    );
    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'SUPPLIER_UPDATED', 'SUPPLIERS', `SUP-${id}`, `Updated supplier profile ${supplier.name}`]
      );
    }
  },

  async recordSupplierPayment(
    supplierId: number,
    amount: number,
    paymentMethod: string,
    notes: string,
    user?: User
  ): Promise<void> {
    const sup = await db.queryOne<Supplier>('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
    if (!sup) throw new Error('Supplier not found');

    const newBalance = sup.current_balance - amount;
    await db.transaction([
      {
        sql: 'UPDATE suppliers SET current_balance = ? WHERE id = ?',
        params: [newBalance, supplierId]
      },
      {
        sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        params: [
          user?.id || 1,
          user?.username || 'admin',
          'SUPPLIER_PAYMENT',
          'SUPPLIERS',
          `SUP-${supplierId}`,
          `Paid amount ${amount} (${paymentMethod}) to ${sup.name}. New balance: ${newBalance}. Notes: ${notes}`
        ]
      }
    ]);
  },

  async getCustomers(): Promise<Customer[]> {
    return await db.query<Customer>('SELECT * FROM customers ORDER BY name ASC');
  },

  async createCustomer(customer: Partial<Customer>, user?: User): Promise<number> {
    const res = await db.execute(
      `
      INSERT INTO customers (
        customer_code, name, phone, whatsapp, email, address, city, opening_balance, current_balance, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        customer.customer_code,
        customer.name,
        customer.phone,
        customer.whatsapp || '',
        customer.email || '',
        customer.address || '',
        customer.city || '',
        customer.opening_balance || 0,
        customer.opening_balance || 0,
        customer.notes || ''
      ]
    );

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'CUSTOMER_CREATED', 'CUSTOMERS', `CUST-${res.lastInsertRowId}`, `Added customer ${customer.name}`]
      );
    }
    return res.lastInsertRowId!;
  },

  async updateCustomer(id: number, customer: Partial<Customer>, user?: User): Promise<void> {
    await db.execute(
      `
      UPDATE customers SET
        name = ?, phone = ?, whatsapp = ?, email = ?, address = ?, city = ?, notes = ?
      WHERE id = ?
    `,
      [customer.name, customer.phone, customer.whatsapp, customer.email, customer.address, customer.city, customer.notes, id]
    );

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'CUSTOMER_UPDATED', 'CUSTOMERS', `CUST-${id}`, `Updated customer profile ${customer.name}`]
      );
    }
  },

  async recordCustomerPayment(
    customerId: number,
    amount: number,
    paymentMethod: string,
    notes: string,
    user?: User
  ): Promise<void> {
    const cust = await db.queryOne<Customer>('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (!cust) throw new Error('Customer not found');

    const newBalance = cust.current_balance - amount;
    await db.transaction([
      {
        sql: 'UPDATE customers SET current_balance = ? WHERE id = ?',
        params: [newBalance, customerId]
      },
      {
        sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        params: [
          user?.id || 1,
          user?.username || 'admin',
          'CUSTOMER_PAYMENT_RECEIVED',
          'CUSTOMERS',
          `CUST-${customerId}`,
          `Received payment of ${amount} (${paymentMethod}) from ${cust.name}. Remaining dues: ${newBalance}. Notes: ${notes}`
        ]
      }
    ]);
  },

  // ===================== PURCHASES =====================
  async getPurchases(): Promise<Purchase[]> {
    const purchases = await db.query<Purchase>(`
      SELECT p.*, sup.name as supplier_name, sup.company as supplier_company, u.full_name as creator_name
      FROM purchases p
      JOIN suppliers sup ON p.supplier_id = sup.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.purchase_date DESC, p.id DESC
    `);

    for (const p of purchases) {
      p.items = await db.query<PurchaseItem>(
        `
        SELECT pi.*, prd.name as product_name, pv.sku as variation_sku, pv.color, pv.size, u.symbol as unit_symbol
        FROM purchase_items pi
        JOIN products prd ON pi.product_id = prd.id
        JOIN product_variations pv ON pi.variation_id = pv.id
        LEFT JOIN units u ON pv.unit_id = u.id
        WHERE pi.purchase_id = ?
      `,
        [p.id]
      );
    }

    return purchases;
  },

  async createPurchase(purchase: Partial<Purchase>, items: PurchaseItem[], user?: User): Promise<number> {
    if (!items || items.length === 0) {
      throw new Error('Purchase must contain at least one fabric line item');
    }

    // Prepare atomic transaction
    const queries: Array<{ sql: string; params: any[] }> = [];

    // 1. Insert Purchase Record
    const grandTotal = purchase.grand_total || 0;
    const paidAmount = purchase.paid_amount || 0;
    const balanceAmount = Math.max(0, grandTotal - paidAmount);
    const status = balanceAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'pending';

    const pRes = await db.execute(
      `
      INSERT INTO purchases (
        invoice_no, supplier_id, purchase_date, subtotal, discount, tax, grand_total, paid_amount, balance_amount, payment_method, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        purchase.invoice_no,
        purchase.supplier_id,
        purchase.purchase_date || new Date().toISOString().split('T')[0],
        purchase.subtotal || 0,
        purchase.discount || 0,
        purchase.tax || 0,
        grandTotal,
        paidAmount,
        balanceAmount,
        purchase.payment_method || 'Cash',
        status,
        purchase.notes || '',
        user?.id || 1
      ]
    );

    const purchaseId = pRes.lastInsertRowId!;

    // 2. Insert items and update stock
    for (const item of items) {
      // Get current stock
      const variation = await db.queryOne<ProductVariation>(
        'SELECT * FROM product_variations WHERE id = ?',
        [item.variation_id]
      );
      if (!variation) throw new Error(`Variation ID ${item.variation_id} not found`);

      const prevStock = variation.current_stock;
      const newStock = prevStock + item.quantity;

      queries.push({
        sql: `
          INSERT INTO purchase_items (
            purchase_id, product_id, variation_id, quantity, unit_price, discount, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          purchaseId,
          item.product_id,
          item.variation_id,
          item.quantity,
          item.unit_price,
          item.discount || 0,
          item.total_price
        ]
      });

      // Update variation current stock and update purchase price if newer
      queries.push({
        sql: 'UPDATE product_variations SET current_stock = ?, purchase_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [newStock, item.unit_price, item.variation_id]
      });

      // Log stock movement
      queries.push({
        sql: `
          INSERT INTO stock_movements (
            date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason, notes
          ) VALUES (CURRENT_TIMESTAMP, ?, ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          item.product_id,
          item.variation_id,
          item.quantity,
          prevStock,
          newStock,
          user?.id || 1,
          purchase.invoice_no,
          'Purchase Order Receiving',
          `Supplier Purchase Inv: ${purchase.invoice_no}`
        ]
      });
    }

    // 3. Update Supplier Balance if unpaid portion exists
    if (balanceAmount > 0) {
      queries.push({
        sql: 'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?',
        params: [balanceAmount, purchase.supplier_id]
      });
    }

    // 4. Audit Log
    queries.push({
      sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      params: [
        user?.id || 1,
        user?.username || 'admin',
        'PURCHASE_RECORDED',
        'PURCHASES',
        `PUR-${purchaseId}`,
        `Recorded purchase ${purchase.invoice_no} worth ${grandTotal} from supplier ID ${purchase.supplier_id}`
      ]
    });

    await db.transaction(queries);
    return purchaseId;
  },

  // ===================== POS SALES =====================
  async getSales(filters?: { startDate?: string; endDate?: string; customerId?: number }): Promise<Sale[]> {
    let sql = `
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.full_name as creator_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      sql += ' AND s.sale_date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ' AND s.sale_date <= ?';
      params.push(filters.endDate);
    }
    if (filters?.customerId) {
      sql += ' AND s.customer_id = ?';
      params.push(filters.customerId);
    }

    sql += ' ORDER BY s.sale_date DESC, s.id DESC';

    const sales = await db.query<Sale>(sql, params);

    for (const s of sales) {
      s.items = await db.query<SaleItem>(
        `
        SELECT si.*, prd.name as product_name, pv.sku as variation_sku, pv.color, pv.size, pv.fabric_type, u.symbol as unit_symbol
        FROM sale_items si
        JOIN products prd ON si.product_id = prd.id
        JOIN product_variations pv ON si.variation_id = pv.id
        LEFT JOIN units u ON pv.unit_id = u.id
        WHERE si.sale_id = ?
      `,
        [s.id]
      );
    }

    return sales;
  },

  async createSale(sale: Partial<Sale>, items: SaleItem[], user?: User): Promise<number> {
    if (!items || items.length === 0) {
      throw new Error('Sale must contain at least one fabric item');
    }

    // Check stock for every variation first to guarantee consistency
    for (const item of items) {
      const variation = await db.queryOne<ProductVariation>(
        'SELECT * FROM product_variations WHERE id = ?',
        [item.variation_id]
      );
      if (!variation) throw new Error(`Variation ID ${item.variation_id} not found`);
      if (variation.current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for SKU '${variation.sku}' (${item.product_name || 'Fabric'} - ${variation.color}). Available: ${variation.current_stock}, Requested: ${item.quantity}`
        );
      }
    }

    const queries: Array<{ sql: string; params: any[] }> = [];

    // 1. Insert Sales Invoice
    const grandTotal = sale.grand_total || 0;
    const paidAmount = sale.paid_amount || 0;
    const changeAmount = sale.change_amount || 0;
    const balanceAmount = sale.balance_amount || 0;
    const paymentStatus = balanceAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const sRes = await db.execute(
      `
      INSERT INTO sales (
        invoice_no, customer_id, customer_name, customer_phone, sale_date, subtotal, discount, tax,
        grand_total, paid_amount, balance_amount, change_amount, payment_method, payment_status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        sale.invoice_no,
        sale.customer_id || null,
        sale.customer_name || 'Walk-in Customer',
        sale.customer_phone || '',
        sale.sale_date || new Date().toISOString().split('T')[0],
        sale.subtotal || 0,
        sale.discount || 0,
        sale.tax || 0,
        grandTotal,
        paidAmount,
        balanceAmount,
        changeAmount,
        sale.payment_method || 'Cash',
        paymentStatus,
        sale.notes || '',
        user?.id || 1
      ]
    );

    const saleId = sRes.lastInsertRowId!;

    // 2. Insert items and decrease stock
    for (const item of items) {
      const variation = await db.queryOne<ProductVariation>(
        'SELECT * FROM product_variations WHERE id = ?',
        [item.variation_id]
      );
      const prevStock = variation!.current_stock;
      const newStock = prevStock - item.quantity;

      queries.push({
        sql: `
          INSERT INTO sale_items (
            sale_id, product_id, variation_id, quantity, unit_price, discount, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          saleId,
          item.product_id,
          item.variation_id,
          item.quantity,
          item.unit_price,
          item.discount || 0,
          item.total_price
        ]
      });

      // Decrease stock
      queries.push({
        sql: 'UPDATE product_variations SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [newStock, item.variation_id]
      });

      // Stock movement ledger
      queries.push({
        sql: `
          INSERT INTO stock_movements (
            date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason, notes
          ) VALUES (CURRENT_TIMESTAMP, ?, ?, 'sale', ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          item.product_id,
          item.variation_id,
          -item.quantity,
          prevStock,
          newStock,
          user?.id || 1,
          sale.invoice_no,
          'POS Customer Sale Invoice',
          `Sold to ${sale.customer_name || 'Walk-in'}`
        ]
      });
    }

    // 3. Customer outstanding dues update
    if (sale.customer_id && balanceAmount > 0) {
      queries.push({
        sql: 'UPDATE customers SET current_balance = current_balance + ? WHERE id = ?',
        params: [balanceAmount, sale.customer_id]
      });
    }

    // 4. Audit Log
    queries.push({
      sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      params: [
        user?.id || 1,
        user?.username || 'cashier',
        'SALE_COMPLETED',
        'SALES',
        `INV-${saleId}`,
        `Completed invoice ${sale.invoice_no} (${items.length} items, Total: ${grandTotal}, Paid: ${paidAmount})`
      ]
    });

    await db.transaction(queries);
    return saleId;
  },

  // ===================== RETURNS =====================
  async createSalesReturn(returnData: Partial<SalesReturn>, items: any[], user?: User): Promise<number> {
    const queries: Array<{ sql: string; params: any[] }> = [];

    const res = await db.execute(
      `
      INSERT INTO sales_returns (
        return_no, sale_id, customer_id, return_date, total_refund, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        returnData.return_no,
        returnData.sale_id,
        returnData.customer_id || null,
        returnData.return_date || new Date().toISOString().split('T')[0],
        returnData.total_refund || 0,
        returnData.reason || 'Customer Return',
        user?.id || 1
      ]
    );

    const returnId = res.lastInsertRowId!;

    for (const item of items) {
      const variation = await db.queryOne<ProductVariation>(
        'SELECT * FROM product_variations WHERE id = ?',
        [item.variation_id]
      );
      const prevStock = variation!.current_stock;
      const newStock = prevStock + item.quantity;

      queries.push({
        sql: `
          INSERT INTO sales_return_items (
            sales_return_id, product_id, variation_id, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [returnId, item.product_id, item.variation_id, item.quantity, item.unit_price, item.total_price]
      });

      // Restock variation
      queries.push({
        sql: 'UPDATE product_variations SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [newStock, item.variation_id]
      });

      // Stock movement
      queries.push({
        sql: `
          INSERT INTO stock_movements (
            date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason
          ) VALUES (CURRENT_TIMESTAMP, ?, ?, 'sale_return', ?, ?, ?, ?, ?, ?)
        `,
        params: [
          item.product_id,
          item.variation_id,
          item.quantity,
          prevStock,
          newStock,
          user?.id || 1,
          returnData.return_no,
          `Sales Return: ${returnData.reason}`
        ]
      });
    }

    if (returnData.customer_id && returnData.total_refund) {
      queries.push({
        sql: 'UPDATE customers SET current_balance = MAX(0, current_balance - ?) WHERE id = ?',
        params: [returnData.total_refund, returnData.customer_id]
      });
    }

    queries.push({
      sql: 'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      params: [
        user?.id || 1,
        user?.username || 'admin',
        'SALES_RETURN_PROCESSED',
        'RETURNS',
        `RET-${returnId}`,
        `Processed sales return ${returnData.return_no} for Sale ID ${returnData.sale_id}`
      ]
    });

    await db.transaction(queries);
    return returnId;
  },

  async getSalesReturns(): Promise<SalesReturn[]> {
    const returns = await db.query<SalesReturn>(`
      SELECT sr.*, s.invoice_no as sale_invoice_no, c.name as customer_name, u.full_name as creator_name
      FROM sales_returns sr
      JOIN sales s ON sr.sale_id = s.id
      LEFT JOIN customers c ON sr.customer_id = c.id
      LEFT JOIN users u ON sr.created_by = u.id
      ORDER BY sr.return_date DESC, sr.id DESC
    `);

    for (const r of returns) {
      r.items = await db.query<any>(
        `
        SELECT sri.*, p.name as product_name, pv.sku as variation_sku
        FROM sales_return_items sri
        JOIN products p ON sri.product_id = p.id
        JOIN product_variations pv ON sri.variation_id = pv.id
        WHERE sri.sales_return_id = ?
      `,
        [r.id]
      );
    }
    return returns;
  },

  // ===================== STOCK MOVEMENTS LEDGER =====================
  async getStockMovements(filters?: {
    productId?: number;
    variationId?: number;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockMovement[]> {
    let sql = `
      SELECT 
        sm.*,
        p.name as product_name,
        pv.sku as variation_sku,
        u.username as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN product_variations pv ON sm.variation_id = pv.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.productId) {
      sql += ' AND sm.product_id = ?';
      params.push(filters.productId);
    }
    if (filters?.variationId) {
      sql += ' AND sm.variation_id = ?';
      params.push(filters.variationId);
    }
    if (filters?.movementType && filters.movementType !== 'all') {
      sql += ' AND sm.movement_type = ?';
      params.push(filters.movementType);
    }
    if (filters?.startDate) {
      sql += ' AND sm.date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ' AND sm.date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY sm.date DESC, sm.id DESC LIMIT 100';
    return await db.query<StockMovement>(sql, params);
  },

  // ===================== EXPENSES =====================
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return await db.query<ExpenseCategory>('SELECT * FROM expense_categories ORDER BY name ASC');
  },

  async createExpenseCategory(cat: Partial<ExpenseCategory>): Promise<number> {
    const res = await db.execute('INSERT INTO expense_categories (name, description) VALUES (?, ?)', [
      cat.name,
      cat.description || ''
    ]);
    return res.lastInsertRowId || 0;
  },

  async getExpenses(filters?: { categoryId?: number; startDate?: string; endDate?: string }): Promise<Expense[]> {
    let sql = `
      SELECT e.*, ec.name as category_name, u.full_name as user_name
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.categoryId) {
      sql += ' AND e.category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters?.startDate) {
      sql += ' AND e.date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ' AND e.date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY e.date DESC, e.id DESC';
    return await db.query<Expense>(sql, params);
  },

  async createExpense(expense: Partial<Expense>, user?: User): Promise<number> {
    const res = await db.execute(
      `
      INSERT INTO expenses (
        expense_no, category_id, amount, date, payment_method, description, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        expense.expense_no || `EXP-${Date.now()}`,
        expense.category_id,
        expense.amount,
        expense.date || new Date().toISOString().split('T')[0],
        expense.payment_method || 'Cash',
        expense.description || '',
        user?.id || 1
      ]
    );

    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'EXPENSE_RECORDED', 'EXPENSES', `EXP-${res.lastInsertRowId}`, `Expense: ${expense.description} (${expense.amount})`]
      );
    }

    return res.lastInsertRowId!;
  },

  async deleteExpense(id: number, user?: User): Promise<void> {
    await db.execute('DELETE FROM expenses WHERE id = ?', [id]);
    if (user) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, 'EXPENSE_DELETED', 'EXPENSES', `EXP-${id}`, `Deleted expense ID ${id}`]
      );
    }
  },

  // ===================== USER MANAGEMENT =====================
  async getUsers(): Promise<User[]> {
    return await db.query<User>('SELECT id, username, full_name, email, role, status, must_change_password, created_at, updated_at FROM users ORDER BY id ASC');
  },

  async createUser(user: Partial<User>, adminUser?: User): Promise<number> {
    const hash = await import('./auth').then((m) => m.hashPassword(user.password_hash || 'password123'));
    const res = await db.execute(
      `
      INSERT INTO users (username, full_name, email, password_hash, role, status, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        user.username,
        user.full_name,
        user.email,
        hash,
        user.role || 'cashier',
        user.status || 'active',
        user.must_change_password ? 1 : 0
      ]
    );

    if (adminUser) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [adminUser.id, adminUser.username, 'USER_CREATED', 'USERS', `USR-${res.lastInsertRowId}`, `Created user account for ${user.username} (${user.role})`]
      );
    }
    return res.lastInsertRowId!;
  },

  async updateUser(id: number, user: Partial<User>, adminUser?: User): Promise<void> {
    let sql = 'UPDATE users SET full_name = ?, email = ?, role = ?, status = ?';
    const params: any[] = [user.full_name, user.email, user.role, user.status];

    if (user.password_hash) {
      const hash = await import('./auth').then((m) => m.hashPassword(user.password_hash!));
      sql += ', password_hash = ?';
      params.push(hash);
    }

    sql += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(id);

    await db.execute(sql, params);

    if (adminUser) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, username, action, entity, reference_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [adminUser.id, adminUser.username, 'USER_UPDATED', 'USERS', `USR-${id}`, `Updated user account ${user.username || id}`]
      );
    }
  },

  // ===================== AUDIT LOGS =====================
  async getAuditLogs(filters?: { action?: string; limit?: number }): Promise<AuditLog[]> {
    let sql = 'SELECT * FROM audit_logs';
    const params: any[] = [];
    if (filters?.action) {
      sql += ' WHERE action LIKE ?';
      params.push(`%${filters.action}%`);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters?.limit || 100);
    return await db.query<AuditLog>(sql, params);
  },

  // ===================== REPORTS =====================
  async getProfitLossReport(startDate: string, endDate: string) {
    // 1. Total Sales Revenue
    const salesRow = await db.queryOne<{ total_sales: number; total_discount: number }>(
      `
      SELECT 
        COALESCE(SUM(grand_total), 0) as total_sales,
        COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `,
      [startDate, endDate]
    );

    // 2. Cost of Goods Sold (COGS)
    const cogsRow = await db.queryOne<{ cogs: number }>(
      `
      SELECT COALESCE(SUM(si.quantity * pv.purchase_price), 0) as cogs
      FROM sale_items si
      JOIN product_variations pv ON si.variation_id = pv.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date >= ? AND s.sale_date <= ?
    `,
      [startDate, endDate]
    );

    // 3. Operating Expenses by category
    const expenseBreakdown = await db.query<any>(
      `
      SELECT ec.name as category_name, COALESCE(SUM(e.amount), 0) as total_amount
      FROM expense_categories ec
      LEFT JOIN expenses e ON ec.id = e.category_id AND e.date >= ? AND e.date <= ?
      GROUP BY ec.id
      ORDER BY total_amount DESC
    `,
      [startDate, endDate]
    );

    const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const revenue = salesRow?.total_sales || 0;
    const cogs = cogsRow?.cogs || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      startDate,
      endDate,
      revenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      expenseBreakdown
    };
  }
};
