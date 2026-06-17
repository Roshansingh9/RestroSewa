"use client";

import { useActionState, useTransition } from "react";
import {
  createTableGroup,
  createTable,
  toggleTableStatus,
  deleteTable,
} from "@/app/actions/tables-admin";
import type { ActionResult, GroupWithTables, TableRow } from "@/app/actions/tables-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Trash2 } from "lucide-react";

function TablePill({
  table,
  restaurantId,
}: {
  table: TableRow;
  restaurantId: string;
}) {
  const [, startToggle] = useTransition();
  const [, startDelete] = useTransition();

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
      style={{
        background: "var(--color-canvas)",
        borderColor: table.is_active ? "var(--color-hairline)" : "var(--color-hairline)",
        opacity: table.is_active ? 1 : 0.5,
      }}
    >
      <span style={{ color: "var(--color-ink)", fontWeight: 400 }}>T{table.number}</span>
      <button
        type="button"
        title="View QR"
        style={{ color: "var(--color-ink-mute)" }}
        onClick={() => {
          const url = `${window.location.origin}/c/${table.qr_token}`;
          window.open(url, "_blank");
        }}
      >
        <QrCode size={13} />
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
        onClick={() => startDelete(async () => {
          if (confirm(`Delete table ${table.number}?`)) {
            const r = await deleteTable(table.id);
            if (r?.error) alert(r.error);
          }
        })}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

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

export function TablesClient({
  ungrouped,
  groups,
  restaurantId,
}: {
  ungrouped: TableRow[];
  groups: GroupWithTables[];
  restaurantId: string;
}) {
  const totalTables = ungrouped.length + groups.reduce((n, g) => n + g.tables.length, 0);

  return (
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
              <TablePill key={t.id} table={t} restaurantId={restaurantId} />
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
              <TablePill key={t.id} table={t} restaurantId={restaurantId} />
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
  );
}
