import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  PauseCircle,
  PlayCircle,
  Printer,
  X,
  CreditCard,
} from "lucide-react";
import {
  CATEGORIES,
  formatPrice,
  nextOrderNumber,
  useHeldOrders,
  useMenu,
  useOrders,
  useTableSessions,
  type Category,
  type MenuItem,
  type Order,
  type OrderLine,
} from "@/lib/pos-store";
import { AppNav } from "@/components/AppNav";
import { Receipt } from "@/components/Receipt";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { sendPrintJob } from "@/hooks/use-print-server-status";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فرۆشتن — ONE Cafe & Restaurant" },
      { name: "description", content: "بەشی فرۆشتن بۆ ONE Cafe & Restaurant." },
    ],
  }),
  component: POSPage,
});

function POSPage() {
  const { menu } = useMenu();
  const { addOrder } = useOrders();
  const { held, hold, resume, remove } = useHeldOrders();
  const { addOrderToSession } = useTableSessions();
  const navigate = useNavigate();

  const [activeCat, setActiveCat] = useState<Category>("خواردنی خێرا");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [table, setTable] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showHeld, setShowHeld] = useState(false);

  const filtered = useMemo(() => menu.filter((m) => m.category === activeCat), [menu, activeCat]);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  const addItem = (item: MenuItem) => {
    setLines((prev) => {
      const found = prev.find((l) => l.itemId === item.id);
      if (found) return prev.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [
        ...prev,
        { itemId: item.id, name: item.name, price: item.price, qty: 1, category: item.category },
      ];
    });
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return setLines((prev) => prev.filter((l) => l.itemId !== id));
    setLines((prev) => prev.map((l) => (l.itemId === id ? { ...l, qty } : l)));
  };

  const handlePayPrint = async () => {
    if (!lines.length) return;
    const order: Order = {
      id: `o_${Date.now()}`,
      number: nextOrderNumber(),
      createdAt: new Date().toISOString(),
      lines,
      subtotal,
      tax,
      total,
      table: table.trim(),
      status: "pending",
    };
    addOrder(order);
    addOrderToSession(order);
    setLastOrder(order);
    setLines([]);
    setTable("");

    // Route print to kitchen/cafe printers
    const printPayload = {
      type: "kitchen" as const,
      orderNumber: order.number,
      tableLabel: order.table || "Takeaway",
      lines: lines.map((l) => ({
        qty: l.qty,
        name: l.name,
        price: l.price,
        category: l.category,
      })),
      subtotal,
      tax,
      total,
      timestamp: order.createdAt,
    };

    const result = await sendPrintJob(printPayload);
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warn) => toast.warning(warn, { duration: 6000 }));
    }
    if (result.fallback) {
      toast.error("کێشەیەک لە چاپکردندا هەیە. مەکینەی چاپکردنی کاتی بەکاردێت...");
      setTimeout(() => window.print(), 100);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "p",
      altKey: true,
      label: "پارەدان و چاپکردن",
      action: handlePayPrint,
      enabled: lines.length > 0,
    },
    {
      key: "h",
      altKey: true,
      label: "ڕاگرتنی داواکاری",
      action: () => {
        if (!lines.length) return;
        hold(lines);
        setLines([]);
      },
      enabled: lines.length > 0,
    },
    {
      key: "1",
      altKey: true,
      label: "پۆل: خواردنی خێرا",
      action: () => setActiveCat("خواردنی خێرا"),
    },
    {
      key: "2",
      altKey: true,
      label: "پۆل: خواردنەوەی گەرم",
      action: () => setActiveCat("خواردنەوەی گەرم"),
    },
    {
      key: "3",
      altKey: true,
      label: "پۆل: خواردنەوەی سارد",
      action: () => setActiveCat("خواردنەوەی سارد"),
    },
    {
      key: "4",
      altKey: true,
      label: "پۆل: نێرگەلە",
      action: () => setActiveCat("نێرگەلە"),
    },
    {
      key: "c",
      altKey: true,
      label: "چوون بۆ بەشی کاشێر",
      action: () => navigate({ to: "/cashier" }),
    },
    {
      key: "l",
      altKey: true,
      label: "چوون بۆ بەشی ژمێریاری",
      action: () => navigate({ to: "/ledger" }),
    },
    {
      key: "Escape",
      label: "داخستنی بەشی داواکارییە ڕاگیراوەکان",
      action: () => setShowHeld(false),
      enabled: showHeld,
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 print:hidden">
        {/* Menu panel */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map((c, idx) => (
              <button
                key={c}
                id={`cat-tab-${idx + 1}`}
                onClick={() => setActiveCat(c)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCat === c
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {c}
                <kbd className="ms-2 text-[9px] opacity-50 font-mono hidden sm:inline">
                  Alt+{idx + 1}
                </kbd>
              </button>
            ))}
            <div className="ms-auto flex items-center gap-2">
              <button
                id="held-orders-btn"
                onClick={() => setShowHeld(true)}
                className="relative px-3 py-2 rounded-lg bg-card hover:bg-accent text-sm font-medium flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                ڕاگیراوەکان
                {held.length > 0 && (
                  <span className="ms-1 px-1.5 py-0.5 rounded-full bg-neon text-neon-foreground text-[10px] font-bold">
                    {held.length}
                  </span>
                )}
              </button>
              <button
                id="go-cashier-btn"
                onClick={() => navigate({ to: "/cashier" })}
                className="relative px-3 py-2 rounded-lg bg-card hover:bg-accent text-sm font-medium flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">کاشێر</span>
                <kbd className="ms-1 text-[9px] opacity-50 font-mono hidden sm:inline">Alt+C</kbd>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="group relative bg-card hover:bg-accent border border-border rounded-xl p-4 text-start transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 active:scale-95"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3"
                  style={{ backgroundColor: item.color ?? "var(--color-accent)" }}
                >
                  {item.icon ?? "🍽️"}
                </div>
                <div className="font-semibold text-sm leading-tight">{item.name}</div>
                <div className="text-primary font-bold text-sm mt-1">{formatPrice(item.price)}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                هیچ بابەتێک لەم پۆلەدا نییە. دانەیەک زیاد بکە لە بەشی مەکینە/لیست.
              </div>
            )}
          </div>
        </section>

        {/* Order ticket */}
        <aside className="lg:w-[380px] bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-bold">داواکاری ئێستا</h2>
            <span className="text-xs text-muted-foreground">{lines.length} دانە</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[50vh] lg:max-h-none">
            {lines.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-12">
                کلیک لە بابەتەکان بکە بۆ زیادکردن
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.itemId} className="bg-background rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-[10px] text-muted-foreground">{l.category}</div>
                    </div>
                    <button
                      onClick={() => setQty(l.itemId, 0)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(l.itemId, l.qty - 1)}
                        className="w-7 h-7 rounded-md bg-accent hover:bg-muted flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold">{l.qty}</span>
                      <button
                        onClick={() => setQty(l.itemId, l.qty + 1)}
                        className="w-7 h-7 rounded-md bg-accent hover:bg-muted flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-end">
                      <div className="text-[10px] text-muted-foreground">{formatPrice(l.price)}</div>
                      <div className="font-bold text-primary">{formatPrice(l.price * l.qty)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-4 space-y-3 bg-card">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">کۆی گشتی</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <label className="text-muted-foreground flex items-center gap-2">
                باج
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 rounded bg-background border border-border text-center text-xs"
                />
                %
              </label>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-border">
              <span className="font-bold">کۆی کۆتایی</span>
              <span className="font-bold text-2xl text-neon">{formatPrice(total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  ژمارەی مێز / سەفەری
                </label>
                <input
                  id="table-input"
                  type="text"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="نموونە: ٥ یان سەفەری"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm font-medium"
                />
              </div>
              <button
                id="clear-order-btn"
                onClick={() => setLines([])}
                disabled={!lines.length}
                className="px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" /> سڕینەوە
              </button>
              <button
                id="hold-order-btn"
                onClick={() => {
                  if (!lines.length) return;
                  hold(lines);
                  setLines([]);
                }}
                disabled={!lines.length}
                className="px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <PauseCircle className="w-4 h-4" /> ڕاگرتن
                <kbd className="ms-1 text-[9px] opacity-50 font-mono hidden sm:inline">Alt+H</kbd>
              </button>
            </div>
            <button
              id="pay-print-btn"
              onClick={handlePayPrint}
              disabled={!lines.length}
              className="w-full px-4 py-3 rounded-lg bg-neon hover:brightness-110 text-neon-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-neon/20 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              <Printer className="w-5 h-5" /> پارەدان و چاپکردن
              <kbd className="ms-2 text-[10px] opacity-60 font-mono">Alt+P</kbd>
            </button>
          </div>
        </aside>
      </div>

      {lastOrder && <Receipt order={lastOrder} />}

      {showHeld && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-bold">داواکارییە ڕاگیراوەکان</h3>
              <button id="close-held-btn" onClick={() => setShowHeld(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {held.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  هیچ داواکارییەکی ڕاگیراو نییە
                </div>
              )}
              {held.map((h) => {
                const t = h.lines.reduce((s, l) => s + l.price * l.qty, 0);
                return (
                  <div key={h.id} className="bg-background rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(h.createdAt).toLocaleTimeString("ku-IQ")} • {h.lines.length} دانە •{" "}
                      {formatPrice(t)}
                    </div>
                    <div className="text-sm mb-3 line-clamp-2">
                      {h.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (lines.length && !confirm("داواکاریی ئێستا بگۆڕدرێت؟")) return;
                          const restored = resume(h.id);
                          setLines(restored);
                          setShowHeld(false);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        بەردەوامبوون
                      </button>
                      <button
                        onClick={() => remove(h.id)}
                        className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold"
                      >
                        سڕینەوە
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <KeyboardShortcutsHelp />
    </div>
  );
}
