"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import type { CategoryRow, MenuItemRow } from "@/app/actions/menu";
import {
  sendNotification,
  verifyCustomerPin,
  checkSessionActive,
  submitCustomerOrder,
} from "@/app/actions/customer";
import type { CustomerCartItem } from "@/app/actions/customer";
import { Bell, UtensilsCrossed, Plus, Minus, ShoppingBag, X, Lock } from "lucide-react";

const FOOD_TYPE_CONFIG = {
  veg:     { color: "#1a7a4a", label: "Veg" },
  non_veg: { color: "#c0392b", label: "Non-Veg" },
  vegan:   { color: "#2563eb", label: "Vegan" },
  egg:     { color: "#b45309", label: "Egg" },
} as const;

// ─── PIN Entry ─────────────────────────────────────────────────────────────────

function PinEntry({
  sessionId,
  tableId,
  onSuccess,
  onClose,
}: {
  sessionId: string;
  tableId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const addDigit = useCallback(
    async (d: string) => {
      if (verifying) return;
      setError(null);
      const next = [...digits, d];
      setDigits(next);
      if (next.length === 4) {
        setVerifying(true);
        const result = await verifyCustomerPin(sessionId, next.join(""));
        if (result.success) {
          try {
            localStorage.setItem(`rs_auth_${tableId}`, JSON.stringify({ sessionId }));
          } catch {
            // storage unavailable — still allow ordering for this session
          }
          onSuccess();
        } else {
          setDigits([]);
          setError("Incorrect PIN. Please try again.");
          setVerifying(false);
        }
      }
    },
    [digits, verifying, sessionId, tableId, onSuccess]
  );

  const backspace = useCallback(() => {
    setError(null);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl p-6 flex flex-col gap-5"
        style={{ background: "var(--color-canvas)", maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-medium" style={{ color: "var(--color-ink)" }}>
              Unlock ordering
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-ink-mute)" }}>
              Ask your waiter for the 4-digit PIN
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ color: "var(--color-ink-mute)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Digit display */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: "var(--color-canvas-soft)",
                border: `2px solid ${digits[i] !== undefined ? "var(--color-primary)" : "var(--color-hairline)"}`,
                color: "var(--color-ink)",
                fontWeight: 600,
              }}
            >
              {digits[i] !== undefined ? "•" : ""}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-sm" style={{ color: "var(--color-ruby)" }}>
            {error}
          </p>
        )}

        {verifying && (
          <p className="text-center text-sm" style={{ color: "var(--color-ink-mute)" }}>
            Verifying…
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k, i) =>
            k === "" ? (
              <div key={i} />
            ) : k === "⌫" ? (
              <button
                key="back"
                type="button"
                onClick={backspace}
                disabled={verifying}
                className="h-14 rounded-xl text-xl flex items-center justify-center"
                style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink)" }}
              >
                ⌫
              </button>
            ) : (
              <button
                key={k}
                type="button"
                onClick={() => addDigit(k)}
                disabled={digits.length >= 4 || verifying}
                className="h-14 rounded-xl text-xl font-medium"
                style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink)" }}
              >
                {k}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notify Bar ────────────────────────────────────────────────────────────────

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

// ─── Cart Bar ─────────────────────────────────────────────────────────────────

function CartBar({
  itemCount,
  total,
  onPlace,
  placing,
  success,
}: {
  itemCount: number;
  total: number;
  onPlace: () => void;
  placing: boolean;
  success: boolean;
}) {
  if (itemCount === 0 && !success) return null;

  return (
    <div
      className="fixed left-0 right-0 px-4 py-3 border-t"
      style={{
        bottom: 61,
        background: "var(--color-primary)",
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      {success ? (
        <div className="text-center text-sm font-medium" style={{ color: "#fff" }}>
          Order placed — we&apos;ll have it out shortly!
        </div>
      ) : (
        <button
          type="button"
          onClick={onPlace}
          disabled={placing}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={15} />
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span>{placing ? "Placing…" : `Place order · ₹${total.toFixed(0)}`}</span>
        </button>
      )}
    </div>
  );
}

// ─── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  cartQty,
  canOrder,
  onAdd,
  onRemove,
}: {
  item: MenuItemRow;
  cartQty: number;
  canOrder: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const foodCfg = FOOD_TYPE_CONFIG[item.food_type as keyof typeof FOOD_TYPE_CONFIG];
  const hasBadges = item.badges?.length > 0;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
      style={{ borderColor: "var(--color-hairline)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {foodCfg && (
            <span
              title={foodCfg.label}
              className="mt-1 w-2.5 h-2.5 rounded-sm border flex-shrink-0"
              style={{ borderColor: foodCfg.color, background: foodCfg.color + "22" }}
            />
          )}
          <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-ink)" }}>
            {item.name}
          </p>
        </div>
        {hasBadges && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.badges.map((badge) => (
              <span
                key={badge}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "#fef9c3", color: "#854d0e", fontSize: 10 }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {item.description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-ink-mute)" }}>
            {item.description}
          </p>
        )}
        {item.preparation_time && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-mute)" }}>
            ~{item.preparation_time} min
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
        <p className="text-sm tabular-nums" style={{ color: "var(--color-ink)", fontWeight: 400 }}>
          ₹{Number(item.price).toFixed(0)}
        </p>

        {canOrder && (
          cartQty === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              <Plus size={11} />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRemove}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink)" }}
              >
                <Minus size={11} />
              </button>
              <span
                className="text-sm w-5 text-center font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {cartQty}
              </span>
              <button
                type="button"
                onClick={onAdd}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-primary)", color: "#fff" }}
              >
                <Plus size={11} />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CustomerMenu({
  restaurantId,
  restaurantName,
  tableId,
  sessionId,
  orderingEnabled,
  qrMode,
  categories,
  items,
}: {
  restaurantId: string;
  restaurantName: string;
  tableId: string | null;
  sessionId: string | null;
  orderingEnabled: boolean;
  qrMode: string;
  categories: CategoryRow[];
  items: MenuItemRow[];
}) {
  // Ordering is active only when all conditions are met
  const orderingAvailable =
    orderingEnabled && qrMode === "ordering_enabled" && !!sessionId && !!tableId;

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [pendingAddItemId, setPendingAddItemId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const workstationNameMap = useMemo(
    () => new Map<string, string>(categories.map((c) => [c.workstation_id, c.workstation_name ?? ""])),
    [categories]
  );

  // Restore PIN auth from localStorage on mount
  useEffect(() => {
    if (!tableId || !sessionId) return;
    try {
      const stored = localStorage.getItem(`rs_auth_${tableId}`);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { sessionId?: string };
      if (parsed.sessionId !== sessionId) return;
      checkSessionActive(sessionId).then((r) => {
        if (r.active) setPinVerified(true);
        else localStorage.removeItem(`rs_auth_${tableId}`);
      });
    } catch {
      // ignore parse/storage errors
    }
  }, [tableId, sessionId]);

  const handleAdd = useCallback(
    (item: MenuItemRow) => {
      if (!orderingAvailable) return;
      if (!pinVerified) {
        setPendingAddItemId(item.id);
        setShowPinEntry(true);
        return;
      }
      setCart((prev) => {
        const next = new Map(prev);
        next.set(item.id, (next.get(item.id) ?? 0) + 1);
        return next;
      });
    },
    [orderingAvailable, pinVerified]
  );

  const handleRemove = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = (next.get(itemId) ?? 0) - 1;
      if (qty <= 0) next.delete(itemId);
      else next.set(itemId, qty);
      return next;
    });
  }, []);

  const handlePinSuccess = useCallback(() => {
    setPinVerified(true);
    setShowPinEntry(false);
    if (pendingAddItemId) {
      setCart((prev) => {
        const next = new Map(prev);
        next.set(pendingAddItemId, (next.get(pendingAddItemId) ?? 0) + 1);
        return next;
      });
      setPendingAddItemId(null);
    }
  }, [pendingAddItemId]);

  const cartEntries = Array.from(cart.entries());
  const cartTotal = cartEntries.reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item ? Number(item.price) * qty : 0);
  }, 0);
  const cartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

  async function placeOrder() {
    if (!sessionId || cartCount === 0) return;
    setPlacing(true);
    const orderItems: CustomerCartItem[] = cartEntries.flatMap(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      if (!item) return [];
      return [
        {
          menu_item_id: id,
          item_name: item.name,
          item_price: Number(item.price),
          workstation_id: item.workstation_id,
          workstation_name: workstationNameMap.get(item.workstation_id) ?? "",
          quantity: qty,
        },
      ];
    });
    const result = await submitCustomerOrder(sessionId, restaurantId, orderItems);
    if (result.error) {
      alert(result.error);
    } else {
      setCart(new Map());
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    }
    setPlacing(false);
  }

  const visibleItems = items.filter((i) => i.category_id === activeCategoryId);
  const bottomPad = tableId
    ? cartCount > 0 || orderSuccess
      ? 130
      : 68
    : 16;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-canvas)", paddingBottom: bottomPad }}
    >
      {/* PIN entry overlay */}
      {showPinEntry && orderingAvailable && sessionId && tableId && (
        <PinEntry
          sessionId={sessionId}
          tableId={tableId}
          onSuccess={handlePinSuccess}
          onClose={() => {
            setShowPinEntry(false);
            setPendingAddItemId(null);
          }}
        />
      )}

      {/* Header */}
      <div className="px-4 py-5 text-center border-b" style={{ borderColor: "var(--color-hairline)" }}>
        <h1
          className="text-xl"
          style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
        >
          {restaurantName}
        </h1>

        {tableId && (
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-mute)" }}>
            {orderingAvailable
              ? pinVerified
                ? "Ordering enabled — add items to your cart below"
                : "Browse our menu · Ask your waiter for a PIN to order"
              : "Browse our menu · Use the buttons below to call staff"}
          </p>
        )}

        {tableId && orderingEnabled && qrMode === "view_only" && (
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs"
            style={{ background: "#f1f5f9", color: "var(--color-ink-mute)" }}
          >
            <Lock size={11} />
            View only — ask your waiter to place your order
          </div>
        )}

        {orderingAvailable && !pinVerified && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs"
            style={{ background: "rgba(99,102,241,0.08)", color: "var(--color-primary)" }}
            onClick={() => setShowPinEntry(true)}
          >
            <Lock size={11} />
            Enter PIN to order
          </button>
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
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategoryId(c.id)}
            className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors"
            style={{
              background:
                activeCategoryId === c.id ? "var(--color-ink)" : "var(--color-canvas-soft)",
              color: activeCategoryId === c.id ? "#fff" : "var(--color-ink-mute)",
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
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                cartQty={cart.get(item.id) ?? 0}
                canOrder={orderingAvailable}
                onAdd={() => handleAdd(item)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart bar (above notify bar) */}
      {orderingAvailable && (
        <CartBar
          itemCount={cartCount}
          total={cartTotal}
          onPlace={placeOrder}
          placing={placing}
          success={orderSuccess}
        />
      )}

      {/* Notify bar */}
      <NotifyBar restaurantId={restaurantId} tableId={tableId} />
    </div>
  );
}
