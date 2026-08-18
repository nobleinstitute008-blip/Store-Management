import initSqlJsAsm from 'sql.js/dist/sql-asm.js';
import initSqlJsWasm, { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SEED_SQL } from './seed';

// Key for browser localStorage / IndexedDB backup persistence
const LOCAL_STORAGE_DB_KEY = 'cloth_store_sqlite_bin';

class DatabaseEngine {
  private db: Database | null = null;
  private isInitialized = false;
  private isElectron = false;
  private initPromise: Promise<void> | null = null;
  private sqlEngine: any = null;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  private async getSqlEngine(): Promise<any> {
    if (this.sqlEngine) return this.sqlEngine;

    // First try pure-JS sql-asm which requires 0 network requests and 0 wasm files
    try {
      this.sqlEngine = await initSqlJsAsm({});
      return this.sqlEngine;
    } catch (asmErr) {
      console.warn('sql-asm initialization fallback to wasm...', asmErr);
      try {
        this.sqlEngine = await initSqlJsWasm({
          locateFile: () => sqlWasmUrl
        });
        return this.sqlEngine;
      } catch (wasmErr) {
        console.warn('wasm locateFile failed, trying public path...', wasmErr);
        this.sqlEngine = await initSqlJsWasm({
          locateFile: (file) => `./${file}`
        });
        return this.sqlEngine;
      }
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (this.isElectron) {
          // In Electron, main process handles the DB file
          this.isInitialized = true;
          return;
        }

        const SQL = await this.getSqlEngine();

        // Check if existing database buffer in localStorage
        const savedData = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
        if (savedData) {
          try {
            const binaryString = atob(savedData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.db = new SQL.Database(bytes);
          } catch (e) {
            console.warn('Failed to parse saved DB, creating new one', e);
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        // Run schema and seed
        await this.bootstrapSchemaAndSeed();
        this.persist();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize SQLite Database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  private async bootstrapSchemaAndSeed() {
    if (!this.db) return;

    // Check if tables already exist
    const checkStmt = this.db.prepare("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='users'");
    let count = 0;
    if (checkStmt.step()) {
      count = (checkStmt.getAsObject().cnt as number) || 0;
    }
    checkStmt.free();

    if (count === 0) {
      // Execute schema and seed
      const schemaSql = `
        PRAGMA foreign_keys = ON;

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

        CREATE TABLE IF NOT EXISTS units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          symbol TEXT UNIQUE NOT NULL,
          is_decimal INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_code TEXT UNIQUE NOT NULL,
          barcode TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          brand_id INTEGER,
          category_id INTEGER NOT NULL,
          fabric_type TEXT NOT NULL,
          material TEXT NOT NULL,
          pattern TEXT NOT NULL,
          description TEXT,
          default_unit_id INTEGER NOT NULL,
          min_stock REAL DEFAULT 10.0,
          purchase_price REAL NOT NULL DEFAULT 0.0,
          sale_price REAL NOT NULL DEFAULT 0.0,
          wholesale_price REAL DEFAULT 0.0,
          retail_price REAL DEFAULT 0.0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_variations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          sku TEXT UNIQUE NOT NULL,
          barcode TEXT UNIQUE NOT NULL,
          color TEXT NOT NULL,
          size TEXT NOT NULL,
          fabric_type TEXT NOT NULL,
          unit_id INTEGER NOT NULL,
          purchase_price REAL NOT NULL DEFAULT 0.0,
          sale_price REAL NOT NULL DEFAULT 0.0,
          wholesale_price REAL DEFAULT 0.0,
          current_stock REAL NOT NULL DEFAULT 0.0,
          min_stock REAL NOT NULL DEFAULT 5.0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_no TEXT UNIQUE NOT NULL,
          supplier_id INTEGER NOT NULL,
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
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS purchase_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          purchase_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          variation_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          discount REAL DEFAULT 0.0,
          total_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_no TEXT UNIQUE NOT NULL,
          purchase_id INTEGER NOT NULL,
          supplier_id INTEGER NOT NULL,
          return_date DATE NOT NULL,
          total_refund REAL NOT NULL DEFAULT 0.0,
          reason TEXT NOT NULL,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS purchase_return_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          purchase_return_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          variation_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_no TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
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
          payment_status TEXT NOT NULL DEFAULT 'paid',
          notes TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          variation_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          discount REAL DEFAULT 0.0,
          total_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales_returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_no TEXT UNIQUE NOT NULL,
          sale_id INTEGER NOT NULL,
          customer_id INTEGER,
          return_date DATE NOT NULL,
          total_refund REAL NOT NULL DEFAULT 0.0,
          reason TEXT NOT NULL,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales_return_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sales_return_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          variation_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          product_id INTEGER NOT NULL,
          variation_id INTEGER NOT NULL,
          movement_type TEXT NOT NULL,
          quantity REAL NOT NULL,
          previous_stock REAL NOT NULL,
          new_stock REAL NOT NULL,
          user_id INTEGER,
          reference_no TEXT NOT NULL,
          reason TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expense_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          expense_no TEXT UNIQUE NOT NULL,
          category_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          payment_method TEXT DEFAULT 'Cash',
          description TEXT NOT NULL,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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
      `;

      this.db.run(schemaSql);
      this.db.run(SEED_SQL);
    }
  }

  private persist() {
    if (!this.db || this.isElectron) return;
    try {
      const data = this.db.export();
      let binary = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const base64 = btoa(binary);
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, base64);
    } catch (e) {
      console.warn('Failed to persist to localStorage:', e);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.isElectron) {
      const res = await (window as any).electronAPI.dbQuery(sql, params);
      if (!res.success) throw new Error(res.error);
      return res.data;
    }

    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    } catch (error: any) {
      console.error(`Database query error [${sql}]:`, error);
      throw error;
    }
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<{ lastInsertRowId?: number; rowsModified?: number }> {
    await this.init();

    if (this.isElectron) {
      const res = await (window as any).electronAPI.dbExecute(sql, params);
      if (!res.success) throw new Error(res.error);
      return {};
    }

    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run(sql, params);
      this.persist();

      const lastIdRes = this.db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowId = lastIdRes.length > 0 && lastIdRes[0].values.length > 0
        ? (lastIdRes[0].values[0][0] as number)
        : undefined;

      return { lastInsertRowId };
    } catch (error: any) {
      console.error(`Database execute error [${sql}]:`, error);
      throw error;
    }
  }

  public async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<boolean> {
    await this.init();

    if (this.isElectron) {
      const res = await (window as any).electronAPI.dbTransaction(queries);
      if (!res.success) throw new Error(res.error);
      return true;
    }

    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run('BEGIN TRANSACTION;');
      for (const q of queries) {
        this.db.run(q.sql, q.params || []);
      }
      this.db.run('COMMIT;');
      this.persist();
      return true;
    } catch (error: any) {
      try {
        this.db.run('ROLLBACK;');
      } catch {}
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  public async exportBackup(): Promise<Uint8Array> {
    await this.init();
    if (this.isElectron) {
      const arr = await (window as any).electronAPI.dbExportBackup();
      return new Uint8Array(arr);
    }
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  public async importBackup(data: Uint8Array): Promise<boolean> {
    if (this.isElectron) {
      const res = await (window as any).electronAPI.dbImportBackup(Array.from(data));
      return res.success;
    }
    const SQL = await this.getSqlEngine();
    this.db = new SQL.Database(data);
    this.persist();
    return true;
  }

  public async resetDatabase(): Promise<boolean> {
    if (this.isElectron) {
      // In electron, drop and re-seed
      await this.execute("SELECT 1;");
    }
    localStorage.removeItem(LOCAL_STORAGE_DB_KEY);
    const SQL = await this.getSqlEngine();
    this.db = new SQL.Database();
    await this.bootstrapSchemaAndSeed();
    this.persist();
    return true;
  }
}

export const db = new DatabaseEngine();
