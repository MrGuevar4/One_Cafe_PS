import { Database } from "bun:sqlite";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "pos.db");
const db = new Database(DB_PATH);

// Enable WAL mode for write concurrency and resilience to power failures
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

// Initialize Database Schema
db.run(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    color TEXT,
    icon TEXT
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS table_sessions (
    id TEXT PRIMARY KEY,
    table_label TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    settled_at TEXT,
    status TEXT NOT NULL, -- 'open' | 'settled'
    payment_method TEXT,
    amount_tendered REAL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    table_label TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES table_sessions (id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS order_lines (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    qty INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS held_orders (
    id TEXT PRIMARY KEY,
    lines_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Seed Default Menu Items if empty
const menuCountResult = db.query("SELECT COUNT(*) as count FROM menu_items").get() as { count: number } | undefined;
const menuCount = menuCountResult?.count ?? 0;

if (menuCount === 0) {
  const insert = db.prepare("INSERT INTO menu_items (id, name, category, price, color, icon) VALUES ($id, $name, $category, $price, $color, $icon)");
  const defaultItems = [
    { id: "m1", name: "بەرگری کلاسیک", category: "خواردنی خێرا", price: 6500, color: "#f97316", icon: "🍔" },
    { id: "m2", name: "ڕاپی مریشک", category: "خواردنی خێرا", price: 5000, color: "#ef4444", icon: "🌯" },
    { id: "m3", name: "پەتاتەی سوورەکراو", category: "خواردنی خێرا", price: 2500, color: "#facc15", icon: "🍟" },
    { id: "m4", name: "پیتزای مارگاریتا", category: "خواردنی خێرا", price: 8000, color: "#dc2626", icon: "🍕" },
    { id: "m5", name: "ئێسپریسۆ", category: "خواردنەوەی گەرم", price: 2000, color: "#78350f", icon: "☕" },
    { id: "m6", name: "کاپوچینۆ", category: "خواردنەوەی گەرم", price: 3000, color: "#92400e", icon: "☕" },
    { id: "m7", name: "چای", category: "خواردنەوەی گەرم", price: 1500, color: "#16a34a", icon: "🍵" },
    { id: "m8", name: "شۆکۆلاتەی گەرم", category: "خواردنەوەی گەرم", price: 3500, color: "#7c2d12", icon: "🍫" },
    { id: "m9", name: "ئایس لاتی", category: "خواردنەوەی سارد", price: 3500, color: "#0ea5e9", icon: "🥤" },
    { id: "m10", name: "لیمۆناد", category: "خواردنەوەی سارد", price: 2500, color: "#eab308", icon: "🍋" },
    { id: "m11", name: "مۆهیتۆ", category: "خواردنەوەی سارد", price: 4000, color: "#22c55e", icon: "🍹" },
    { id: "m12", name: "کۆکا کۆلا", category: "خواردنەوەی سارد", price: 1500, color: "#b91c1c", icon: "🥤" },
    { id: "m13", name: "دوو سێو", category: "نێرگەلە", price: 8000, color: "#16a34a", icon: "💨" },
    { id: "m14", name: "نێرگەلەی نەعنا", category: "نێرگەلە", price: 8000, color: "#10b981", icon: "💨" },
    { id: "m15", name: "نێرگەلەی ترێ", category: "نێرگەلە", price: 8500, color: "#7e22ce", icon: "💨" },
  ];
  db.transaction(() => {
    for (const item of defaultItems) {
      insert.run({
        $id: item.id,
        $name: item.name,
        $category: item.category,
        $price: item.price,
        $color: item.color ?? null,
        $icon: item.icon ?? null,
      });
    }
  })();
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface DBMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  color?: string;
  icon?: string;
}

export interface DBOrderLine {
  itemId: string;
  name: string;
  category: string;
  price: number;
  qty: number;
}

export interface DBOrder {
  id: string;
  number: number;
  createdAt: string;
  lines: DBOrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  table?: string;
  status: "pending" | "completed";
}

export interface DBTableSession {
  id: string;
  tableLabel: string;
  orders: DBOrder[];
  openedAt: string;
  settledAt?: string;
  status: "open" | "settled";
  paymentMethod?: "cash" | "card";
  amountTendered?: number;
}

export interface DBExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface DBHeldOrder {
  id: string;
  lines: DBOrderLine[];
  createdAt: string;
}

// ─── QUERY & MUTATION EXPORTS ────────────────────────────────────────────────
export const dbService = {
  // Menu CRUD
  getMenu(): DBMenuItem[] {
    const rows = db.query("SELECT * FROM menu_items").all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: r.price,
      color: r.color ?? undefined,
      icon: r.icon ?? undefined,
    }));
  },

  addMenuItem(item: Omit<DBMenuItem, "id">): string {
    const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    db.query("INSERT INTO menu_items (id, name, category, price, color, icon) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, item.name, item.category, item.price, item.color ?? null, item.icon ?? null);
    return id;
  },

  updateMenuItem(id: string, patch: Partial<DBMenuItem>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (patch.name !== undefined) { sets.push("name = ?"); vals.push(patch.name); }
    if (patch.category !== undefined) { sets.push("category = ?"); vals.push(patch.category); }
    if (patch.price !== undefined) { sets.push("price = ?"); vals.push(patch.price); }
    if (patch.color !== undefined) { sets.push("color = ?"); vals.push(patch.color ?? null); }
    if (patch.icon !== undefined) { sets.push("icon = ?"); vals.push(patch.icon ?? null); }
    
    if (sets.length === 0) return;
    vals.push(id);
    db.query(`UPDATE menu_items SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  },

  deleteMenuItem(id: string): void {
    db.query("DELETE FROM menu_items WHERE id = ?").run(id);
  },

  // Orders CRUD
  getOrders(): DBOrder[] {
    const rows = db.query("SELECT * FROM orders ORDER BY created_at DESC").all() as any[];
    const orders: DBOrder[] = [];
    for (const r of rows) {
      const lineRows = db.query("SELECT * FROM order_lines WHERE order_id = ?").all(r.id) as any[];
      orders.push({
        id: r.id,
        number: r.number,
        createdAt: r.created_at,
        subtotal: r.subtotal,
        tax: r.tax,
        total: r.total,
        table: r.table_label ?? undefined,
        status: r.status,
        lines: lineRows.map(l => ({
          itemId: l.item_id,
          name: l.name,
          category: l.category,
          price: l.price,
          qty: l.qty,
        })),
      });
    }
    return orders;
  },

  addOrder(order: DBOrder): void {
    const tableLabel = order.table?.trim() || "Takeaway";
    
    db.transaction(() => {
      // 1. Check for active open session for this table label
      let session = db.query("SELECT id FROM table_sessions WHERE table_label = ? AND status = 'open'").get(tableLabel) as { id: string } | null;
      let sessionId = session?.id;

      if (!sessionId) {
        sessionId = `ses_${Date.now()}`;
        db.query("INSERT INTO table_sessions (id, table_label, opened_at, status) VALUES (?, ?, ?, 'open')")
          .run(sessionId, tableLabel, new Date().toISOString());
      }

      // 2. Insert the order linked to the session
      db.query("INSERT INTO orders (id, session_id, number, created_at, subtotal, tax, total, table_label, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(order.id, sessionId, order.number, order.createdAt, order.subtotal, order.tax, order.total, order.table || null, order.status);

      // 3. Insert order lines
      const insertLine = db.prepare("INSERT INTO order_lines (id, order_id, item_id, name, category, price, qty) VALUES ($id, $orderId, $itemId, $name, $category, $price, $qty)");
      for (let i = 0; i < order.lines.length; i++) {
        const l = order.lines[i];
        insertLine.run({
          $id: `${order.id}_line_${i}`,
          $orderId: order.id,
          $itemId: l.itemId,
          $name: l.name,
          $category: l.category,
          $price: l.price,
          $qty: l.qty,
        });
      }
    })();
  },

  updateOrder(id: string, patch: Partial<DBOrder>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (patch.status !== undefined) { sets.push("status = ?"); vals.push(patch.status); }
    if (sets.length === 0) return;
    vals.push(id);
    db.query(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  },

  // Table Sessions CRUD
  getSessions(): DBTableSession[] {
    const rows = db.query("SELECT * FROM table_sessions ORDER BY opened_at DESC").all() as any[];
    const sessions: DBTableSession[] = [];
    
    for (const r of rows) {
      const orderRows = db.query("SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC").all(r.id) as any[];
      const orders: DBOrder[] = [];
      
      for (const orow of orderRows) {
        const lineRows = db.query("SELECT * FROM order_lines WHERE order_id = ?").all(orow.id) as any[];
        orders.push({
          id: orow.id,
          number: orow.number,
          createdAt: orow.created_at,
          subtotal: orow.subtotal,
          tax: orow.tax,
          total: orow.total,
          table: orow.table_label ?? undefined,
          status: orow.status,
          lines: lineRows.map(l => ({
            itemId: l.item_id,
            name: l.name,
            category: l.category,
            price: l.price,
            qty: l.qty,
          })),
        });
      }

      sessions.push({
        id: r.id,
        tableLabel: r.table_label,
        openedAt: r.opened_at,
        settledAt: r.settled_at ?? undefined,
        status: r.status,
        paymentMethod: r.payment_method ?? undefined,
        amountTendered: r.amount_tendered !== null ? r.amount_tendered : undefined,
        orders,
      });
    }

    return sessions;
  },

  getSessionById(id: string): DBTableSession | undefined {
    const r = db.query("SELECT * FROM table_sessions WHERE id = ?").get(id) as any;
    if (!r) return undefined;
    
    const orderRows = db.query("SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC").all(r.id) as any[];
    const orders: DBOrder[] = [];
    
    for (const orow of orderRows) {
      const lineRows = db.query("SELECT * FROM order_lines WHERE order_id = ?").all(orow.id) as any[];
      orders.push({
        id: orow.id,
        number: orow.number,
        createdAt: orow.created_at,
        subtotal: orow.subtotal,
        tax: orow.tax,
        total: orow.total,
        table: orow.table_label ?? undefined,
        status: orow.status,
        lines: lineRows.map(l => ({
          itemId: l.item_id,
          name: l.name,
          category: l.category,
          price: l.price,
          qty: l.qty,
        })),
      });
    }

    return {
      id: r.id,
      tableLabel: r.table_label,
      openedAt: r.opened_at,
      settledAt: r.settled_at ?? undefined,
      status: r.status,
      paymentMethod: r.payment_method ?? undefined,
      amountTendered: r.amount_tendered !== null ? r.amount_tendered : undefined,
      orders,
    };
  },

  settleSession(id: string, paymentMethod: "cash" | "card", amountTendered: number): void {
    db.query("UPDATE table_sessions SET status = 'settled', settled_at = ?, payment_method = ?, amount_tendered = ? WHERE id = ?")
      .run(new Date().toISOString(), paymentMethod, amountTendered, id);
  },

  deleteSession(id: string): void {
    db.query("DELETE FROM table_sessions WHERE id = ?").run(id);
  },

  reopenSession(id: string): void {
    db.query("UPDATE table_sessions SET status = 'open', settled_at = NULL, payment_method = NULL, amount_tendered = NULL WHERE id = ?")
      .run(id);
  },

  // Expenses CRUD
  getExpenses(): DBExpense[] {
    const rows = db.query("SELECT * FROM expenses ORDER BY timestamp DESC").all() as any[];
    return rows.map(r => ({
      id: r.id,
      category: r.category,
      description: r.description,
      amount: r.amount,
      timestamp: r.timestamp,
    }));
  },

  addExpense(e: Omit<DBExpense, "id" | "timestamp">): void {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    db.query("INSERT INTO expenses (id, category, description, amount, timestamp) VALUES (?, ?, ?, ?, ?)")
      .run(id, e.category, e.description, e.amount, new Date().toISOString());
  },

  deleteExpense(id: string): void {
    db.query("DELETE FROM expenses WHERE id = ?").run(id);
  },

  updateExpense(id: string, patch: Partial<DBExpense>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (patch.category !== undefined) { sets.push("category = ?"); vals.push(patch.category); }
    if (patch.description !== undefined) { sets.push("description = ?"); vals.push(patch.description); }
    if (patch.amount !== undefined) { sets.push("amount = ?"); vals.push(patch.amount); }
    
    if (sets.length === 0) return;
    vals.push(id);
    db.query(`UPDATE expenses SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  },

  // Held Orders CRUD
  getHeldOrders(): DBHeldOrder[] {
    const rows = db.query("SELECT * FROM held_orders ORDER BY created_at DESC").all() as any[];
    return rows.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      lines: JSON.parse(r.lines_json),
    }));
  },

  addHeldOrder(id: string, lines: DBOrderLine[]): void {
    db.query("INSERT INTO held_orders (id, lines_json, created_at) VALUES (?, ?, ?)")
      .run(id, JSON.stringify(lines), new Date().toISOString());
  },

  deleteHeldOrder(id: string): void {
    db.query("DELETE FROM held_orders WHERE id = ?").run(id);
  },
};
