// Seed data for ClothStore Pro

// SHA-256 hash of 'admin123': 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
// SHA-256 hash of 'password123': ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

export const SEED_SQL = `
-- Default Roles & Users
INSERT OR IGNORE INTO users (id, username, full_name, email, password_hash, role, status, must_change_password) VALUES
(1, 'admin', 'Store Administrator', 'admin@clothstore.local', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'super_admin', 'active', 0),
(2, 'manager', 'Tariq Mehmood', 'manager@clothstore.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager', 'active', 0),
(3, 'cashier1', 'Zainab Bibi', 'cashier1@clothstore.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'cashier', 'active', 0),
(4, 'storekeeper', 'Bilal Ahmed', 'store@clothstore.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'store_keeper', 'active', 0);

-- Units of Measurement
INSERT OR IGNORE INTO units (id, name, symbol, is_decimal) VALUES
(1, 'Meter', 'm', 1),
(2, 'Yard', 'yd', 1),
(3, 'Piece / Suit', 'pc', 0),
(4, 'Roll / Thaan', 'roll', 1),
(5, 'Bundle', 'bdl', 0),
(6, 'Kilogram', 'kg', 1),
(7, 'Feet', 'ft', 1);

-- Cloth Categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
(1, 'Cotton & Wash-and-Wear', 'Premium unstitched and blended fabric for men & women'),
(2, 'Lawn & Voile', 'Lightweight summer designer fabrics and printed lawn'),
(3, 'Linen & Khaddar', 'Winter texture fabrics with heavy warmth & durability'),
(4, 'Pure Silk & Chiffon', 'Luxury partywear, bridal silks, and dyed pure chiffons'),
(5, 'Velvet & Organza', 'Rich micro-velvets and embroidered festive organzas'),
(6, 'Denim & Twill', 'Heavy cotton drill, raw denim, and stretch denim fabrics'),
(7, 'Suiting & Blazer', 'Imported tropical wool, terry-rayon, and blazer fabrics'),
(8, 'Shirting & Kurta', 'Egyptian cotton, Oxford weaves, and patterned kurta fabrics'),
(9, 'Ready-to-Wear Apparel', 'Stitched shirts, kurtis, trousers, and dupattas'),
(10, 'Laces & Accessories', 'Borders, buttons, tassels, and tailoring embellishments');

-- Brands / Mills
INSERT OR IGNORE INTO brands (id, name, description) VALUES
(1, 'Gul Ahmed Textiles', 'Pioneer Pakistani textile manufacturer and fine lawn'),
(2, 'Alkaram Studio', 'Premium luxury lawn, linen, and unstitched collections'),
(3, 'Sapphire Mills', 'High-end fabrics and seasonal ready-to-wear lines'),
(4, 'Pasha Fabrics', 'Luxury men suiting, boski, and Egyptian cotton'),
(5, 'Khaadi Textiles', 'Hand-woven, khaddar, and contemporary printed fabrics'),
(6, 'Raymond Fine Fabrics', 'Renowned wool blend and tropical suiting fabrics'),
(7, 'J. Junaid Jamshed', 'Traditional menswear kurta and wash-and-wear fabrics');

-- Suppliers
INSERT OR IGNORE INTO suppliers (id, supplier_code, name, company, phone, whatsapp, email, address, city, tax_number, opening_balance, current_balance, notes, status) VALUES
(1, 'SUP-001', 'Haji Abdul Rahim', 'Rahim Textiles Wholesale', '+92 300 1234567', '+92 300 1234567', 'rahimtextiles@gmail.com', 'Shop #14, Cloth Market, Bunder Road', 'Karachi', 'NTN-8923412-1', 0.0, 45000.0, 'Major supplier for luxury Lawn and Swiss Voile', 'active'),
(2, 'SUP-002', 'Sheikh Usman Farooq', 'Al-Madina Weaving Mills', '+92 321 9876543', '+92 321 9876543', 'almadinafabrics@yahoo.com', 'Plot 45, Industrial Estate, Samundri Road', 'Faisalabad', 'NTN-4512983-4', 0.0, 12500.0, 'Prime source for pure cotton rolls and khaddar thaan', 'active'),
(3, 'SUP-003', 'Chaudhry Nadeem', 'Royal Silk & Velvet Importers', '+92 333 5556677', '+92 333 5556677', 'royalsilk@outlook.com', 'Azam Cloth Market, Walled City', 'Lahore', 'NTN-7819234-8', 0.0, 0.0, 'Importer of Italian suiting, Chinese silk & velvet', 'active'),
(4, 'SUP-004', 'Muhammad Aslam', 'Crown Denim & Twill Mills', '+92 345 4433221', '+92 345 4433221', 'crowndenim@gmail.com', 'SITE Industrial Area', 'Kotri', 'NTN-3344551-9', 0.0, 8000.0, 'Denim rolls, canvas, and twill shirting supplier', 'active');

-- Customers
INSERT OR IGNORE INTO customers (id, customer_code, name, phone, whatsapp, email, address, city, opening_balance, current_balance, notes) VALUES
(1, 'CUST-001', 'Boutique Elegance (Ayesha)', '+92 301 7778899', '+92 301 7778899', 'ayesha.boutique@gmail.com', 'House 12-B, Gulberg III', 'Lahore', 0.0, 18500.0, 'Wholesale & regular buyer for bridal silks and organza'),
(2, 'CUST-002', 'Master Tailors & Drapers', '+92 322 3344556', '+92 322 3344556', 'mastertailors@gmail.com', 'Main Saddar Commercial', 'Rawalpindi', 0.0, 0.0, 'Regular order for men suiting and pocketing lining'),
(3, 'CUST-003', 'Mrs. Farzana Khan', '+92 312 9988776', '+92 312 9988776', 'farzana.khan@gmail.com', 'Street 4, Sector F-7/2', 'Islamabad', 0.0, 0.0, 'VIP retail customer for designer lawn suits'),
(4, 'CUST-004', 'Zubair Menswear Designer', '+92 334 1122334', '+92 334 1122334', 'zubair.menswear@gmail.com', 'Shop 8, Tariq Road Plaza', 'Karachi', 0.0, 7200.0, 'Frequent buyer of Pasha wash-and-wear fabrics');

-- Products
INSERT OR IGNORE INTO products (id, product_code, barcode, name, brand_id, category_id, fabric_type, material, pattern, description, default_unit_id, min_stock, purchase_price, sale_price, wholesale_price, retail_price, status) VALUES
(1, 'PRD-101', '890100100101', 'Egyptian Giza Luxury Cotton', 4, 1, '100% Giza Cotton', 'Pure Mercerized Cotton', 'Solid / Self Weave', 'Ultra-breathable premium Egyptian cotton with lustrous finish for men suits', 1, 15.0, 1200.0, 1850.0, 1550.0, 1850.0, 'active'),
(2, 'PRD-102', '890100100201', 'Digital Printed Swiss Lawn 90/88', 1, 2, 'Swiss Voile Lawn', 'Pure Combed Cotton', 'Floral Digital Print', 'High thread count premium summer lawn with intricate digital motifs', 1, 20.0, 650.0, 1100.0, 900.0, 1100.0, 'active'),
(3, 'PRD-103', '890100100301', 'Handspun Kamalia Khaddar', 5, 3, 'Heavy Khaddar', '100% Organic Desi Cotton', 'Traditional Weave', 'Authentic heavyweight winter texture unstitched suit fabric', 3, 10.0, 2200.0, 3400.0, 2900.0, 3400.0, 'active'),
(4, 'PRD-104', '890100100401', 'Pure Rawaan Silk Charmeuse 80g', 3, 4, 'Pure Mulberry Silk', 'Natural Silk', 'Glossy Satin Finish', 'Fluid drape silk fabric ideal for sarees, gowns, and bridal shirts', 1, 10.0, 2800.0, 4200.0, 3600.0, 4200.0, 'active'),
(5, 'PRD-105', '890100100501', 'Micro Velvet 9000 Premium', 3, 5, 'Micro Velvet', 'Plush Poly-Silk', 'Plain Solid Sheen', 'Super soft 9000 quality winter velvet fabric for shawls and formal tops', 1, 12.0, 1400.0, 2300.0, 1950.0, 2300.0, 'active'),
(6, 'PRD-106', '890100100601', 'Raw Indigo Stretch Denim 12oz', 4, 6, 'Denim Twill', '98% Cotton 2% Spandex', 'Indigo Slub Twill', 'Durable medium-heavy denim fabric for jeans, jackets, and pinafores', 2, 25.0, 480.0, 850.0, 680.0, 850.0, 'active'),
(7, 'PRD-107', '890100100701', 'Tropical Wool Suiting Super 140s', 6, 7, 'Tropical Wool Blend', '70% Wool 30% Silk-Touch', 'Herringbone & Solids', 'Wrinkle-resistant luxury four-season formal blazer & panting fabric', 1, 10.0, 3200.0, 4900.0, 4200.0, 4900.0, 'active');

-- Product Variations (Color, Size, SKU, Barcode, Stock, Price)
INSERT OR IGNORE INTO product_variations (id, product_id, sku, barcode, color, size, fabric_type, unit_id, purchase_price, sale_price, wholesale_price, current_stock, min_stock, status) VALUES
-- Egyptian Cotton (Product 1)
(1, 1, 'GIZA-WHT-54', '890100100101', 'Off-White Ivory', '54-inch Width', '100% Giza Cotton', 1, 1200.0, 1850.0, 1550.0, 85.5, 15.0, 'active'),
(2, 1, 'GIZA-BLK-54', '890100100102', 'Midnight Jet Black', '54-inch Width', '100% Giza Cotton', 1, 1200.0, 1850.0, 1550.0, 42.0, 15.0, 'active'),
(3, 1, 'GIZA-NVY-54', '890100100103', 'Royal Navy Blue', '54-inch Width', '100% Giza Cotton', 1, 1200.0, 1850.0, 1550.0, 6.5, 15.0, 'active'), -- Low stock
(4, 1, 'GIZA-BEG-54', '890100100104', 'Soft Fawn Beige', '54-inch Width', '100% Giza Cotton', 1, 1200.0, 1850.0, 1550.0, 38.0, 15.0, 'active'),

-- Digital Swiss Lawn (Product 2)
(5, 2, 'SWISS-L-BLUSH', '890100100201', 'Blush Pink Floral', '44-inch Width', 'Swiss Voile Lawn', 1, 650.0, 1100.0, 900.0, 110.0, 20.0, 'active'),
(6, 2, 'SWISS-L-MINT', '890100100202', 'Mint Sage Green', '44-inch Width', 'Swiss Voile Lawn', 1, 650.0, 1100.0, 900.0, 95.5, 20.0, 'active'),
(7, 2, 'SWISS-L-LAVN', '890100100203', 'Lavender Lilac', '44-inch Width', 'Swiss Voile Lawn', 1, 650.0, 1100.0, 900.0, 3.0, 20.0, 'active'), -- Low stock

-- Kamalia Khaddar (Product 3)
(8, 3, 'KHD-CHARCOAL', '890100100301', 'Charcoal Grey', 'Full 7-Meter Suit', 'Heavy Khaddar', 3, 2200.0, 3400.0, 2900.0, 24.0, 10.0, 'active'),
(9, 3, 'KHD-MUSTARD', '890100100302', 'Earthy Mustard', 'Full 7-Meter Suit', 'Heavy Khaddar', 3, 2200.0, 3400.0, 2900.0, 18.0, 10.0, 'active'),
(10, 3, 'KHD-NATURAL', '890100100303', 'Raw Unbleached Cream', 'Full 7-Meter Suit', 'Heavy Khaddar', 3, 2200.0, 3400.0, 2900.0, 0.0, 10.0, 'active'), -- Out of stock

-- Pure Rawaan Silk (Product 4)
(11, 4, 'SILK-RUBY-44', '890100100401', 'Deep Ruby Red', '44-inch Width', 'Pure Mulberry Silk', 1, 2800.0, 4200.0, 3600.0, 35.0, 10.0, 'active'),
(12, 4, 'SILK-EMRLD-44', '890100100402', 'Emerald Bottle Green', '44-inch Width', 'Pure Mulberry Silk', 1, 2800.0, 4200.0, 3600.0, 28.5, 10.0, 'active'),
(13, 4, 'SILK-GOLD-44', '890100100403', 'Antique Champagne Gold', '44-inch Width', 'Pure Mulberry Silk', 1, 2800.0, 4200.0, 3600.0, 4.0, 10.0, 'active'), -- Low stock

-- Micro Velvet 9000 (Product 5)
(14, 5, 'VELV-MAROON-54', '890100100501', 'Bridal Dark Maroon', '54-inch Width', 'Micro Velvet 9000', 1, 1400.0, 2300.0, 1950.0, 60.0, 12.0, 'active'),
(15, 5, 'VELV-PLUM-54', '890100100502', 'Imperial Deep Plum', '54-inch Width', 'Micro Velvet 9000', 1, 1400.0, 2300.0, 1950.0, 45.0, 12.0, 'active'),

-- Denim (Product 6)
(16, 6, 'DENIM-INDIGO-60', '890100100601', 'Classic Dark Indigo', '60-inch Width', 'Stretch Denim', 2, 480.0, 850.0, 680.0, 120.0, 25.0, 'active'),
(17, 6, 'DENIM-WASHED-60', '890100100602', 'Vintage Washed Blue', '60-inch Width', 'Stretch Denim', 2, 480.0, 850.0, 680.0, 80.0, 25.0, 'active'),

-- Suiting Super 140s (Product 7)
(18, 7, 'SUIT-SLATE-58', '890100100701', 'Slate Grey Herringbone', '58-inch Width', 'Tropical Wool Blend', 1, 3200.0, 4900.0, 4200.0, 50.0, 10.0, 'active'),
(19, 7, 'SUIT-NAVY-58', '890100100702', 'Oxford Navy Pinstripe', '58-inch Width', 'Tropical Wool Blend', 1, 3200.0, 4900.0, 4200.0, 32.0, 10.0, 'active');

-- Initial Purchases
INSERT OR IGNORE INTO purchases (id, invoice_no, supplier_id, purchase_date, subtotal, discount, tax, grand_total, paid_amount, balance_amount, payment_method, status, notes, created_by) VALUES
(1, 'PUR-2026-001', 1, date('now', '-10 days'), 135000.0, 5000.0, 0.0, 130000.0, 85000.0, 45000.0, 'Bank Transfer', 'partially_paid', 'Initial seasonal stock batch of Egyptian Giza cotton & Swiss lawn rolls', 1),
(2, 'PUR-2026-002', 2, date('now', '-5 days'), 92400.0, 2400.0, 0.0, 90000.0, 77500.0, 12500.0, 'Cash', 'partially_paid', 'Kamalia khaddar unstitched suits and raw desi cotton bundles', 1),
(3, 'PUR-2026-003', 3, date('now', '-2 days'), 168000.0, 8000.0, 0.0, 160000.0, 160000.0, 0.0, 'Bank Transfer', 'paid', 'Pure Rawaan Silk and Micro Velvet 9000 imported consignments', 2);

-- Purchase Items
INSERT OR IGNORE INTO purchase_items (id, purchase_id, product_id, variation_id, quantity, unit_price, discount, total_price) VALUES
(1, 1, 1, 1, 100.0, 1200.0, 0.0, 120000.0),
(2, 1, 2, 5, 23.0, 650.0, 0.0, 15000.0),
(3, 2, 3, 8, 30.0, 2200.0, 0.0, 66000.0),
(4, 2, 3, 9, 12.0, 2200.0, 0.0, 26400.0),
(5, 3, 4, 11, 40.0, 2800.0, 0.0, 112000.0),
(6, 3, 5, 14, 40.0, 1400.0, 0.0, 56000.0);

-- Initial Sales Transactions
INSERT OR IGNORE INTO sales (id, invoice_no, customer_id, customer_name, customer_phone, sale_date, subtotal, discount, tax, grand_total, paid_amount, balance_amount, change_amount, payment_method, payment_status, notes, created_by) VALUES
(1, 'INV-2026-001', 1, 'Boutique Elegance (Ayesha)', '+92 301 7778899', date('now', '-3 days'), 42500.0, 1500.0, 0.0, 41000.0, 22500.0, 18500.0, 0.0, 'Cash', 'partial', 'Bulk cutting for upcoming bridal capsule collection', 3),
(2, 'INV-2026-002', NULL, 'Walk-in Customer (Dr. Hamza)', '+92 333 4455667', date('now', '-1 day'), 7400.0, 0.0, 0.0, 7400.0, 7400.0, 0.0, 0.0, 'Card', 'paid', '4.0 meters Egyptian Giza Jet Black', 3),
(3, 'INV-2026-003', 4, 'Zubair Menswear Designer', '+92 334 1122334', date('now'), 16200.0, 1000.0, 0.0, 15200.0, 8000.0, 7200.0, 0.0, 'Bank Transfer', 'partial', 'Bespoke kurta & formal suiting cut lengths', 3);

-- Sale Items
INSERT OR IGNORE INTO sale_items (id, sale_id, product_id, variation_id, quantity, unit_price, discount, total_price) VALUES
(1, 1, 4, 11, 5.0, 4200.0, 0.0, 21000.0),
(2, 1, 5, 14, 10.0, 2150.0, 0.0, 21500.0),
(3, 2, 1, 2, 4.0, 1850.0, 0.0, 7400.0),
(4, 3, 1, 1, 4.5, 1850.0, 0.0, 8325.0),
(5, 3, 7, 18, 1.6, 4900.0, 0.0, 7875.0);

-- Initial Stock Movements
INSERT OR IGNORE INTO stock_movements (id, date, product_id, variation_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_no, reason, notes) VALUES
(1, datetime('now', '-10 days'), 1, 1, 'opening_stock', 100.0, 0.0, 100.0, 1, 'INIT-001', 'Initial Store Opening Stock', 'Recorded at software deployment'),
(2, datetime('now', '-10 days'), 1, 2, 'opening_stock', 50.0, 0.0, 50.0, 1, 'INIT-002', 'Initial Store Opening Stock', 'Recorded at software deployment'),
(3, datetime('now', '-10 days'), 1, 3, 'opening_stock', 10.0, 0.0, 10.0, 1, 'INIT-003', 'Initial Store Opening Stock', 'Recorded at software deployment'),
(4, datetime('now', '-3 days'), 4, 11, 'sale', -5.0, 40.0, 35.0, 3, 'INV-2026-001', 'POS Customer Invoice', 'Sold to Boutique Elegance'),
(5, datetime('now', '-1 day'), 1, 2, 'sale', -4.0, 46.0, 42.0, 3, 'INV-2026-002', 'POS Customer Invoice', 'Walk-in sale'),
(6, datetime('now'), 1, 1, 'sale', -4.5, 90.0, 85.5, 3, 'INV-2026-003', 'POS Customer Invoice', 'Sold to Zubair Menswear');

-- Expense Categories
INSERT OR IGNORE INTO expense_categories (id, name, description) VALUES
(1, 'Shop Rent & Lease', 'Monthly commercial store lease and plaza maintenance'),
(2, 'Electricity & Utilities', 'Commercial power bills, generator fuel, and water charges'),
(3, 'Staff Salaries & Commission', 'Store keepers, cashiers, helpers, and master cutting masters'),
(4, 'Packaging & Shopping Bags', 'Printed fabric shopping bags, garment covers, labels, polybags'),
(5, 'Transport & Freight Carriage', 'Goods transport carriage from Faisalabad and Lahore markets'),
(6, 'Store Maintenance & Repairs', 'Lighting, AC service, showcase polishing, and POS hardware'),
(7, 'Tea & Customer Refreshment', 'Daily tea, coffee, mineral water, and guest hospitality');

-- Initial Expenses
INSERT OR IGNORE INTO expenses (id, expense_no, category_id, amount, date, payment_method, description, user_id) VALUES
(1, 'EXP-2026-001', 1, 85000.0, date('now', '-15 days'), 'Bank Transfer', 'Monthly Shop Rent - Ground Floor Showroom', 1),
(2, 'EXP-2026-002', 2, 28500.0, date('now', '-10 days'), 'Bank Transfer', 'Electricity & Air-Conditioning Bill', 1),
(3, 'EXP-2026-003', 4, 12000.0, date('now', '-7 days'), 'Cash', '5000 Custom Printed Fabric Carrier Bags', 2),
(4, 'EXP-2026-004', 5, 4500.0, date('now', '-4 days'), 'Cash', 'Freight delivery charges for silk rolls consignment', 2),
(5, 'EXP-2026-005', 7, 3200.0, date('now', '-1 day'), 'Cash', 'Weekly tea, bakery refreshments & cold drinks for customers', 3);

-- Default Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('store_name', 'Silk & Weave Fabric Emporium'),
('tagline', 'The House of Premium Unstitched & Designer Fabrics'),
('phone', '+92 42 35789012'),
('whatsapp', '+92 300 9876543'),
('email', 'info@silknweave.com'),
('address', 'Plaza 14-C, Main Boulevard, Gulberg III'),
('city', 'Lahore, Pakistan'),
('tax_number', 'STRN-3277876129841'),
('currency', 'PKR'),
('tax_rate_percent', '0.0'),
('invoice_prefix', 'INV-2026-'),
('receipt_prefix', 'REC-'),
('purchase_prefix', 'PUR-2026-'),
('return_prefix', 'RET-'),
('costing_method', 'average_cost'),
('low_stock_default', '10'),
('receipt_footer', 'Thank you for shopping at Silk & Weave! Sold fabrics once cut cannot be exchanged. Please present receipt within 7 days for un-cut returns.'),
('printer_type', 'thermal_80mm'),
('auto_backup_frequency', 'daily'),
('backup_copies_to_keep', '10');

-- Initial Audit Log
INSERT OR IGNORE INTO audit_logs (id, user_id, username, action, entity, reference_id, details) VALUES
(1, 1, 'admin', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'SYS-BOOT', 'System initialized with default roles, units, cloth categories and settings'),
(2, 1, 'admin', 'SEED_DEMO_DATA', 'DATABASE', 'SEED-001', 'Realistic fabric store inventory, suppliers, customers, and test sales seeded successfully');
`;
