-- ClothStore Pro SQLite Database Schema
PRAGMA foreign_keys = ON;

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin', 'manager', 'cashier', 'store_keeper')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Units of Measurement (Meter, Yard, Feet, Piece, Roll, Bundle, Kg)
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  symbol TEXT UNIQUE NOT NULL,
  is_decimal INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cloth Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Brands / Mills
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  tax_number TEXT,
  opening_balance REAL DEFAULT 0.0,
  current_balance REAL DEFAULT 0.0,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  opening_balance REAL DEFAULT 0.0,
  current_balance REAL DEFAULT 0.0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  fabric_type TEXT NOT NULL,
  material TEXT NOT NULL,
  pattern TEXT NOT NULL,
  description TEXT,
  default_unit_id INTEGER REFERENCES units(id) ON DELETE RESTRICT,
  min_stock REAL DEFAULT 10.0,
  purchase_price REAL NOT NULL DEFAULT 0.0,
  sale_price REAL NOT NULL DEFAULT 0.0,
  wholesale_price REAL DEFAULT 0.0,
  retail_price REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product Variations (Color, Size/Width, Specific SKU/Barcode, Stock)
CREATE TABLE IF NOT EXISTS product_variations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  fabric_type TEXT NOT NULL,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  purchase_price REAL NOT NULL DEFAULT 0.0,
  sale_price REAL NOT NULL DEFAULT 0.0,
  wholesale_price REAL DEFAULT 0.0,
  current_stock REAL NOT NULL DEFAULT 0.0,
  min_stock REAL NOT NULL DEFAULT 5.0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0.0,
  discount REAL NOT NULL DEFAULT 0.0,
  tax REAL NOT NULL DEFAULT 0.0,
  grand_total REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  balance_amount REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'received',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id INTEGER NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0.0,
  total_price REAL NOT NULL
);

-- Purchase Returns
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_no TEXT UNIQUE NOT NULL,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  return_date DATE NOT NULL,
  total_refund REAL NOT NULL DEFAULT 0.0,
  reason TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_return_id INTEGER NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id INTEGER NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL
);

-- Sales / Store Invoices
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone TEXT,
  sale_date DATE NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0.0,
  discount REAL NOT NULL DEFAULT 0.0,
  tax REAL NOT NULL DEFAULT 0.0,
  grand_total REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  balance_amount REAL NOT NULL DEFAULT 0.0,
  change_amount REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK(payment_status IN ('paid', 'partial', 'unpaid')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id INTEGER NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0.0,
  total_price REAL NOT NULL
);

-- Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_no TEXT UNIQUE NOT NULL,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  return_date DATE NOT NULL,
  total_refund REAL NOT NULL DEFAULT 0.0,
  reason TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sales_return_id INTEGER NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id INTEGER NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL
);

-- Stock Movement Ledger
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variation_id INTEGER NOT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('purchase', 'sale', 'sale_return', 'purchase_return', 'adjustment', 'damage', 'transfer', 'opening_stock')),
  quantity REAL NOT NULL,
  previous_stock REAL NOT NULL,
  new_stock REAL NOT NULL,
  user_id INTEGER REFERENCES users(id),
  reference_no TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_no TEXT UNIQUE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  description TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System & Store Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  reference_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Essential Search & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variations_sku ON product_variations(sku);
CREATE INDEX IF NOT EXISTS idx_variations_barcode ON product_variations(barcode);
CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_no);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id, variation_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
