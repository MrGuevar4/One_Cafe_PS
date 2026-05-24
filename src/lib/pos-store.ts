import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

// ─── Category & Menu ──────────────────────────────────────────────────────────
export type Category = "خواردنی خێرا" | "خواردنەوەی گەرم" | "خواردنەوەی سارد" | "نێرگەلە";
export const CATEGORIES: Category[] = ["خواردنی خێرا", "خواردنەوەی گەرم", "خواردنەوەی سارد", "نێرگەلە"];

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

// ─── Server Functions (Vinxi Server IPC) ──────────────────────────────────────

export const getMenuServer = createServerFn()
  .handler(async () => {
    const { dbService } = await import("./db");
    return dbService.getMenu() as MenuItem[];
  });

export const addMenuItemServer = createServerFn()
  .inputValidator((data: Omit<MenuItem, "id">) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.addMenuItem(data);
  });

export const updateMenuItemServer = createServerFn()
  .inputValidator((data: { id: string; patch: Partial<MenuItem> }) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.updateMenuItem(data.id, data.patch);
  });

export const deleteMenuItemServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.deleteMenuItem(data);
  });

export const getOrdersServer = createServerFn()
  .handler(async () => {
    const { dbService } = await import("./db");
    return dbService.getOrders() as Order[];
  });

export const addOrderServer = createServerFn()
  .inputValidator((data: Order) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.addOrder(data);
  });

export const updateOrderServer = createServerFn()
  .inputValidator((data: { id: string; patch: Partial<Order> }) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.updateOrder(data.id, data.patch);
  });

export const getSessionsServer = createServerFn()
  .handler(async () => {
    const { dbService } = await import("./db");
    return dbService.getSessions() as TableSession[];
  });

export const getSessionByIdServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.getSessionById(data) as TableSession | undefined;
  });

export const settleSessionServer = createServerFn()
  .inputValidator((data: { id: string; paymentMethod: "cash" | "card"; amountTendered: number }) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.settleSession(data.id, data.paymentMethod, data.amountTendered);
  });

export const deleteSessionServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.deleteSession(data);
  });

export const reopenSessionServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.reopenSession(data);
  });

export const getExpensesServer = createServerFn()
  .handler(async () => {
    const { dbService } = await import("./db");
    return dbService.getExpenses() as Expense[];
  });

export const addExpenseServer = createServerFn()
  .inputValidator((data: Omit<Expense, "id" | "timestamp">) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.addExpense(data);
  });

export const deleteExpenseServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.deleteExpense(data);
  });

export const updateExpenseServer = createServerFn()
  .inputValidator((data: { id: string; patch: Partial<Expense> }) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.updateExpense(data.id, data.patch);
  });

export const getHeldOrdersServer = createServerFn()
  .handler(async () => {
    const { dbService } = await import("./db");
    return dbService.getHeldOrders() as { id: string; lines: OrderLine[]; createdAt: string }[];
  });

export const addHeldOrderServer = createServerFn()
  .inputValidator((data: { id: string; lines: OrderLine[] }) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.addHeldOrder(data.id, data.lines);
  });

export const deleteHeldOrderServer = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    const { dbService } = await import("./db");
    return dbService.deleteHeldOrder(data);
  });

// ─── React Client Hooks ──────────────────────────────────────────────────────

