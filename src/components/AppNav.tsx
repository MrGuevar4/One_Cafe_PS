import { Link } from "@tanstack/react-router";
import { Coffee, LayoutGrid, Settings, BarChart3, CreditCard, BookOpen, Zap, Moon } from "lucide-react";
import { useTheme } from "@/lib/pos-store";
import { usePrintServerStatus } from "@/hooks/use-print-server-status";

export function AppNav() {
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = usePrintServerStatus();

  const linkClass =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";
  const activeClass = "!bg-primary !text-primary-foreground";

  return (
    <header className="border-b border-border bg-card/40 backdrop-blur-sm sticky top-0 z-40 print:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Coffee className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold leading-tight">ONE Cafe</div>
            <div className="text-[10px] text-muted-foreground leading-tight">&amp; Restaurant</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link to="/" className={linkClass} activeProps={{ className: activeClass }} activeOptions={{ exact: true }}>
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">فرۆشتن</span>
          </Link>
          <Link to="/cashier" className={linkClass} activeProps={{ className: activeClass }}>
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">کاشێر</span>
          </Link>
          <Link to="/menu" className={linkClass} activeProps={{ className: activeClass }}>
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">مەکینە/بابەتەکان</span>
          </Link>
          <Link to="/ledger" className={linkClass} activeProps={{ className: activeClass }}>
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">ژمێریاری</span>
          </Link>
          <Link to="/dashboard" className={linkClass} activeProps={{ className: activeClass }}>
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">داشبۆرد</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Print server status indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-xs font-medium"
            title={isOnline ? "سێرڤەری چاپکەر چالاکە" : "سێرڤەری چاپکەر ناچالاکە (چاپی وێبگەڕ بەکاردێت)"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-red-400"
              }`}
            />
            <span className="text-muted-foreground hidden md:inline">
              {isOnline ? "چاپکەر" : "ناچالاک"}
            </span>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-all"
            title={theme === "cyberpunk" ? "گۆڕین بۆ مۆدی تاریک" : "گۆڕین بۆ مۆدی سایبەرپانک"}
            id="theme-toggle-btn"
          >
            {theme === "cyberpunk" ? (
              <Moon className="w-4 h-4 text-primary" />
            ) : (
              <Zap className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
