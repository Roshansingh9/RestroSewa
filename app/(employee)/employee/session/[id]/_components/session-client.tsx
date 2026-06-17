"use client";

import { useActionState, useTransition } from "react";
import { closeSessionWithPayment, updateOrderItemStatus } from "@/app/actions/pos";
import type { ActionResult, OrderItemRow, SessionDetail } from "@/app/actions/pos";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronRight, Plus } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  ready: "Ready",
  served: "Served",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f97316",
  ready: "#1a7a4a",
  served: "var(--color-ink-mute)",
};

function OrderItem({ item, sessionId }: { item: OrderItemRow; sessionId: string }) {
  const [, start] = useTransition();

  const nextStatus =
    item.item_status === "pending"
      ? "ready"
      : item.item_status === "ready"
      ? "served"
      : null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
      style={{
        borderColor: "var(--color-hairline)",
        opacity: item.item_status === "served" ? 0.45 : 1,
      }}
    >
      <div className="flex-1">
        <p className="text-sm" style={{ color: "var(--color-ink)" }}>
          {item.quantity > 1 && (
            <span className="font-medium mr-1" style={{ color: "var(--color-ink-mute)" }}>
              ×{item.quantity}
            </span>
          )}
          {item.item_name}
        </p>
        {item.workstation_name && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-mute)" }}>
            {item.workstation_name}
          </p>
        )}
        {item.notes && (
          <p className="text-xs italic mt-0.5" style={{ color: "var(--color-ink-mute)" }}>
            {item.notes}
          </p>
        )}
      </div>

      <p className="text-sm tabular shrink-0" style={{ color: "var(--color-ink-mute)" }}>
        ₹{(Number(item.item_price) * item.quantity).toFixed(0)}
      </p>

      <span
        className="text-xs shrink-0 min-w-[52px] text-center"
        style={{ color: STATUS_COLOR[item.item_status] }}
      >
        {STATUS_LABEL[item.item_status]}
      </span>

      {nextStatus && (
        <button
          type="button"
          title={`Mark as ${nextStatus}`}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--color-canvas-soft)" }}
          onClick={() =>
            start(async () => {
              await updateOrderItemStatus(
                item.id,
                nextStatus as "ready" | "served"
              );
            })
          }
        >
          <Check size={13} style={{ color: "var(--color-ink-mute)" }} />
        </button>
      )}
    </div>
  );
}

function PaymentForm({ session }: { session: SessionDetail }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    closeSessionWithPayment,
    null
  );

  const METHODS = ["cash", "card", "upi", "other"];

  return (
    <form
      action={action}
      className="rounded-xl border px-5 py-5 flex flex-col gap-4"
      style={{ background: "var(--color-canvas)", borderColor: "var(--color-primary)", borderWidth: 1.5 }}
    >
      <input type="hidden" name="session_id" value={session.id} />

      <p className="text-base font-medium" style={{ color: "var(--color-ink)" }}>
        Close &amp; collect payment
      </p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}>
          Amount (₹)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-ink-mute)" }}>₹</span>
          <Input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={session.total.toFixed(2)}
            required
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}>
          Method
        </p>
        <div className="flex gap-3 flex-wrap">
          {METHODS.map((m) => (
            <label key={m} className="flex items-center gap-1.5 text-sm capitalize cursor-pointer" style={{ color: "var(--color-ink)" }}>
              <input type="radio" name="payment_method" value={m} defaultChecked={m === "cash"} />
              {m}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "var(--color-ruby)" }}>{state.error}</p>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Closing…" : "Complete & close session"}
      </Button>
    </form>
  );
}

export function SessionClient({ session }: { session: SessionDetail }) {
  const pending = session.items.filter((i) => i.item_status !== "served");
  const served = session.items.filter((i) => i.item_status === "served");
  const isClosed = session.status === "closed";

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Items */}
      {session.items.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-8 text-center"
          style={{ borderStyle: "dashed", borderColor: "var(--color-hairline)", background: "var(--color-canvas)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            No items yet.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
        >
          {pending.map((i) => <OrderItem key={i.id} item={i} sessionId={session.id} />)}
          {served.length > 0 && pending.length > 0 && (
            <div className="px-4 py-1.5 border-t" style={{ borderColor: "var(--color-hairline)", background: "var(--color-canvas-soft)" }}>
              <p className="text-xs" style={{ color: "var(--color-ink-mute)" }}>Served</p>
            </div>
          )}
          {served.map((i) => <OrderItem key={i.id} item={i} sessionId={session.id} />)}
          {/* Total */}
          <div
            className="flex justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--color-hairline)", background: "var(--color-canvas-soft)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>Total</span>
            <span className="text-sm font-medium tabular" style={{ color: "var(--color-ink)" }}>
              ₹{session.total.toFixed(0)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isClosed && (
        <>
          <Link href={`/employee/session/${session.id}/add`}>
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <Plus size={14} />
              Add items
            </Button>
          </Link>

          <PaymentForm session={session} />
        </>
      )}

      {isClosed && (
        <div
          className="rounded-xl border px-4 py-3 text-center text-sm"
          style={{ borderColor: "#1a7a4a44", background: "#f0fdf4", color: "#1a7a4a" }}
        >
          Session closed
        </div>
      )}
    </div>
  );
}
