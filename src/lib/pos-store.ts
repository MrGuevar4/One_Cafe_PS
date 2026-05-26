import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

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
  note?: string;
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

// ─── Error Handling Helper ────────────────────────────────────────────────────
function checkError<T>(res: T | { success: false; error: string }): T {
  if (res && typeof res === "object" && "success" in res && res.success === false) {
    throw new Error(res.error || "کردارەکە سەرکەوتوو نەبوو");
  }
  return res as T;
}

async function runSafe<T>(fn: () => Promise<T>): Promise<T | { success: false; error: string }> {
  try {
    return await fn();
  } catch (error: any) {
    console.error("Database/Server error caught:", error);
    return { success: false, error: error?.message || String(error) };
  }
}

// ─── Server Functions (Vinxi Server IPC) ──────────────────────────────────────

export const getMenuServer = createServerFn()
  .handler(async () => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getMenu() as MenuItem[];
    });
  });

export const addMenuItemServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return {} as any;
    return {
      name: String(data.name || "").trim(),
      category: String(data.category || "خواردنی خێرا").trim() as Category,
      price: Number(data.price) || 0,
      color: data.color ? String(data.color).trim() : undefined,
      icon: data.icon ? String(data.icon).trim() : undefined,
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return await dbService.addMenuItem(data);
    });
  });

export const updateMenuItemServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return { id: "", patch: {} };
    return {
      id: String(data.id || "").trim(),
      patch: data.patch ? {
        name: data.patch.name !== undefined ? String(data.patch.name || "").trim() : undefined,
        category: data.patch.category !== undefined ? String(data.patch.category || "").trim() as Category : undefined,
        price: data.patch.price !== undefined ? (Number(data.patch.price) || 0) : undefined,
        color: data.patch.color !== undefined ? (data.patch.color ? String(data.patch.color).trim() : undefined) : undefined,
        icon: data.patch.icon !== undefined ? (data.patch.icon ? String(data.patch.icon).trim() : undefined) : undefined,
      } : {},
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.updateMenuItem(data.id, data.patch);
    });
  });

export const deleteMenuItemServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.deleteMenuItem(data);
    });
  });

export const getOrdersServer = createServerFn()
  .handler(async () => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getOrders() as Order[];
    });
  });

export const addOrderServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return {} as any;
    const lines = Array.isArray(data.lines) ? data.lines.map((l: any) => ({
      itemId: String(l?.itemId || "").trim(),
      name: String(l?.name || "").trim(),
      category: String(l?.category || "خواردنی خێرا").trim() as Category,
      price: Number(l?.price) || 0,
      qty: Number(l?.qty) || 0,
    })) : [];
    return {
      id: String(data.id || "").trim(),
      number: Number(data.number) || 0,
      createdAt: String(data.createdAt || new Date().toISOString()),
      lines,
      subtotal: Number(data.subtotal) || 0,
      tax: Number(data.tax) || 0,
      total: Number(data.total) || 0,
      table: data.table ? String(data.table).trim() : undefined,
      note: data.note ? String(data.note).trim() : undefined,
      status: String(data.status || "pending") as OrderStatus,
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.addOrder(data);
    });
  });

export const updateOrderServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return { id: "", patch: {} };
    return {
      id: String(data.id || "").trim(),
      patch: data.patch ? {
        status: data.patch.status !== undefined ? String(data.patch.status).trim() as OrderStatus : undefined,
        note: data.patch.note !== undefined ? String(data.patch.note).trim() : undefined,
      } : {},
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.updateOrder(data.id, data.patch);
    });
  });

export const getSessionsServer = createServerFn()
  .handler(async () => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getSessions() as TableSession[];
    });
  });

export const getSessionByIdServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getSessionById(data) as TableSession | undefined;
    });
  });

export const settleSessionServer = createServerFn()
  .inputValidator((data: any) => {
    return {
      id: String(data.id || "").trim(),
      paymentMethod: (data.paymentMethod === "card" ? "card" : "cash") as "cash" | "card",
      amountTendered: Number(data.amountTendered) || 0,
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.settleSession(data.id, data.paymentMethod, data.amountTendered);
    });
  });

