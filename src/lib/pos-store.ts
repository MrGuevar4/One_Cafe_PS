import { useEffect, useState, useCallback } from "react";

// ─── Category & Menu ──────────────────────────────────────────────────────────
export type Category = "خواردنی خێرا" | "خواردنەوەی گەرم" | "خواردنەوەی سارد" | "نێرگەلە";
export const CATEGORIES: Category[] = ["خواردنی خێرا", "خواردنەوەی گەرم", "خواردنەوەی سارد", "نێرگەلە"];

/** Which printer a category routes to */
export function printerForCategory(cat: Category): "kitchen" | "cafe" {
  if (cat === "خواردنی خێرا") return "kitchen";
  return "cafe";
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  color?: string;
  icon?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderLine {
  itemId: string;
  name: string;
  category: Category;
  price: number;
  qty: number;
}

export type OrderStatus = "pending" | "completed";

export interface Order {
  id: string;
  number: number;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  table?: string;
  status: OrderStatus;
}

// ─── Table Session (Auto-Merge) ───────────────────────────────────────────────
export type SessionStatus = "open" | "settled";

export interface TableSession {
  id: string;
  tableLabel: string;
  orders: Order[];
  openedAt: string;
  settledAt?: string;
  status: SessionStatus;
  paymentMethod?: "cash" | "card";
  amountTendered?: number;
}

// ─── Expenses (Petty Cash) ────────────────────────────────────────────────────
export type ExpenseCategory =
  | "پێداویستییەکان"
  | "چاککردنەوە"
  | "خزمەتگوزارییەکان"
  | "کارمەندان"
  | "خواردن و خواردنەوە"
  | "هیتر";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "پێداویستییەکان",
  "چاککردنەوە",
  "خزمەتگوزارییەکان",
  "کارمەندان",
  "خواردن و خواردنەوە",
  "هیتر",
];

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  timestamp: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "cyberpunk";

// ─── Storage Keys ────────────────────────────────────────────────────────────
const MENU_KEY = "one_cafe_menu_v1";
const ORDERS_KEY = "one_cafe_orders_v1";
const HOLD_KEY = "one_cafe_held_v1";
const COUNTER_KEY = "one_cafe_counter_v1";
const SESSIONS_KEY = "one_cafe_table_sessions_v1";
const EXPENSES_KEY = "one_cafe_expenses_v1";
const THEME_KEY = "one_cafe_theme_v1";

// ─── Default Menu ─────────────────────────────────────────────────────────────
const DEFAULT_MENU: MenuItem[] = [
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

// ─── Core Storage Primitives ──────────────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Cross-component reactivity via custom event
export const CHANGE_EVENT = "one-cafe-store-change";
function emit(key: string) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => read(key, fallback));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === key) setVal(read(key, fallback));
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setVal((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        write(key, next);
        emit(key);
        return next;
      });
    },
    [key],
  );

  return [val, set];
}

// ─── Menu Hook ────────────────────────────────────────────────────────────────
export function useMenu() {
  const [menu, setMenu] = useStored<MenuItem[]>(MENU_KEY, DEFAULT_MENU);

  const addItem = (item: Omit<MenuItem, "id">) =>
    setMenu((prev) => [...prev, { ...item, id: `m_${Date.now()}` }]);
  const updateItem = (id: string, patch: Partial<MenuItem>) =>
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const deleteItem = (id: string) => setMenu((prev) => prev.filter((m) => m.id !== id));
  const getItemCategory = (itemId: string): Category | undefined =>
    menu.find((m) => m.id === itemId)?.category;

  return { menu, addItem, updateItem, deleteItem, getItemCategory };
}

// ─── Orders Hook ──────────────────────────────────────────────────────────────
export function useOrders() {
  const [orders, setOrders] = useStored<Order[]>(ORDERS_KEY, []);
  const addOrder = (o: Order) => setOrders((prev) => [o, ...prev]);
  const updateOrder = (id: string, patch: Partial<Order>) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  return { orders, addOrder, updateOrder };
}

