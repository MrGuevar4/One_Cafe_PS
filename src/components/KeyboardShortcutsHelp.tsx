import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { GLOBAL_SHORTCUTS_HELP } from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 end-4 z-50 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all print:hidden"
        title="کورتکراوەکانی تەختەکلیل (?)"
        id="shortcuts-help-btn"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4 print:hidden">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">کورتکراوەکانی تەختەکلیل</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                id="shortcuts-help-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {GLOBAL_SHORTCUTS_HELP.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <kbd className="px-2 py-1 rounded-md bg-background border border-border text-xs font-mono text-primary whitespace-nowrap">
                    {s.key}
                  </kbd>
                  <span className="text-sm text-muted-foreground text-end">{s.description}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">Press <kbd className="px-1 py-0.5 rounded bg-background border border-border text-xs font-mono">?</kbd> or <kbd className="px-1 py-0.5 rounded bg-background border border-border text-xs font-mono">Esc</kbd> to close</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
