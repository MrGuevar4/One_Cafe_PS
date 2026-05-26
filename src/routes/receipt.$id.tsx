import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, Clock } from "lucide-react";
import { getSessionByIdServer, sessionTotal, sessionSubtotal, formatPrice, TableSession } from "@/lib/pos-store";

export const Route = createFileRoute("/receipt/$id")({
  head: () => ({
    meta: [
      { title: "پسوولە — ONE Cafe" },
      { name: "description", content: "پسوولەی دیجیتاڵی ONE Cafe & Restaurant." },
    ],
  }),
  component: ReceiptPage,
  loader: async ({ params }) => {
    const res = await getSessionByIdServer({ data: params.id });
    if (res && typeof res === "object" && "success" in res && res.success === false) {
      return { session: null };
    }
    return { session: res as TableSession | undefined };
  },
});

function ReceiptPage() {
  const { session } = Route.useLoaderData();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🧾</div>
          <h1 className="text-2xl font-bold mb-2">پسوولەکە نەدۆزرایەوە</h1>
          <p className="text-muted-foreground text-sm mb-6">
            ڕەنگە ئەم پسوولەیە سڕابێتەوە یان بەستەرەکە نادروست بێت.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            بچۆ بۆ لاپەڕەی فرۆشتن (POS)
          </Link>
        </div>
      </div>
    );
  }

  const total = sessionTotal(session);
  const subtotal = sessionSubtotal(session);
  const tax = total - subtotal;
  const dashed = "─".repeat(32);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Screen view — styled receipt */}
      <div className="flex-1 flex items-start justify-center p-4 print:hidden">
        <div className="w-full max-w-sm">
          {/* Header actions */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              گەڕانەوە
            </Link>
            <button
              id="print-receipt-btn"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              چاپکردن
            </button>
          </div>

          {/* Receipt card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-primary p-6 text-center text-primary-foreground">
              <div className="text-2xl font-bold">ONE Cafe &amp; Restaurant</div>
              <div className="text-sm opacity-80 mt-1">📍 ڕانیە - ناو ڕانیە مۆڵ</div>
            </div>

            {/* Session info */}
            <div className="p-5 border-b border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">مێز</span>
                <span className="font-bold text-lg">{session.tableLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">کراوەتەوە لە</span>
                <span>{new Date(session.openedAt).toLocaleString("ku-IQ")}</span>
              </div>
              {session.settledAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">یەکلاکراوەتەوە لە</span>
                  <span>{new Date(session.settledAt).toLocaleString("ku-IQ")}</span>
                </div>
              )}
              {session.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ڕێگای پارەدان</span>
                  <span className="font-semibold uppercase">{session.paymentMethod === "cash" ? "نەختینە" : "کارت"}</span>
                </div>
              )}
            </div>

            {/* Order lines */}
            <div className="p-5 space-y-4">
              {session.orders.map((order: any, idx: number) => (
                <div key={order.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      داواکاری #{order.number} — {new Date(order.createdAt).toLocaleTimeString("ku-IQ")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {order.lines.map((l: any) => (
                      <div
                        key={`${idx}-${l.itemId}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-accent text-xs font-bold flex items-center justify-center">
                            {l.qty}
                          </span>
                          <span>{l.name}</span>
                        </div>
                        <span className="font-medium">{formatPrice(l.price * l.qty)}</span>
                      </div>
                    ))}
                  </div>
                  {idx < session.orders.length - 1 && (
                    <div className="mt-3 border-t border-dashed border-border" />
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">کۆی گشتی</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">باج</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-border">
                <span className="font-bold text-lg">کۆی گشتی</span>
                <span className="font-bold text-3xl text-neon">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-accent/30 px-5 py-4 text-center">
              <p className="text-sm font-semibold">سوپاس بۆ سەردانەکەتان!</p>
              <p className="text-xs text-muted-foreground mt-1">بەهیوای دووبارە بینینەوەتان 🙏</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print view — thermal receipt format */}
      <div id="printable-receipt" className="printable-receipt">
        <div className="r-header">ONE Cafe &amp; Restaurant</div>
        <div className="r-sub">📍 ڕانیە - ناو ڕانیە مۆڵ</div>
        <div className="r-divider">{dashed}</div>
        <div className="r-row">
          <span>مێز</span>
          <span>{session.tableLabel}</span>
        </div>
        <div className="r-row">
          <span>ڕێکەوت</span>
          <span>{new Date(session.openedAt).toLocaleDateString("ku-IQ")}</span>
        </div>
        <div className="r-divider">{dashed}</div>
        {session.orders.flatMap((order: any) =>
          order.lines.map((l: any) => (
            <div key={`${order.id}-${l.itemId}`} className="r-item">
              <div className="r-row">
                <span className="r-item-name">
                  {l.qty} x {l.name}
                </span>
                <span className="r-item-price">{(l.price * l.qty).toLocaleString()}</span>
              </div>
            </div>
          )),
        )}
        <div className="r-divider">{dashed}</div>
        <div className="r-row">
          <span>کۆی گشتی</span>
          <span>{subtotal.toLocaleString()}</span>
        </div>
        {tax > 0 && (
          <div className="r-row">
            <span>باج</span>
            <span>{tax.toLocaleString()}</span>
          </div>
        )}
        <div className="r-total">کۆی کۆتایی: {total.toLocaleString()} دینار</div>
        <div className="r-divider">{dashed}</div>
        <div className="r-footer">سوپاس بۆ سەردانەکەتان!</div>
      </div>
    </div>
  );
}