// ─── Held Orders Hook ─────────────────────────────────────────────────────────
export function useHeldOrders() {
  const [held, setHeld] = useStored<{ id: string; lines: OrderLine[]; createdAt: string }[]>(
    HOLD_KEY,
    [],
  );
  const hold = (lines: OrderLine[]) =>
    setHeld((prev) => [
      { id: `h_${Date.now()}`, lines, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  const resume = (id: string) => {
    const found = held.find((h) => h.id === id);
    setHeld((prev) => prev.filter((h) => h.id !== id));
    return found?.lines ?? [];
  };
  const remove = (id: string) => setHeld((prev) => prev.filter((h) => h.id !== id));
  return { held, hold, resume, remove };
}

// ─── Table Sessions Hook ──────────────────────────────────────────────────────
export function useTableSessions() {
  const [sessions, setSessions] = useStored<TableSession[]>(SESSIONS_KEY, []);

  /** Find the open session for a given table label, or undefined */
  const findOpenSession = (tableLabel: string): TableSession | undefined =>
    sessions.find(
      (s) => s.tableLabel.trim().toLowerCase() === tableLabel.trim().toLowerCase() && s.status === "open",
    );

  /**
   * Auto-merge: if an open session exists for this table, append the order.
   * Otherwise, create a new session. Returns the session id.
   */
  const addOrderToSession = (order: Order): string => {
    const tableLabel = order.table?.trim() || "Takeaway";
    let sessionId = "";
    setSessions((prev) => {
      const existingIdx = prev.findIndex(
        (s) =>
          s.tableLabel.trim().toLowerCase() === tableLabel.toLowerCase() && s.status === "open",
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          orders: [...updated[existingIdx].orders, order],
        };
        sessionId = updated[existingIdx].id;
        return updated;
      } else {
        sessionId = `ses_${Date.now()}`;
        const newSession: TableSession = {
          id: sessionId,
          tableLabel,
          orders: [order],
          openedAt: new Date().toISOString(),
          status: "open",
        };
        return [newSession, ...prev];
      }
    });
    return sessionId;
  };

  const settleSession = (
    id: string,
    paymentMethod: "cash" | "card",
    amountTendered: number,
  ) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "settled" as SessionStatus,
              settledAt: new Date().toISOString(),
              paymentMethod,
              amountTendered,
            }
          : s,
      ),
    );
  };

  const deleteSession = (id: string) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));

  const reopenSession = (id: string) =>
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "open" as SessionStatus, settledAt: undefined } : s)),
    );

  return {
    sessions,
    findOpenSession,
    addOrderToSession,
    settleSession,
    deleteSession,
    reopenSession,
  };
}

// ─── Expenses Hook ────────────────────────────────────────────────────────────
export function useExpenses() {
  const [expenses, setExpenses] = useStored<Expense[]>(EXPENSES_KEY, []);

  const addExpense = (e: Omit<Expense, "id" | "timestamp">) =>
    setExpenses((prev) => [
      { ...e, id: `exp_${Date.now()}`, timestamp: new Date().toISOString() },
      ...prev,
    ]);

  const deleteExpense = (id: string) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const updateExpense = (id: string, patch: Partial<Omit<Expense, "id">>) =>
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return { expenses, addExpense, deleteExpense, updateExpense };
}

// ─── Theme Hook ───────────────────────────────────────────────────────────────
export function useTheme() {
  const [theme, setTheme] = useStored<Theme>(THEME_KEY, "dark");

  // Apply the data-theme attribute to <html> whenever theme changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (theme === "cyberpunk") {
      html.setAttribute("data-theme", "cyberpunk");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "cyberpunk" : "dark"));

  return { theme, toggleTheme };
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function nextOrderNumber(): number {
  const n = read<number>(COUNTER_KEY, 1000) + 1;
  write(COUNTER_KEY, n);
  return n;
}

export function formatPrice(v: number) {
  return `${v.toLocaleString()} دینار`;
}

/** Compute the merged total for a session */
export function sessionTotal(session: TableSession): number {
  return session.orders.reduce((sum, o) => sum + o.total, 0);
}

/** Compute the merged subtotal for a session */
export function sessionSubtotal(session: TableSession): number {
  return session.orders.reduce((sum, o) => sum + o.subtotal, 0);
}

/** Get all lines across all orders in a session */
export function sessionAllLines(session: TableSession): OrderLine[] {
  return session.orders.flatMap((o) => o.lines);
}

/** Check if an ISO date string is from today */
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

/** Direct read of sessions from localStorage (non-reactive, for server-side or one-off reads) */
export function readSessionById(id: string): TableSession | undefined {
  const sessions = read<TableSession[]>(SESSIONS_KEY, []);
  return sessions.find((s) => s.id === id);
}
