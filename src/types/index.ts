export type UserRole = 'super_admin' | 'manager' | 'cashier' | 'store_keeper';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: 'active' | 'inactive';
  must_change_password: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  name: string; // e.g. Meter, Yard, Piece, Roll, Kg
  symbol: string; // e.g. m, yd, pc, roll, kg
  is_decimal: number; // 1 = supports decimals like 2.75m, 0 = whole units
  created_at: string;
}

export interface Category {
  id: number;
  name: string; // e.g. Cotton, Lawn, Silk, Velvet, Denim, Suiting, etc.
  description?: string;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  company: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  opening_balance: number;
  current_balance: number;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  opening_balance: number;
  current_balance: number;
  notes?: string;
  created_at: string;
}

export interface ProductVariation {
  id: number;
  product_id: number;
  sku: string;
  barcode: string;
  color: string; // e.g. Navy Blue, Off-White, Jet Black, Crimson Red
  size: string; // e.g. Standard / 54-inch Width / 58-inch / Free Size
  fabric_type: string; // e.g. 100% Egyptian Giza Cotton, Pure 80s Lawn
  unit_id: number;
  unit_name?: string;
  unit_symbol?: string;
  is_decimal?: number;
  purchase_price: number;
  sale_price: number;
  wholesale_price?: number;
  current_stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  product_code: string;
  code?: string;
  barcode: string;
  name: string;
  brand_id?: number;
  brand_name?: string;
  category_id: number;
  category_name?: string;
  fabric_type: string;
  material: string;
  pattern: string; // e.g. Plain Solid, Floral Printed, Embroidered, Striped, Jacquard
  description?: string;
  default_unit_id: number;
  default_unit_symbol?: string;
  unit_id?: number;
  unit_symbol?: string;
  min_stock: number;
  purchase_price: number;
  sale_price: number;
  wholesale_price: number;
  retail_price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  variations?: ProductVariation[];
  total_stock?: number;
}

export interface PurchaseItem {
  id?: number;
  purchase_id?: number;
  product_id: number;
  product_name?: string;
  variation_id: number;
  variation_sku?: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_id?: number;
  unit_symbol?: string;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface Purchase {
  id: number;
  invoice_no: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_company?: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: string;
  status: 'received' | 'pending' | 'partially_paid' | 'paid';
  notes?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface PurchaseReturnItem {
  id?: number;
  purchase_return_id?: number;
  product_id: number;
  product_name?: string;
  variation_id: number;
  variation_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseReturn {
  id: number;
  return_no: string;
  purchase_id: number;
  purchase_invoice_no?: string;
  supplier_id: number;
  supplier_name?: string;
  return_date: string;
  total_refund: number;
  reason: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  items?: PurchaseReturnItem[];
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name?: string;
  variation_id: number;
  variation_sku?: string;
  color?: string;
  size?: string;
  fabric_type?: string;
  quantity: number;
  unit_symbol?: string;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface Sale {
  id: number;
  invoice_no: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  change_amount: number;
  payment_method: 'Cash' | 'Card' | 'Bank Transfer' | 'Store Credit' | 'Split';
  payment_status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SalesReturnItem {
  id?: number;
  sales_return_id?: number;
  product_id: number;
  product_name?: string;
  variation_id: number;
  variation_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalesReturn {
  id: number;
  return_no: string;
  sale_id: number;
  sale_invoice_no?: string;
  customer_id?: number | null;
  customer_name?: string;
  return_date: string;
  total_refund: number;
  reason: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  items?: SalesReturnItem[];
}

export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'sale_return'
  | 'purchase_return'
  | 'adjustment'
  | 'damage'
  | 'transfer'
  | 'opening_stock';

export interface StockMovement {
  id: number;
  date: string;
  product_id: number;
  product_name?: string;
  variation_id: number;
  variation_sku?: string;
  movement_type: StockMovementType;
  quantity: number; // positive for addition, negative for deduction
  previous_stock: number;
  new_stock: number;
  user_id: number;
  user_name?: string;
  reference_no: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Expense {
  id: number;
  expense_no: string;
  category_id: number;
  category_name?: string;
  amount: number;
  date: string;
  payment_method: string;
  description: string;
  user_id: number;
  user_name?: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at?: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  tax_number: string;
  currency: string; // e.g. PKR, USD, Rs, $, etc.
  tax_rate_percent: number;
  invoice_prefix: string;
  receipt_prefix: string;
  purchase_prefix: string;
  return_prefix: string;
  costing_method: 'average_cost' | 'last_purchase';
  low_stock_default: number;
  receipt_footer: string;
  printer_type: 'thermal_80mm' | 'thermal_58mm' | 'standard_a4';
  auto_backup_frequency: 'daily' | 'weekly' | 'manual';
  backup_copies_to_keep: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity: string;
  reference_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todaySalesCount: number;
  todayRevenue: number;
  todayProfit: number;
  monthlyRevenue: number;
  monthlyPurchases: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
  topSellingFabrics: Array<{
    product_name: string;
    category_name: string;
    total_quantity_sold: number;
    total_revenue: number;
  }>;
  recentSales: Sale[];
  recentPurchases: Purchase[];
  lowStockItems: Array<{
    product_name: string;
    color: string;
    sku: string;
    current_stock: number;
    min_stock: number;
    unit_symbol: string;
  }>;
}
