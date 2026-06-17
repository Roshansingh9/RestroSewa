"use client";

import { useActionState, useState } from "react";
import { createStaffMember } from "@/app/actions/staff";
import type { ActionResult } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const KEYPAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

function PinEntry({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* PIN display */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded border flex items-center justify-center text-sm font-medium"
            style={{
              borderColor: i < value.length ? "var(--color-primary)" : "var(--color-hairline-input)",
              background: "var(--color-canvas-soft)",
              color: "var(--color-ink)",
            }}
          >
            {i < value.length ? "•" : ""}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-6 gap-1.5">
        {KEYPAD.map((key, i) => {
          if (key === "") return <div key={i} />;
          if (key === "⌫") {
            return (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(value.slice(0, -1))}
                className="col-span-2 h-8 rounded text-sm flex items-center justify-center"
                style={{ background: "var(--color-hairline)", color: "var(--color-ink-mute)" }}
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => value.length < 6 && onChange(value + key)}
              className="col-span-2 h-8 rounded text-sm flex items-center justify-center"
              style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink)" }}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AddStaffForm({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [state, dispatch, pending] = useActionState<ActionResult, FormData>(
    createStaffMember,
    null
  );

  function handleSubmit() {
    const fd = new FormData();
    fd.set("restaurant_id", restaurantId);
    fd.set("display_name", (document.getElementById("display_name") as HTMLInputElement)?.value ?? "");
    fd.set("title", (document.getElementById("title") as HTMLInputElement)?.value ?? "");
    fd.set("role", (document.querySelector('input[name="role"]:checked') as HTMLInputElement)?.value ?? "restaurant_employee");
    fd.set("pin", pin);
    dispatch(fd);
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add staff member
      </Button>
    );
  }

  return (
    <div
      className="rounded-xl border px-5 py-5 flex flex-col gap-4"
      style={{
        background: "var(--color-canvas)",
        borderColor: "var(--color-primary)",
        borderWidth: 1.5,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
          New staff member
        </p>
        <button
          type="button"
          onClick={() => { setOpen(false); setPin(""); }}
          style={{ color: "var(--color-ink-mute)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="display_name"
          className="text-xs uppercase tracking-wide font-medium"
          style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
        >
          Name
        </label>
        <Input id="display_name" name="display_name" placeholder="Raj Kumar" required />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="title"
          className="text-xs uppercase tracking-wide font-medium"
          style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
        >
          Title (optional)
        </label>
        <Input id="title" name="title" placeholder="Waiter, Chef, Manager…" />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <p
          className="text-xs uppercase tracking-wide font-medium"
          style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
        >
          Role
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-ink)" }}>
            <input type="radio" name="role" value="restaurant_employee" defaultChecked />
            Staff
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-ink)" }}>
            <input type="radio" name="role" value="restaurant_admin" />
            Admin
          </label>
        </div>
      </div>

      {/* PIN */}
      <div className="flex flex-col gap-1.5">
        <p
          className="text-xs uppercase tracking-wide font-medium"
          style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
        >
          Login PIN (4–6 digits)
        </p>
        <PinEntry value={pin} onChange={setPin} />
      </div>

      {state?.error && (
        <p
          className="text-sm rounded-md px-3 py-2"
          style={{ color: "var(--color-ruby)", background: "#fff0f4" }}
        >
          {state.error}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        disabled={pin.length < 4 || pending}
        onClick={handleSubmit}
      >
        {pending ? "Creating…" : "Create staff member"}
      </Button>
    </div>
  );
}
