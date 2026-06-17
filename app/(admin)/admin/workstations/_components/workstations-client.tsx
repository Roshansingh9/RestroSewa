"use client";

import { useActionState, useTransition } from "react";
import {
  createWorkstation,
  toggleWorkstationStatus,
  deleteWorkstation,
} from "@/app/actions/workstations";
import type { ActionResult, WorkstationRow } from "@/app/actions/workstations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
  "#64748b",
];

function WorkstationCard({
  w,
  restaurantId,
}: {
  w: WorkstationRow;
  restaurantId: string;
}) {
  const [, startToggle] = useTransition();
  const [, startDelete] = useTransition();

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border"
      style={{
        background: "var(--color-canvas)",
        borderColor: "var(--color-hairline)",
      }}
    >
      {/* Color dot */}
      <div
        className="w-3.5 h-3.5 rounded-full shrink-0"
        style={{ background: w.display_color ?? "#64748b" }}
      />

      {/* Name */}
      <p
        className="flex-1 text-sm"
        style={{
          color: "var(--color-ink)",
          textDecoration: w.is_active ? "none" : "line-through",
          opacity: w.is_active ? 1 : 0.5,
        }}
      >
        {w.name}
      </p>

      {/* Toggle */}
      <button
        type="button"
        className="text-xs px-2 py-1 rounded-md border"
        style={{
          color: w.is_active ? "#1a7a4a" : "var(--color-ink-mute)",
          borderColor: w.is_active ? "#1a7a4a44" : "var(--color-hairline)",
          background: w.is_active ? "#f0fdf4" : "transparent",
        }}
        onClick={() =>
          startToggle(async () => {
            await toggleWorkstationStatus(w.id, !w.is_active);
          })
        }
      >
        {w.is_active ? "Active" : "Inactive"}
      </button>

      {/* Delete */}
      <button
        type="button"
        className="text-xs p-1.5 rounded-md"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() =>
          startDelete(async () => {
            const result = await deleteWorkstation(w.id);
            if (result?.error) alert(result.error);
          })
        }
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function AddWorkstationForm({ restaurantId }: { restaurantId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createWorkstation,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="restaurant_id" value={restaurantId} />

      <div className="flex gap-3">
        <Input name="name" placeholder="e.g. Kitchen, Bar, Grill…" className="flex-1" required />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
          Color:
        </span>
        <div className="flex gap-1.5">
          {PRESET_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="display_color"
                value={c}
                className="sr-only"
                defaultChecked={c === "#6366f1"}
              />
              <div
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{ background: c }}
              />
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "var(--color-ruby)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

export function WorkstationsClient({
  workstations,
  restaurantId,
}: {
  workstations: WorkstationRow[];
  restaurantId: string;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {workstations.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
          No workstations yet. Add your first one below.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {workstations.map((w) => (
            <WorkstationCard key={w.id} w={w} restaurantId={restaurantId} />
          ))}
        </div>
      )}

      <div
        className="rounded-xl border px-5 py-5"
        style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ink)" }}>
          Add workstation
        </p>
        <AddWorkstationForm restaurantId={restaurantId} />
      </div>
    </div>
  );
}