export const deleteSessionServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.deleteSession(data);
    });
  });

export const reopenSessionServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.reopenSession(data);
    });
  });

export const getExpensesServer = createServerFn()
  .handler(async () => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getExpenses() as Expense[];
    });
  });

export const addExpenseServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return {} as any;
    return {
      category: String(data.category || "هیتر").trim() as ExpenseCategory,
      description: String(data.description || "").trim(),
      amount: Number(data.amount) || 0,
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.addExpense(data);
    });
  });

export const deleteExpenseServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.deleteExpense(data);
    });
  });

export const updateExpenseServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return { id: "", patch: {} };
    return {
      id: String(data.id || "").trim(),
      patch: data.patch ? {
        category: data.patch.category !== undefined ? String(data.patch.category || "هیتر").trim() as ExpenseCategory : undefined,
        description: data.patch.description !== undefined ? String(data.patch.description || "").trim() : undefined,
        amount: data.patch.amount !== undefined ? (Number(data.patch.amount) || 0) : undefined,
      } : {},
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.updateExpense(data.id, data.patch);
    });
  });

export const getHeldOrdersServer = createServerFn()
  .handler(async () => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      return dbService.getHeldOrders() as { id: string; lines: OrderLine[]; createdAt: string }[];
    });
  });

export const addHeldOrderServer = createServerFn()
  .inputValidator((data: any) => {
    if (!data) return { id: "", lines: [] };
    const lines = Array.isArray(data.lines) ? data.lines.map((l: any) => ({
      itemId: String(l?.itemId || "").trim(),
      name: String(l?.name || "").trim(),
      category: String(l?.category || "خواردنی خێرا").trim() as Category,
      price: Number(l?.price) || 0,
      qty: Number(l?.qty) || 0,
    })) : [];
    return {
      id: String(data.id || "").trim(),
      lines,
    };
  })
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.addHeldOrder(data.id, data.lines);
    });
  });

export const deleteHeldOrderServer = createServerFn()
  .inputValidator((data: any) => String(data || "").trim())
  .handler(async ({ data }) => {
    return runSafe(async () => {
      const { dbService } = await import("./db");
      await dbService.deleteHeldOrder(data);
    });
  });

// ─── React Client Hooks ──────────────────────────────────────────────────────

