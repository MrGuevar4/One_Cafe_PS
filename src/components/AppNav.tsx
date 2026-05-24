import { Link } from "@tanstack/react-router";
import { Coffee, LayoutGrid, Settings, BarChart3 } from "lucide-react";

export function AppNav() {
  const linkClass =
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";
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
            <div className="text-[10px] text-muted-foreground leading-tight">
              &amp; Restaurant
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={linkClass} activeProps={{ className: activeClass }} activeOptions={{ exact: true }}>
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">POS</span>
          </Link>
          <Link to="/menu" className={linkClass} activeProps={{ className: activeClass }}>
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </Link>
          <Link to="/dashboard" className={linkClass} activeProps={{ className: activeClass }}>
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
