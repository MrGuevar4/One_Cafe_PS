import { useEffect } from "react";

export interface ShortcutDef {
  key: string;        // e.g. "p", "h", "1"
  altKey?: boolean;   // require Alt
  ctrlKey?: boolean;  // require Ctrl
  label: string;      // human readable description
  action: () => void;
  enabled?: boolean;  // defaults to true
}

/**
 * Registers keyboard shortcuts globally.
 * Call this hook in any component. When the component unmounts, shortcuts are removed.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) return;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey || !shortcut.altKey;
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey || !shortcut.ctrlKey;

        // Only fire if the modifier requirements match exactly
        const altRequired = shortcut.altKey ?? false;
        const ctrlRequired = shortcut.ctrlKey ?? false;
        if (
          keyMatch &&
          e.altKey === altRequired &&
          e.ctrlKey === ctrlRequired
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

/** Global shortcuts that work across the entire app */
export const GLOBAL_SHORTCUTS_HELP: Array<{ key: string; description: string }> = [
  { key: "Alt+P",      description: "پارەدان و چاپکردنی داواکاری" },
  { key: "Alt+H",      description: "ڕاگرتنی داواکاری" },
  { key: "Alt+1 – 4", description: "گۆڕینی پۆلی بابەتەکان" },
  { key: "Alt+C",      description: "چوون بۆ بەشی کاشێر" },
  { key: "Alt+L",      description: "چوون بۆ بەشی ژمێریاری" },
  { key: "Alt+S",      description: "یەکلاکردنەوەی مێزی چالاک" },
  { key: "Escape",     description: "داخستنی پەنجەرەی کراوە" },
  { key: "?",          description: "پیشاندان/شاردنەوەی ئەم بەشە" },
];
