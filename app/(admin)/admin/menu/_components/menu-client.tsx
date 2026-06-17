"use client";

import { useState, useActionState, useTransition } from "react";
import {
  createCategory,
  createMenuItem,
  toggleCategoryStatus,
  toggleItemAvailability,
  deleteMenuItem,
  deleteCategory,
} from "@/app/actions/menu";
import type { ActionResult, CategoryRow, MenuItemRow } from "@/app/actions/menu";
import type { WorkstationRow } from "@/app/actions/workstations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, Trash2, Eye, EyeOff } from "lucide-react";

// ─── Add Category Form ────────────────────────────────────────────────────────

function AddCategoryForm({
  restaurantId,
  workstations,
  onClose,
}: {
  restaurantId: string;
  workstations: WorkstationRow[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createCategory,
    null
  );

  return (
    <form
      action={async (fd) => {
        await action(fd);
        onClose();
      }}
      className="rounded-xl border px-5 py-5 flex flex-col gap-4"
      style={{ background: "var(--color-canvas)", borderColor: "var(--color-primary)", borderWidth: 1.5 }}
    >
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
        New category
      </p>
      <Input name="name" placeholder="e.g. Starters, Main Course, Beverages…" required />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}>
          Workstation
        </label>
        <select
          name="workstation_id"
          required
          className="h-9 rounded-sm border px-3 text-sm"
          style={{ borderColor: "var(--color-hairline-input)", color: "var(--color-ink)", background: "var(--color-canvas)" }}
        >
          <option value="">Select workstation…</option>
          {workstations.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p className="text-sm" style={{ color: "var(--color-ruby)" }}>{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Add Item Form ────────────────────────────────────────────────────────────

function AddItemForm({
  restaurantId,
  categoryId,
  onClose,
}: {
  restaurantId: string;
  categoryId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createMenuItem,
    null
  );

  return (
    <form
      action={async (fd) => {
        await action(fd);
        onClose();
      }}
      className="mt-2 rounded-lg border px-4 py-4 flex flex-col gap-3"
      style={{ background: "var(--color-canvas-soft)", borderColor: "var(--color-hairline)" }}
    >
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <div className="flex gap-2">
        <Input name="name" placeholder="Item name" required className="flex-1" />
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--color-ink-mute)" }}
          >
            ₹
          </span>
          <Input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            required
            className="pl-7 w-28"
          />
        </div>
      </div>
      <Input name="description" placeholder="Description (optional)" />
      {state?.error && (
        <p className="text-xs" style={{ color: "var(--color-ruby)" }}>{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending} className="text-xs py-1.5 px-3 h-7">
          {pending ? "Adding…" : "Add item"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="text-xs py-1.5 px-3 h-7">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: MenuItemRow }) {
  const [, startToggle] = useTransition();
  const [, startDelete] = useTransition();

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ opacity: item.is_available ? 1 : 0.5 }}
    >
      <p className="flex-1 text-sm" style={{ color: "var(--color-ink)" }}>
        {item.name}
        {item.has_variants && (
          <span className="ml-1.5 text-xs" style={{ color: "var(--color-ink-mute)" }}>
            (variants)
          </span>
        )}
      </p>
      <p className="text-sm tabular" style={{ color: "var(--color-ink-mute)" }}>
        ₹{Number(item.price).toFixed(0)}
      </p>
      <button
        type="button"
        title={item.is_available ? "Mark unavailable" : "Mark available"}
        onClick={() => startToggle(async () => { await toggleItemAvailability(item.id, !item.is_available); })}
        style={{ color: "var(--color-ink-mute)" }}
      >
        {item.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        type="button"
        title="Delete item"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() => startDelete(async () => {
          if (confirm(`Delete "${item.name}"?`)) {
            const r = await deleteMenuItem(item.id);
            if (r?.error) alert(r.error);
          }
        })}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Category Accordion ───────────────────────────────────────────────────────

function CategoryAccordion({
  category,
  items,
  restaurantId,
  allItems,
}: {
  category: CategoryRow;
  items: MenuItemRow[];
  restaurantId: string;
  allItems: MenuItemRow[];
}) {
  const [open, setOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [, startToggle] = useTransition();
  const [, startDelete] = useTransition();

  const catItems = items.filter((i) => i.category_id === category.id);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {open ? <ChevronDown size={15} style={{ color: "var(--color-ink-mute)" }} /> : <ChevronRight size={15} style={{ color: "var(--color-ink-mute)" }} />}
          <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
            {category.name}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--color-ink-mute)" }}>
            {catItems.length} items · {category.workstation_name ?? "—"}
          </span>
        </button>

        {/* Toggle active */}
        <button
          type="button"
          className="text-xs px-2 py-0.5 rounded-md border"
          style={{
            color: category.is_active ? "#1a7a4a" : "var(--color-ink-mute)",
            borderColor: category.is_active ? "#1a7a4a44" : "var(--color-hairline)",
            background: category.is_active ? "#f0fdf4" : "transparent",
          }}
          onClick={() => startToggle(async () => { await toggleCategoryStatus(category.id, !category.is_active); })}
        >
          {category.is_active ? "Active" : "Hidden"}
        </button>

        {/* Add item */}
        <button
          type="button"
          title="Add item"
          onClick={() => { setOpen(true); setAddingItem(true); }}
          style={{ color: "var(--color-ink-mute)" }}
        >
          <Plus size={15} />
        </button>

        {/* Delete category */}
        <button
          type="button"
          title="Delete category"
          style={{ color: "var(--color-ink-mute)" }}
          onClick={() => startDelete(async () => {
            if (confirm(`Delete category "${category.name}" and all its items?`)) {
              const r = await deleteCategory(category.id);
              if (r?.error) alert(r.error);
            }
          })}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div
          className="px-4 pb-3 border-t"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          {catItems.length === 0 && !addingItem && (
            <p className="text-xs py-2" style={{ color: "var(--color-ink-mute)" }}>
              No items yet.{" "}
              <button type="button" className="underline" onClick={() => setAddingItem(true)} style={{ color: "var(--color-primary)" }}>
                Add one
              </button>
            </p>
          )}
          {catItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
          {addingItem && (
            <AddItemForm
              restaurantId={restaurantId}
              categoryId={category.id}
              onClose={() => setAddingItem(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export function MenuClient({
  categories,
  items,
  workstations,
  restaurantId,
}: {
  categories: CategoryRow[];
  items: MenuItemRow[];
  workstations: WorkstationRow[];
  restaurantId: string;
}) {
  const [addingCategory, setAddingCategory] = useState(false);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
          {categories.length} categories · {items.length} items
        </p>
        {!addingCategory && (
          <Button variant="primary" onClick={() => setAddingCategory(true)}>
            <Plus size={14} className="mr-1.5" />
            New category
          </Button>
        )}
      </div>

      {addingCategory && (
        <AddCategoryForm
          restaurantId={restaurantId}
          workstations={workstations}
          onClose={() => setAddingCategory(false)}
        />
      )}

      {categories.length === 0 && !addingCategory ? (
        <div
          className="rounded-xl border px-8 py-12 text-center"
          style={{ borderStyle: "dashed", borderColor: "var(--color-hairline)", background: "var(--color-canvas)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            No categories yet. Create a workstation first, then add categories.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryAccordion
              key={c.id}
              category={c}
              items={items}
              restaurantId={restaurantId}
              allItems={items}
            />
          ))}
        </div>
      )}
    </div>
  );
}
