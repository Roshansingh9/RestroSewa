"use client";

import { useActionState, useTransition, useState, useEffect, useRef } from "react";
import {
  createTableGroup,
  createTable,
  updateTable,
  toggleTableStatus,
  deleteTable,
} from "@/app/actions/tables-admin";
import type { ActionResult, GroupWithTables, TableRow } from "@/app/actions/tables-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Trash2, X, Download, Pencil } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

// ─── QR Modal ─────────────────────────────────────────────────────────────────

type QrTarget = { table: TableRow; url: string } | null;

function QrModal({ target, onClose }: { target: QrTarget; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (target) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [target, onClose]);

  if (!target) return null;

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `table-${target!.table.number}-qr.png`;
    link.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-5 rounded-2xl p-6 w-full max-w-xs"
        style={{ background: "var(--color-canvas)", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <p className="font-medium text-base" style={{ color: "var(--color-ink)" }}>
            Table {target.table.number}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink-mute)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          className="p-3 rounded-xl"
          style={{ background: "#ffffff", border: "1px solid var(--color-hairline)" }}
        >
          <QRCodeCanvas
            ref={canvasRef}
            value={target.url}
            size={220}
            level="M"
            marginSize={2}
          />
        </div>

        <p
          className="text-xs text-center break-all leading-relaxed max-w-[240px]"
          style={{ color: "var(--color-ink-mute)" }}
        >
          {target.url}
        </p>

        <div className="flex gap-2 w-full">
          <Button
            type="button"
            variant="primary"
            className="flex-1 flex items-center justify-center gap-1.5"
            onClick={download}
          >
            <Download size={13} />
            Download PNG
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Table Pill ───────────────────────────────────────────────────────────────

function TablePill({
  table,
  groups,
  onQrClick,
}: {
  table: TableRow;
  groups: GroupWithTables[];
  onQrClick: (table: TableRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [, startToggle] = useTransition();
  const [, startDelete] = useTransition();
  const [editState, editAction, editPending] = useActionState<ActionResult, FormData>(
    updateTable,
    null
  );
  const [editSubmitted, setEditSubmitted] = useState(false);

  useEffect(() => { if (editPending) setEditSubmitted(true); }, [editPending]);
  useEffect(() => {
    if (editSubmitted && !editPending && editState === null) {
      setEditSubmitted(false);
      setEditing(false);
    }
  }, [editSubmitted, editPending, editState]);

  if (editing) {
    return (
      <form
        action={editAction}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm flex-wrap"
        style={{
          borderColor: "var(--color-primary)",
          borderWidth: 1.5,
          background: "var(--color-canvas)",
        }}
      >
        <input type="hidden" name="id" value={table.id} />
        <Input
          name="number"
          defaultValue={table.number}
          required
          className="w-16 h-7 text-xs px-2"
          placeholder="No."
        />
        {groups.length > 0 && (
          <select
            name="group_id"
            defaultValue={table.group_id ?? ""}
            className="h-7 rounded border px-1.5 text-xs"
            style={{
              borderColor: "var(--color-hairline-input)",
              color: "var(--color-ink)",
              background: "var(--color-canvas)",
            }}
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={editPending}
          className="text-xs px-2 py-1 rounded font-medium"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          {editPending ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{ color: "var(--color-ink-mute)" }}
        >
          <X size={12} />
        </button>
        {editState?.error && (
          <p className="text-xs w-full" style={{ color: "var(--color-ruby)" }}>
            {editState.error}
          </p>
        )}
      </form>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
      style={{
        background: "var(--color-canvas)",
        borderColor: "var(--color-hairline)",
        opacity: table.is_active ? 1 : 0.5,
      }}
    >
      <span style={{ color: "var(--color-ink)", fontWeight: 400 }}>T{table.number}</span>
      <button
        type="button"
        title="Show QR code"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() => onQrClick(table)}
      >
        <QrCode size={13} />
      </button>
      <button
        type="button"
        title="Edit table"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() => setEditing(true)}
      >
        <Pencil size={12} />
      </button>
      <button
        type="button"
        className="text-xs"
        style={{ color: table.is_active ? "#1a7a4a" : "var(--color-ink-mute)" }}
        onClick={() => startToggle(async () => { await toggleTableStatus(table.id, !table.is_active); })}
      >
        {table.is_active ? "●" : "○"}
      </button>
      <button
        type="button"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() =>
          startDelete(async () => {
            if (confirm(`Delete table ${table.number}?`)) {
              const r = await deleteTable(table.id);
              if (r?.error) alert(r.error);
            }
          })
        }
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────

function AddTableForm({
  restaurantId,
  groups,
  defaultGroupId,
}: {
  restaurantId: string;
  groups: GroupWithTables[];
  defaultGroupId?: string;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createTable, null);

  return (
    <form action={action} className="flex items-end gap-2 flex-wrap">
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
          Table number/name
        </label>
        <Input name="number" placeholder="1, A1, Bar-1…" className="w-36" required />
      </div>
      {groups.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
            Group (optional)
          </label>
          <select
            name="group_id"
            defaultValue={defaultGroupId ?? ""}
            className="h-9 rounded-sm border px-3 text-sm"
            style={{ borderColor: "var(--color-hairline-input)", color: "var(--color-ink)", background: "var(--color-canvas)" }}
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Adding…" : "Add table"}
      </Button>
      {state?.error && (
        <p className="text-xs self-end" style={{ color: "var(--color-ruby)" }}>{state.error}</p>
      )}
    </form>
  );
}

function AddGroupForm({ restaurantId }: { restaurantId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createTableGroup, null);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <Input name="name" placeholder="Group name (e.g. Indoor, Rooftop…)" className="flex-1" required />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add group"}
      </Button>
      {state?.error && (
        <p className="text-xs" style={{ color: "var(--color-ruby)" }}>{state.error}</p>
      )}
    </form>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function TablesClient({
  ungrouped,
  groups,
  restaurantId,
  restaurantSlug,
}: {
  ungrouped: TableRow[];
  groups: GroupWithTables[];
  restaurantId: string;
  restaurantSlug: string;
}) {
  const [qrTarget, setQrTarget] = useState<QrTarget>(null);
  const totalTables = ungrouped.length + groups.reduce((n, g) => n + g.tables.length, 0);

  function handleQrClick(table: TableRow) {
    const url = restaurantSlug
      ? `${window.location.origin}/c/${restaurantSlug}?table=${table.qr_token}`
      : `${window.location.origin}/c?table=${table.qr_token}`;
    setQrTarget({ table, url });
  }

  return (
    <>
      <QrModal target={qrTarget} onClose={() => setQrTarget(null)} />

      <div className="flex flex-col gap-8 max-w-2xl">
        <p className="text-sm -mt-4" style={{ color: "var(--color-ink-mute)" }}>
          {totalTables} tables total
        </p>

        {/* Groups */}
        {groups.map((g) => (
          <div key={g.id}>
            <p
              className="text-xs uppercase tracking-wide mb-3 font-medium"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              {g.name}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {g.tables.map((t) => (
                <TablePill key={t.id} table={t} groups={groups} onQrClick={handleQrClick} />
              ))}
              {g.tables.length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-ink-mute)" }}>No tables in this group.</p>
              )}
            </div>
            <AddTableForm restaurantId={restaurantId} groups={groups} defaultGroupId={g.id} />
          </div>
        ))}

        {/* Ungrouped */}
        {(ungrouped.length > 0 || groups.length === 0) && (
          <div>
            {groups.length > 0 && (
              <p
                className="text-xs uppercase tracking-wide mb-3 font-medium"
                style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
              >
                Ungrouped
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {ungrouped.map((t) => (
                <TablePill key={t.id} table={t} groups={groups} onQrClick={handleQrClick} />
              ))}
              {ungrouped.length === 0 && groups.length === 0 && (
                <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
                  No tables yet.
                </p>
              )}
            </div>
            {groups.length === 0 && (
              <AddTableForm restaurantId={restaurantId} groups={groups} />
            )}
          </div>
        )}

        {/* Add table to ungrouped (when groups exist) */}
        {groups.length > 0 && (
          <div>
            <p
              className="text-xs uppercase tracking-wide mb-3 font-medium"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              Add table
            </p>
            <AddTableForm restaurantId={restaurantId} groups={groups} />
          </div>
        )}

        {/* Add group */}
        <div
          className="rounded-xl border px-5 py-4"
          style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ink)" }}>
            Add table group
          </p>
          <AddGroupForm restaurantId={restaurantId} />
        </div>
      </div>
    </>
  );
}
