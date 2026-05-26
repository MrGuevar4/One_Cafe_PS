import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  TrendingDown,
  TrendingUp,
  Wallet,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  formatPrice,
  useExpenses,
  useTableSessions,
  isToday,
  sessionTotal,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type Expense,
} from "@/lib/pos-store";
import { AppNav } from "@/components/AppNav";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "دەفتەری دارایی — ONE Cafe" },
      { name: "description", content: "بەڕێوەبردنی خەرجییە بچووکەکان و داهاتی ڕۆژانە." },
    ],
  }),
  component: LedgerPage,
});

const CHART_COLORS = ["#f97316", "#0ea5e9", "#22c55e", "#a855f7"];

function LedgerPage() {
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const { sessions } = useTableSessions();

  const [addOpen, setAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "history">("overview");

  // Today's settled sessions only
  const todaySettled = useMemo(
    () => sessions.filter((s) => s.status === "settled" && isToday(s.settledAt ?? "")),
    [sessions],
  );

  const todayRevenue = useMemo(
    () => todaySettled.reduce((sum, s) => sum + sessionTotal(s), 0),
    [todaySettled],
  );

  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isToday(e.timestamp))
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const netCash = todayRevenue - todayExpenses;

  // Revenue by category breakdown
  const revenueByCategory = useMemo(() => {
    const map: Record<string, number> = {
      "خواردنی خێرا": 0,
      "خواردنەوەی گەرم": 0,
      "خواردنەوەی سارد": 0,
      "نێرگەلە": 0,
    };
    for (const session of todaySettled) {
      for (const order of session.orders) {
        for (const line of order.lines) {
          map[line.category] = (map[line.category] ?? 0) + line.price * line.qty;
        }
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [todaySettled]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses.filter((e) => isToday(e.timestamp))) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const todayExpensesList = useMemo(
    () =>
      expenses
        .filter((e) => isToday(e.timestamp))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [expenses],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">دەفتەری دارایی</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("ku-IQ", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            id="add-expense-btn"
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard
            label="داهاتی ئەمڕۆ"
            value={formatPrice(todayRevenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            accent="neon"
            sub={`${todaySettled.length} مێزی یەکلاکراوە`}
          />
          <KpiCard
            label="خەرجییە بچووکەکان"
            value={formatPrice(todayExpenses)}
            icon={<TrendingDown className="w-5 h-5" />}
            accent="destructive"
            sub={`${todayExpensesList.length} خەرجی`}
          />
          <KpiCard
            label="داهاتی سافی"
            value={formatPrice(netCash)}
            icon={<Wallet className="w-5 h-5" />}
            accent={netCash >= 0 ? "primary" : "destructive"}
            sub="داهات − خەرجی"
            highlight
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button
            id="ledger-tab-overview"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            گشتی
          </button>
          <button
            id="ledger-tab-expenses"
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "expenses"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            خەرجییەکان
          </button>
          <button
            id="ledger-tab-history"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            مێژوو
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue by Category */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                داهات بەپێی پۆلەکان
              </h2>
              {revenueByCategory.every((d) => d.value === 0) ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  هیچ داتایەکی داهات نییە بۆ ئەمڕۆ
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByCategory}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatPrice(v), "داهات"]}
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {revenueByCategory.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Expense Breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-destructive" />
                خەرجی بەپێی پۆلەکان
              </h2>
              {expensesByCategory.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  هیچ خەرجییەک تۆمار نەکراوە بۆ ئەمڕۆ
                </div>
              ) : (
                <div className="space-y-2">
                  {expensesByCategory.map(({ name, value }) => {
                    const pct = todayExpenses > 0 ? (value / todayExpenses) * 100 : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-semibold">{formatPrice(value)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Net Cash waterfall */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
              <h2 className="font-bold mb-4">کورتی سندوقی پارە</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="flex-1 rounded-xl bg-neon/10 border border-neon/30 p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    داهات
                  </div>
                  <div className="text-2xl font-bold text-neon">{formatPrice(todayRevenue)}</div>
                </div>
                <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  −
                </div>
                <div className="flex-1 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    خەرجییەکان
                  </div>
                  <div className="text-2xl font-bold text-destructive">
                    {formatPrice(todayExpenses)}
                  </div>
                </div>
                <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  =
                </div>
                <div
                  className={`flex-1 rounded-xl p-4 text-center border ${
                    netCash >= 0
                      ? "bg-primary/10 border-primary/30"
                      : "bg-destructive/10 border-destructive/30"
                  }`}
                >
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    کۆی داهات (سافی)
                  </div>
                  <div
                    className={`text-2xl font-bold ${netCash >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {formatPrice(netCash)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">خەرجییەکانی ئەمڕۆ</h2>
              <span className="text-xs text-muted-foreground">
                کۆی گشتی: {formatPrice(todayExpenses)}
              </span>
            </div>
            {todayExpensesList.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                هیچ خەرجییەک تۆمار نەکراوە بۆ ئەمڕۆ. دوگمەی “زیادکردنی خەرجی” بەکاربهێنە بۆ تۆمارکردنی خەرجییە بچووکەکان.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {todayExpensesList.map((e) => (
                  <ExpenseRow key={e.id} expense={e} onDelete={() => deleteExpense(e.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">مێزە یەکلاکراوەکانی ئەمڕۆ</h2>
              <span className="text-xs text-muted-foreground">
                {todaySettled.length} دانیشتن
              </span>
            </div>
            {todaySettled.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                هیچ مێزێک یەکلا نەکراوەتەوە ئەمڕۆ.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {todaySettled.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] text-muted-foreground">مێز</span>
                      <span className="text-sm font-bold leading-none">{s.tableLabel}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        {s.orders.length} داواکاری •{" "}
                        {s.paymentMethod === "cash" ? "نەختینە" : "کارت"}
                      </div>
                      <div className="text-xs text-muted-foreground text-start">
                        یەکلاکراوەتەوە: {s.settledAt && new Date(s.settledAt).toLocaleTimeString("ku-IQ")}
                      </div>
                    </div>
                    <div className="font-bold text-neon shrink-0">{formatPrice(sessionTotal(s))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {addOpen && (
        <AddExpenseModal
          onClose={() => setAddOpen(false)}
          onSave={(data) => {
            addExpense(data);
            setAddOpen(false);
          }}
        />
      )}

      <KeyboardShortcutsHelp />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "neon" | "primary" | "destructive";
  sub?: string;
  highlight?: boolean;
}) {
  const accentClass = {
    neon: "bg-neon text-neon-foreground",
    primary: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  }[accent];

  return (
    <div
      className={`bg-card border rounded-xl p-5 ${
        highlight ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
        <TrendingDown className="w-4 h-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-start">{expense.description}</div>
        <div className="text-xs text-muted-foreground text-start">
          {expense.category} • {new Date(expense.timestamp).toLocaleTimeString("ku-IQ")}
        </div>
      </div>
      <div className="font-bold text-destructive shrink-0">{formatPrice(expense.amount)}</div>
      <button
        onClick={onDelete}
        className="w-8 h-8 rounded-lg bg-secondary hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all"
        title="سڕینەوەی خەرجی"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddExpenseModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { category: ExpenseCategory; description: string; amount: number }) => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("پێداویستییەکان");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  const handleSave = () => {
    if (!description.trim() || amount === "" || amount < 0) return;
    onSave({ category, description: description.trim(), amount: Number(amount) });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">زیادکردنی خەرجی</h3>
          <button onClick={onClose} id="expense-modal-close">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5 text-start">
              پۆل
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5 text-start">
              ڕوونکردنەوە
            </label>
            <input
              id="expense-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نموونە: خاوێنکەرەوە، غاز..."
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5 text-start">
              بڕی پارە (دینار)
            </label>
            <input
              id="expense-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              min={0}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-xl font-bold text-center"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm"
          >
            پاشگەزبوونەوە
          </button>
          <button
            id="expense-save-btn"
            onClick={handleSave}
            disabled={!description.trim() || amount === "" || amount < 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-40"
          >
            تۆمارکردنی خەرجی
          </button>
        </div>
      </div>
    </div>
  );
}
