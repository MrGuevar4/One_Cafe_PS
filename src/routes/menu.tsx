import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  CATEGORIES,
  formatPrice,
  useMenu,
  type Category,
  type MenuItem,
} from "@/lib/pos-store";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Management — ONE Cafe" },
      { name: "description", content: "Create, edit, and remove menu items." },
    ],
  }),
  component: MenuPage,
});

const ICON_OPTIONS = ["🍔", "🍟", "🍕", "🌯", "🥪", "🍗", "☕", "🍵", "🍫", "🥤", "🍋", "🍹", "🍰", "🧁", "💨"];
const COLOR_OPTIONS = ["#f97316", "#ef4444", "#facc15", "#22c55e", "#10b981", "#0ea5e9", "#7c3aed", "#ec4899", "#78350f"];

function MenuPage() {
  const { menu, addItem, updateItem, deleteItem } = useMenu();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage all items shown on the POS screen
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>

        {CATEGORIES.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          return (
            <section key={cat} className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {cat} <span className="text-foreground">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: m.color ?? "var(--color-accent)" }}
                    >
                      {m.icon ?? "🍽️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-primary text-sm font-bold">{formatPrice(m.price)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(m)}
                        className="w-8 h-8 rounded-md bg-accent hover:bg-muted flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${m.name}"?`)) deleteItem(m.id);
                        }}
                        className="w-8 h-8 rounded-md bg-accent hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="col-span-full text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">
                    No items in {cat}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {(editing || creating) && (
        <ItemModal
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(data) => {
            if (editing) updateItem(editing.id, data);
            else addItem(data);
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (v: Omit<MenuItem, "id">) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<Category>(item?.category ?? "Fast Food");
  const [price, setPrice] = useState<number>(item?.price ?? 0);
  const [icon, setIcon] = useState(item?.icon ?? "🍽️");
  const [color, setColor] = useState(item?.color ?? COLOR_OPTIONS[0]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">{item ? "Edit Item" : "New Item"}</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
              placeholder="e.g. Cheeseburger"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Price (IQD)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Icon</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-md text-lg flex items-center justify-center ${
                    icon === i ? "bg-primary" : "bg-background hover:bg-accent"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Color</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-md border-2 ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim() || price <= 0) return;
              onSave({ name: name.trim(), category, price, icon, color });
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
