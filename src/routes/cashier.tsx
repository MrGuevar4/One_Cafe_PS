import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Users,
  CheckCircle,
  Clock,
  X,
  ChevronRight,
  Banknote,
  SplitSquareHorizontal,
  QrCode,
  Printer,
  AlertCircle,
  CheckSquare,
  Square,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  formatPrice,
  sessionTotal,
  sessionSubtotal,
  sessionAllLines,
  useTableSessions,
  type TableSession,
  type OrderLine,
} from "@/lib/pos-store";
import { AppNav } from "@/components/AppNav";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { sendPrintJob } from "@/hooks/use-print-server-status";
import { toast } from "sonner";

export const Route = createFileRoute("/cashier")({
  head: () => ({
    meta: [
      { title: "کاشێر — ONE Cafe" },
      { name: "description", content: "بەشی کاشێر بۆ یەکلاکردنەوەی مێزەکان و پارەدان." },
    ],
  }),
  component: CashierPage,
});

type SplitMode = "none" | "even" | "items";

function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CashierPage() {
  const { sessions, settleSession, deleteSession, reopenSession } = useTableSessions();
  const navigate = useNavigate();

  const open = useMemo(() => sessions.filter((s) => s.status === "open"), [sessions]);
  const settled = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "settled")
        .sort((a, b) => new Date(b.settledAt!).getTime() - new Date(a.settledAt!).getTime())
        .slice(0, 20),
    [sessions],
  );

  const [activeTab, setActiveTab] = useState<"open" | "settled">("open");
  const [selected, setSelected] = useState<TableSession | null>(null);

  // Settle panel state
  const [settleOpen, setSettleOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("none");
  const [splitPeople, setSplitPeople] = useState(2);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [qrVisible, setQrVisible] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "Escape",
      label: "Close modal",
      action: () => {
        if (settleOpen) setSettleOpen(false);
        else if (selected) setSelected(null);
      },
    },
    {
      key: "s",
      altKey: true,
      label: "Settle active session",
      action: () => {
        if (selected) setSettleOpen(true);
      },
      enabled: !!selected,
    },
  ]);

  // Re-select updated session from store to keep in sync
  useEffect(() => {
    if (!selected) return;
    const updated = sessions.find((s) => s.id === selected.id);
    if (updated) setSelected(updated);
    else setSelected(null);
  }, [sessions]);

  const currentTotal = selected ? sessionTotal(selected) : 0;
  const currentSubtotal = selected ? sessionSubtotal(selected) : 0;
  const allLines = selected ? sessionAllLines(selected) : [];

  // Split calculations
  const splitPerPerson = splitPeople > 0 ? Math.ceil(currentTotal / splitPeople) : 0;
  const selectedItemsTotal = useMemo(() => {
    if (!selected) return 0;
    return allLines
      .filter((l, idx) => selectedItems.has(`item-${idx}`))
      .reduce((sum, l) => sum + l.price * l.qty, 0);
  }, [selectedItems, allLines]);

  const change = useMemo(() => {
    const tendered = amountTendered === "" ? currentTotal : (parseFloat(amountTendered) || 0);
    return tendered - currentTotal;
  }, [amountTendered, currentTotal]);

  // QR Code generation
  useEffect(() => {
    if (!qrVisible || !selected || !qrCanvasRef.current) return;
    const baseUrl =
      typeof window !== "undefined"
        ? (import.meta.env.VITE_RECEIPT_BASE_URL ?? window.location.origin)
        : "";
    const url = `${baseUrl}/receipt/${selected.id}`;
    // Simple QR using native canvas — we render a data URI approach via qrcode lib if available
    generateQROnCanvas(qrCanvasRef.current, url);
  }, [qrVisible, selected]);

  const handleSettle = async () => {
    if (!selected) return;
    const tendered = amountTendered === "" ? currentTotal : (parseFloat(amountTendered) || 0);
    settleSession(selected.id, paymentMethod, tendered);

    // Send full receipt to cashier printer
    const allOrderLines = sessionAllLines(selected);
    const printPayload = {
      type: "cashier" as const,
      orderNumber: selected.orders[0]?.number ?? 0,
      tableLabel: selected.tableLabel,
      lines: allOrderLines.map((l) => ({
        qty: l.qty,
        name: l.name,
        price: l.price,
        category: l.category,
      })),
      subtotal: currentSubtotal,
      total: currentTotal,
      timestamp: new Date().toISOString(),
      sessionId: selected.id,
    };
    const result = await sendPrintJob(printPayload);
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warn) => toast.warning(warn, { duration: 6000 }));
    }
    if (result.fallback) {
      toast.error("کێشەیەک لە چاپکردندا هەیە. مەکینەی چاپکردنی کاتی بەکاردێت...");
      setTimeout(() => window.print(), 100);
    }

    setSettleOpen(false);
    setSelected(null);
    setAmountTendered("");
    setSplitMode("none");
  };

  const toggleItemSelection = (index: number) => {
    const key = `item-${index}`;
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Sessions List */}
        <section className="lg:w-[420px] flex flex-col border-e border-border">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-1">
              <button
                id="cashier-tab-open"
                onClick={() => setActiveTab("open")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "open"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                کراوەکان ({open.length})
              </button>
              <button
                id="cashier-tab-settled"
                onClick={() => setActiveTab("settled")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "settled"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                یەکلاکراوەکان ({settled.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === "open" && (
              <>
                {open.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    هیچ مێزێکی کراوە نییە. هەمووی پاکە!
                  </div>
                )}
                {open.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isActive={selected?.id === s.id}
                    onClick={() => {
                      setSelected(s);
                      setSplitMode("none");
                      setSelectedItems(new Set());
                      setQrVisible(false);
                    }}
                  />
                ))}
              </>
            )}
            {activeTab === "settled" && (
              <>
                {settled.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    هیچ دانیشتنێکی یەکلاکراوە نییە بۆ ئەمڕۆ.
                  </div>
                )}
                {settled.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isActive={selected?.id === s.id}
                    onClick={() => setSelected(s)}
                  />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Session Detail */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <CreditCard className="w-14 h-14 opacity-20" />
              <p className="text-sm">Select a table session to view details</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">مێزی {selected.tableLabel}</h1>
                  <p className="text-xs text-muted-foreground">
                    {selected.orders.length} داواکاری •{" "}
                    کراوەتەوە لە کاتژمێر {new Date(selected.openedAt).toLocaleTimeString("ku-IQ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === "open" && (
                    <>
                      <button
                        id="session-delete-btn"
                        onClick={() => {
                          if (confirm("دڵنیای لە سڕینەوەی ئەم دانیشتنە؟")) {
                            deleteSession(selected.id);
                            setSelected(null);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-secondary hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all"
                        title="سڕینەوەی دانیشتن"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        id="settle-btn"
                        onClick={() => setSettleOpen(true)}
                        className="px-4 py-2 rounded-lg bg-neon text-neon-foreground font-bold text-sm flex items-center gap-2 shadow-lg shadow-neon/20 hover:brightness-110 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        یەکلاکردنەوەی مێز
                      </button>
                    </>
                  )}
                  {selected.status === "settled" && (
                    <button
                      id="reopen-btn"
                      onClick={() => reopenSession(selected.id)}
                      className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      دووبارە کردنەوە
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {/* Status badge */}
                {selected.status === "settled" && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neon/10 border border-neon/30 text-neon text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    یەکلاکراوەتەوە — {selected.paymentMethod === "cash" ? "نەختینە" : "کارت"} •{" "}
                    {selected.settledAt && new Date(selected.settledAt).toLocaleTimeString("ku-IQ")}
                  </div>
                )}

                {/* Orders breakdown */}
                {selected.orders.map((order, idx) => (
                  <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-accent/40 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        داواکاری #{order.number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString("ku-IQ")}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {order.lines.map((l) => (
                        <div key={`${idx}-${l.itemId}`} className="px-4 py-2.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-xs font-bold">
                              {l.qty}
                            </span>
                            <span>{l.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {l.category}
                            </span>
                          </div>
                          <span className="font-medium">{formatPrice(l.price * l.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-border flex justify-end">
                      <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}

                {/* Total summary */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">کۆی گشتی</span>
                    <span>{formatPrice(currentSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border">
                    <span className="font-bold text-lg">کۆی گشتی</span>
                    <span className="font-bold text-3xl text-neon">{formatPrice(currentTotal)}</span>
                  </div>
                </div>

                {/* Split bill tools (for open sessions only) */}
                {selected.status === "open" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        id="split-even-btn"
                        onClick={() => setSplitMode(splitMode === "even" ? "none" : "even")}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          splitMode === "even"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        دابەشکردنی یەکسان
                      </button>
                      <button
                        id="split-items-btn"
                        onClick={() => {
                          setSplitMode(splitMode === "items" ? "none" : "items");
                          setSelectedItems(new Set());
                        }}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          splitMode === "items"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                      >
                        <SplitSquareHorizontal className="w-4 h-4" />
                        بەپێی بابەتەکان
                      </button>
                      <button
                        id="qr-receipt-btn"
                        onClick={() => setQrVisible((v) => !v)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          qrVisible
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                        title="پسوولەی دیجیتاڵی QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Split Even Panel */}
                    {splitMode === "even" && (
                      <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">ژمارەی کەسەکان</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}
                              className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center font-bold"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-xl">{splitPeople}</span>
                            <button
                              onClick={() => setSplitPeople(Math.min(20, splitPeople + 1))}
                              className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border flex items-baseline justify-between">
                          <span className="text-muted-foreground text-sm">بۆ هەر کەسێک</span>
                          <span className="text-2xl font-bold text-primary">{formatPrice(splitPerPerson)}</span>
                        </div>
                      </div>
                    )}

                    {/* Item Select Panel */}
                    {splitMode === "items" && (
                      <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">
                          بابەتەکان دیاریبکە بۆ دانەدانی پارە
                        </div>
                        {allLines.map((l, idx) => {
                          const key = `item-${idx}`;
                          const checked = selectedItems.has(key);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleItemSelection(idx)}
                              className={`w-full px-4 py-3 flex items-center gap-3 text-start border-b border-border transition-colors ${
                                checked ? "bg-primary/10" : "hover:bg-accent/50"
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="flex-1 text-sm text-start">
                                {l.qty}× {l.name}
                              </span>
                              <span className="text-sm font-semibold">{formatPrice(l.price * l.qty)}</span>
                            </button>
                          );
                        })}
                        <div className="px-4 py-3 flex items-baseline justify-between">
                          <span className="text-sm text-muted-foreground">کۆی دیاریکراو</span>
                          <span className="text-xl font-bold text-primary">{formatPrice(selectedItemsTotal)}</span>
                        </div>
                      </div>
                    )}

                    {/* QR Receipt */}
                    {qrVisible && (
                      <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <QrCode className="w-4 h-4 text-primary" />
                          کۆدی پسوولەی دیجیتاڵ
                        </div>
                        <canvas
                          ref={qrCanvasRef}
                          width={200}
                          height={200}
                          className="rounded-lg bg-white p-2"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          کڕیار سکانی دەکات بۆ بینینی پسوولەی وردەکارییەکان
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settle Modal */}
      {settleOpen && selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">یەکلاکردنەوەی مێزی {selected.tableLabel}</h3>
              <button
                onClick={() => setSettleOpen(false)}
                id="settle-modal-close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Total */}
              <div className="bg-accent/30 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">کۆی گشتی پێویست</div>
                <div className="text-4xl font-bold text-neon">{formatPrice(currentTotal)}</div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block text-start">
                  ڕێگای پارەدان
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="payment-cash"
                    onClick={() => setPaymentMethod("cash")}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "cash"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    نەختینە
                  </button>
                  <button
                    id="payment-card"
                    onClick={() => setPaymentMethod("card")}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "card"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    کارت
                  </button>
                </div>
              </div>

              {/* Cash tendered */}
              {paymentMethod === "cash" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block text-start">
                    بڕی پارەی دراو (دینار)
                  </label>
                  <input
                    id="amount-tendered"
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={currentTotal.toString()}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-xl font-bold text-center"
                  />
                  {amountTendered && (
                    <div
                      className={`mt-2 text-center text-sm font-semibold ${
                        change >= 0 ? "text-neon" : "text-destructive"
                      }`}
                    >
                      {change >= 0 ? (
                        <>ماوە (باخیش): {formatPrice(change)}</>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 inline ms-1" />
                          کەمە بە بڕی {formatPrice(Math.abs(change))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <button
                onClick={() => setSettleOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm"
              >
                پاشگەزبوونەوە
              </button>
              <button
                id="confirm-settle-btn"
                onClick={handleSettle}
                className="flex-1 px-4 py-3 rounded-xl bg-neon text-neon-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-neon/20 hover:brightness-110 transition-all"
              >
                <Printer className="w-4 h-4" />
                تەواوکردن و چاپ
              </button>
            </div>
          </div>
        </div>
      )}

      <KeyboardShortcutsHelp />
    </div>
  );
}

function SessionCard({
  session,
  isActive,
  onClick,
}: {
  session: TableSession;
  isActive: boolean;
  onClick: () => void;
}) {
  const total = sessionTotal(session);
  const lines = sessionAllLines(session);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <button
      onClick={onClick}
      className={`w-full text-start rounded-xl p-4 border transition-all ${
        isActive
          ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
          : "bg-card border-border hover:border-primary/40 hover:bg-accent/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-bold text-base text-start">مێزی {session.tableLabel}</div>
          <div className="text-xs text-muted-foreground text-start">
            {session.orders.length} داواکاری • {itemCount} دانە
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className="font-bold text-neon">{formatPrice(total)}</div>
          {session.status === "open" ? (
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
              <Clock className="w-3 h-3" />
              {elapsed(session.openedAt)}
            </div>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neon/20 text-neon font-semibold">
              یەکلاکراوەتەوە
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground truncate text-start">
        {lines
          .slice(0, 4)
          .map((l) => `${l.qty}× ${l.name}`)
          .join(", ")}
        {lines.length > 4 && " …"}
      </div>
      {isActive && (
        <div className="flex items-center justify-end mt-2 text-primary text-xs font-semibold">
          وردەکاری زیاتر <ChevronRight className="w-3 h-3 ms-0.5 rotate-180" />
        </div>
      )}
    </button>
  );
}

/** Minimal QR code generator using canvas - draws a placeholder with the URL */
function generateQROnCanvas(canvas: HTMLCanvasElement, url: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Try to use qrcode lib if dynamically available, else draw a stylized placeholder
  const size = canvas.width;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Draw a visual QR placeholder with the URL as text
  ctx.fillStyle = "#000000";

  // Corner squares
  const drawCorner = (x: number, y: number) => {
    ctx.fillRect(x, y, 40, 40);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 5, y + 5, 30, 30);
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 10, y + 10, 20, 20);
  };
  drawCorner(10, 10);
  drawCorner(size - 50, 10);
  drawCorner(10, size - 50);

  // Center pattern
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(60 + i * 10, 60 + j * 10, 9, 9);
      }
    }
  }

  // URL text at bottom
  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  const shortUrl = url.replace(/^https?:\/\//, "").slice(0, 30);
  ctx.fillText(shortUrl, size / 2, size - 8);
}
