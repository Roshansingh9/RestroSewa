"use client";

import { useState, useTransition } from "react";
import type { CategoryRow, MenuItemRow } from "@/app/actions/menu";
import { sendNotification } from "@/app/actions/customer";
import { Bell, UtensilsCrossed } from "lucide-react";

function NotifyBar({
  restaurantId,
  tableId,
}: {
  restaurantId: string;
  tableId: string | null;
}) {
  const [sent, setSent] = useState<string | null>(null);
  const [, start] = useTransition();

  function notify(type: "call_waiter" | "request_bill") {
    start(async () => {
      await sendNotification(restaurantId, tableId, type);
      setSent(type === "call_waiter" ? "Waiter called!" : "Bill requested!");
      setTimeout(() => setSent(null), 4000);
    });
  }

  if (!tableId) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-3 border-t"
      style={{
        background: "var(--color-canvas)",
        borderColor: "var(--color-hairline)",
        boxShadow: "0 -4px 16px rgba(13,37,61,0.06)",
      }}
    >
      {sent ? (
        <div
          className="flex-1 text-center text-sm py-2 rounded-lg"
          style={{ background: "#f0fdf4", color: "#1a7a4a" }}
        >
          {sent}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => notify("call_waiter")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink)" }}
          >
            <Bell size={14} />
            Call waiter
          </button>
          <button
            type="button"
            onClick={() => notify("request_bill")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            <UtensilsCrossed size={14} />
            Request bill
          </button>
        </>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: MenuItemRow }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
      style={{ borderColor: "var(--color-hairline)", opacity: item.is_available ? 1 : 0.4 }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-ink)" }}>
          {item.name}
        </p>
        {item.description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-ink-mute)" }}>
            {item.description}
          </p>
        )}
        {!item.is_available && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ruby)" }}>
            Currently unavailable
          </p>
        )}
      </div>
      <p
        className="text-sm tabular shrink-0 pt-0.5"
        style={{ color: "var(--color-ink)", fontWeight: 400 }}
      >
        ₹{Number(item.price).toFixed(0)}
      </p>
    </div>
  );
}

export function CustomerMenu({
  restaurantId,
  restaurantName,
  tableId,
  categories,
  items,
}: {
  restaurantId: string;
  restaurantName: string;
  tableId: string | null;
  categories: CategoryRow[];
  items: MenuItemRow[];
}) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );

  const activeCategories = categories.filter((c) => c.is_active);
  const visibleItems = items.filter((i) => i.category_id === activeCategoryId);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-canvas)" }}>
      {/* Header */}
      <div
        className="px-4 py-5 text-center border-b"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <h1
          className="text-xl"
          style={{
            color: "var(--color-ink)",
            fontWeight: 300,
            letterSpacing: "-0.4px",
          }}
        >
          {restaurantName}
        </h1>
        {tableId && (
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-mute)" }}>
            Browse our menu · Use the buttons below to call staff
          </p>
        )}
      </div>

      {/* Category tabs */}
      <div
        className="flex gap-1 overflow-x-auto px-4 py-2.5 border-b sticky top-0"
        style={{
          background: "var(--color-canvas)",
          borderColor: "var(--color-hairline)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategoryId(c.id)}
            className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors"
            style={{
              background:
                activeCategoryId === c.id
                  ? "var(--color-ink)"
                  : "var(--color-canvas-soft)",
              color:
                activeCategoryId === c.id ? "#fff" : "var(--color-ink-mute)",
              fontWeight: activeCategoryId === c.id ? 400 : 300,
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items */}
      <div>
        {visibleItems.length === 0 ? (
          <p className="text-sm p-6" style={{ color: "var(--color-ink-mute)" }}>
            No items in this category.
          </p>
        ) : (
          <div
            className="mx-4 mt-3 rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            {visibleItems.map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        )}
      </div>

      {/* Notify bar */}
      <NotifyBar restaurantId={restaurantId} tableId={tableId} />
    </div>
  );
}