export function useMenu() {
  const queryClient = useQueryClient();
  const { data: menu = [] } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenuServer();
      return checkError(res);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: Omit<MenuItem, "id">) => {
      const res = await addMenuItemServer({ data: item });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
    onError: (error: any) => {
      console.error("Mutation failed (addItem):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە زیادکردنی بابەت: ${error.message || error}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: string; patch: Partial<MenuItem> }) => {
      const res = await updateMenuItemServer({ data: args });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
    onError: (error: any) => {
      console.error("Mutation failed (updateItem):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە نوێکردنەوەی بابەت: ${error.message || error}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteMenuItemServer({ data: id });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
    onError: (error: any) => {
      console.error("Mutation failed (deleteItem):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە سڕینەوەی بابەت: ${error.message || error}`);
      }
    },
  });

  const addItem = (item: Omit<MenuItem, "id">) => addMutation.mutateAsync(item);
  const updateItem = (id: string, patch: Partial<MenuItem>) => updateMutation.mutateAsync({ id, patch });
  const deleteItem = (id: string) => deleteMutation.mutateAsync(id);
  const getItemCategory = (itemId: string): Category | undefined =>
    menu.find((m) => m.id === itemId)?.category;

  return { menu, addItem, updateItem, deleteItem, getItemCategory };
}

export function useOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await getOrdersServer();
      return checkError(res);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (o: Order) => {
      const res = await addOrderServer({ data: o });
      return checkError(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: any) => {
      console.error("Mutation failed (addOrder):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە زیادکردنی داواکاری: ${error.message || error}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: string; patch: Partial<Order> }) => {
      const res = await updateOrderServer({ data: args });
      return checkError(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: any) => {
      console.error("Mutation failed (updateOrder):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە نوێکردنەوەی داواکاری: ${error.message || error}`);
      }
    },
  });

  const addOrder = (o: Order) => addMutation.mutateAsync(o);
  const updateOrder = (id: string, patch: Partial<Order>) => updateMutation.mutateAsync({ id, patch });

  return { orders, addOrder, updateOrder };
}

export function useHeldOrders() {
  const queryClient = useQueryClient();
  const { data: held = [] } = useQuery({
    queryKey: ["held"],
    queryFn: async () => {
      const res = await getHeldOrdersServer();
      return checkError(res);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (args: { id: string; lines: OrderLine[] }) => {
      const res = await addHeldOrderServer({ data: args });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["held"] }),
    onError: (error: any) => {
      console.error("Mutation failed (holdOrder):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە هەڵگرتنی داواکاری: ${error.message || error}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteHeldOrderServer({ data: id });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["held"] }),
    onError: (error: any) => {
      console.error("Mutation failed (deleteHeldOrder):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە سڕینەوەی داواکاری هەڵگیراو: ${error.message || error}`);
      }
    },
  });

  const hold = (lines: OrderLine[]) => {
    const id = `h_${Date.now()}`;
    addMutation.mutateAsync({ id, lines });
  };

  const resume = (id: string): OrderLine[] => {
    const found = held.find((h) => h.id === id);
    if (found) {
      deleteMutation.mutateAsync(id);
      return found.lines;
    }
    return [];
  };

  const remove = (id: string) => deleteMutation.mutateAsync(id);

  return { held, hold, resume, remove };
}

export function useTableSessions() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await getSessionsServer();
      return checkError(res);
    },
  });

  const settleMutation = useMutation({
    mutationFn: async (args: { id: string; paymentMethod: "cash" | "card"; amountTendered: number }) => {
      const res = await settleSessionServer({ data: args });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
    onError: (error: any) => {
      console.error("Mutation failed (settleSession):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە یەکلاکردنەوەی مێز: ${error.message || error}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteSessionServer({ data: id });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
    onError: (error: any) => {
      console.error("Mutation failed (deleteSession):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە سڕینەوەی مێز: ${error.message || error}`);
      }
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await reopenSessionServer({ data: id });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
    onError: (error: any) => {
      console.error("Mutation failed (reopenSession):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە دووبارە کردنەوەی مێز: ${error.message || error}`);
      }
    },
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
  ) => settleMutation.mutateAsync({ id, paymentMethod, amountTendered });

  const deleteSession = (id: string) => deleteMutation.mutateAsync(id);
  const reopenSession = (id: string) => reopenMutation.mutateAsync(id);

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
    queryFn: async () => {
      const res = await getExpensesServer();
      return checkError(res);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (e: Omit<Expense, "id" | "timestamp">) => {
      const res = await addExpenseServer({ data: e });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (error: any) => {
      console.error("Mutation failed (addExpense):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە زیادکردنی خەرجی: ${error.message || error}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteExpenseServer({ data: id });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (error: any) => {
      console.error("Mutation failed (deleteExpense):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە سڕینەوەی خەرجی: ${error.message || error}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: string; patch: Partial<Expense> }) => {
      const res = await updateExpenseServer({ data: args });
      return checkError(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (error: any) => {
      console.error("Mutation failed (updateExpense):", error);
      if (typeof window !== "undefined") {
        toast.error(`شکستی هێنا لە نوێکردنەوەی خەرجی: ${error.message || error}`);
      }
    },
  });

  const addExpense = (e: Omit<Expense, "id" | "timestamp">) => addMutation.mutateAsync(e);
  const deleteExpense = (id: string) => deleteMutation.mutateAsync(id);
  const updateExpense = (id: string, patch: Partial<Omit<Expense, "id">>) =>
    updateMutation.mutateAsync({ id, patch: patch as Partial<Expense> });

  return { expenses, addExpense, deleteExpense, updateExpense };
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("one_cafe_theme_v1") as Theme;
    if (saved === "cyberpunk" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

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
