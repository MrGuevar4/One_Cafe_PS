import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { formatPrice, useOrders } from "@/lib/pos-store";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "داشبۆردی فرۆشتن — ONE Cafe" },
      { name: "description", content: "پوختەی داهات و داواکارییەکانی ئەمڕۆ." },
    ],
  }),
  component: DashboardPage,
});

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function DashboardPage() {
  const { orders } = useOrders();
  const today = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const itemsSold = today.reduce(
    (s, o) => s + o.lines.reduce((ss, l) => ss + l.qty, 0),
    0,
  );
  const avg = today.length ? Math.round(revenue / today.length) : 0;

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">داشبۆردی فرۆشتن</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {new Date().toLocaleDateString("ku-IQ", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="داهاتی ئەمڕۆ"
            value={formatPrice(revenue)}
            icon={<DollarSign className="w-5 h-5" />}
            accent="neon"
          />
          <StatCard
            label="داواکارییەکانی ئەمڕۆ"
            value={today.length.toString()}
            icon={<ShoppingBag className="w-5 h-5" />}
            accent="primary"
          />
          <StatCard
            label="تێکڕای پسوولە"
            value={formatPrice(avg)}
            icon={<TrendingUp className="w-5 h-5" />}
            accent="primary"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-bold">داواکارییەکانی ئەمڕۆ</h2>
            <span className="text-xs text-muted-foreground">
              {itemsSold} دانە فرۆشراون
            </span>
          </div>
          <div className="divide-y divide-border">
            {today.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                هیچ داواکارییەک نییە بۆ ئەمڕۆ. بچۆ هەندێک تۆمار بکە!
              </div>
            )}
            {today.map((o) => (
              <div key={o.id} className="px-4 py-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] text-muted-foreground">#</span>
                  <span className="text-sm font-bold leading-none">{o.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleTimeString("ku-IQ")}
                  </div>
                </div>
                <div className="font-bold text-neon shrink-0">{formatPrice(o.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "primary" | "neon";
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            accent === "neon"
              ? "bg-neon text-neon-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