export function useMenu() {
  const queryClient = useQueryClient();
  const { data: menu = [] } = useQuery({
    queryKey: ["menu"],
    queryFn: () => getMenuServer(),
  });

  const addMutation = useMutation({
    mutationFn: (item: Omit<MenuItem, "id">) => addMenuItemServer({ data: item }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<MenuItem> }) => updateMenuItemServer({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItemServer({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const addItem = (item: Omit<MenuItem, "id">) => addMutation.mutate(item);
  const updateItem = (id: string, patch: Partial<MenuItem>) => updateMutation.mutate({ id, patch });
  const deleteItem = (id: string) => deleteMutation.mutate(id);
  const getItemCategory = (itemId: string): Category | undefined =>
    menu.find((m) => m.id === itemId)?.category;

  return { menu, addItem, updateItem, deleteItem, getItemCategory };
}

export function useOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrdersServer(),
  });

  const addMutation = useMutation({
    mutationFn: (o: Order) => addOrderServer({ data: o }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Order> }) => updateOrderServer({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const addOrder = (o: Order) => addMutation.mutate(o);
  const updateOrder = (id: string, patch: Partial<Order>) => updateMutation.mutate({ id, patch });

  return { orders, addOrder, updateOrder };
}

export function useHeldOrders() {
  const queryClient = useQueryClient();
  const { data: held = [] } = useQuery({
    queryKey: ["held"],
    queryFn: () => getHeldOrdersServer(),
  });

  const addMutation = useMutation({
    mutationFn: (args: { id: string; lines: OrderLine[] }) => addHeldOrderServer({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["held"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHeldOrderServer({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["held"] }),
  });

  const hold = (lines: OrderLine[]) => {
    const id = `h_${Date.now()}`;
    addMutation.mutate({ id, lines });
  };

  const resume = (id: string): OrderLine[] => {
    const found = held.find((h) => h.id === id);
    if (found) {
      deleteMutation.mutate(id);
      return found.lines;
    }
    return [];
  };

  const remove = (id: string) => deleteMutation.mutate(id);

  return { held, hold, resume, remove };
}

export function useTableSessions() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getSessionsServer(),
  });

  const settleMutation = useMutation({
    mutationFn: (args: { id: string; paymentMethod: "cash" | "card"; amountTendered: number }) =>
      settleSessionServer({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSessionServer({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopenSessionServer({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const findOpenSession = (tableLabel: string): TableSession | undefined =>
    sessions.find(
      (s) => s.tableLabel.trim().toLowerCase() === tableLabel.trim().toLowerCase() && s.status === "open",
    );

  const addOrderToSession = (order: Order): string => {
    // Session grouping is executed transactional server-side in addOrderServer.
    return "";
  };

  const settleSession = (
    id: string,
    paymentMethod: "cash" | "card",
    amountTendered: number,
  ) => settleMutation.mutate({ id, paymentMethod, amountTendered });

  const deleteSession = (id: string) => deleteMutation.mutate(id);
  const reopenSession = (id: string) => reopenMutation.mutate(id);

  return {
    sessions,
    findOpenSession,
    addOrderToSession,
    settleSession,
    deleteSession,
    reopenSession,
  };
}

export function useExpenses() {
  const queryClient = useQueryClient();
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpensesServer(),
  });

  const addMutation = useMutation({
    mutationFn: (e: Omit<Expense, "id" | "timestamp">) => addExpenseServer({ data: e }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseServer({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Expense> }) => updateExpenseServer({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const addExpense = (e: Omit<Expense, "id" | "timestamp">) => addMutation.mutate(e);
  const deleteExpense = (id: string) => deleteMutation.mutate(id);
  const updateExpense = (id: string, patch: Partial<Omit<Expense, "id">>) =>
    updateMutation.mutate({ id, patch: patch as Partial<Expense> });

  return { expenses, addExpense, deleteExpense, updateExpense };
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("one_cafe_theme_v1") as Theme) ?? "dark";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (theme === "cyberpunk") {
      html.setAttribute("data-theme", "cyberpunk");
    } else {
      html.removeAttribute("data-theme");
    }
    localStorage.setItem("one_cafe_theme_v1", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "cyberpunk" : "dark"));

  return { theme, toggleTheme };
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function nextOrderNumber(): number {
  if (typeof window === "undefined") return 1000;
  const lastNum = localStorage.getItem("one_cafe_order_counter");
  const nextNum = lastNum ? parseInt(lastNum) + 1 : 1001;
  localStorage.setItem("one_cafe_order_counter", nextNum.toString());
  return nextNum;
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
