import { useEffect, useState, useCallback } from "react";

export type Category = "Fast Food" | "Hot Drinks" | "Cold Drinks" | "Shisha";
export const CATEGORIES: Category[] = ["Fast Food", "Hot Drinks", "Cold Drinks", "Shisha"];

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  color?: string;
  icon?: string;
}

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  number: number;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  table?: string;
}

const MENU_KEY = "one_cafe_menu_v1";
const ORDERS_KEY = "one_cafe_orders_v1";
const HOLD_KEY = "one_cafe_held_v1";
const COUNTER_KEY = "one_cafe_counter_v1";

const DEFAULT_MENU: MenuItem[] = [
  { id: "m1", name: "Classic Burger", category: "Fast Food", price: 6500, color: "#f97316", icon: "🍔" },
  { id: "m2", name: "Chicken Wrap", category: "Fast Food", price: 5000, color: "#ef4444", icon: "🌯" },
  { id: "m3", name: "French Fries", category: "Fast Food", price: 2500, color: "#facc15", icon: "🍟" },
  { id: "m4", name: "Pizza Margherita", category: "Fast Food", price: 8000, color: "#dc2626", icon: "🍕" },
  { id: "m5", name: "Espresso", category: "Hot Drinks", price: 2000, color: "#78350f", icon: "☕" },
  { id: "m6", name: "Cappuccino", category: "Hot Drinks", price: 3000, color: "#92400e", icon: "☕" },
  { id: "m7", name: "Tea", category: "Hot Drinks", price: 1500, color: "#16a34a", icon: "🍵" },
  { id: "m8", name: "Hot Chocolate", category: "Hot Drinks", price: 3500, color: "#7c2d12", icon: "🍫" },
  { id: "m9", name: "Iced Latte", category: "Cold Drinks", price: 3500, color: "#0ea5e9", icon: "🥤" },
  { id: "m10", name: "Lemonade", category: "Cold Drinks", price: 2500, color: "#eab308", icon: "🍋" },
  { id: "m11", name: "Mojito", category: "Cold Drinks", price: 4000, color: "#22c55e", icon: "🍹" },
  { id: "m12", name: "Coca Cola", category: "Cold Drinks", price: 1500, color: "#b91c1c", icon: "🥤" },
  { id: "m13", name: "Double Apple", category: "Shisha", price: 8000, color: "#16a34a", icon: "💨" },
  { id: "m14", name: "Mint Shisha", category: "Shisha", price: 8000, color: "#10b981", icon: "💨" },
  { id: "m15", name: "Grape Shisha", category: "Shisha", price: 8500, color: "#7e22ce", icon: "💨" },
];

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

// Cross-component reactivity via storage event + custom event
const CHANGE_EVENT = "one-cafe-store-change";
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

export function useMenu() {
  const [menu, setMenu] = useStored<MenuItem[]>(MENU_KEY, DEFAULT_MENU);

  const addItem = (item: Omit<MenuItem, "id">) =>
    setMenu((prev) => [...prev, { ...item, id: `m_${Date.now()}` }]);
  const updateItem = (id: string, patch: Partial<MenuItem>) =>
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const deleteItem = (id: string) => setMenu((prev) => prev.filter((m) => m.id !== id));

  return { menu, addItem, updateItem, deleteItem };
}

export function useOrders() {
  const [orders, setOrders] = useStored<Order[]>(ORDERS_KEY, []);
  const addOrder = (o: Order) => setOrders((prev) => [o, ...prev]);
  return { orders, addOrder };
}

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

export function nextOrderNumber(): number {
  const n = read<number>(COUNTER_KEY, 1000) + 1;
  write(COUNTER_KEY, n);
  return n;
}

export function formatPrice(v: number) {
  return `${v.toLocaleString()} IQD`;
}
