"use client";

import { useActionState, useState } from "react";
import { loginWithPin } from "@/app/actions/auth";
import type { AuthResult, StaffMember } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const KEYPAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;
const PIN_LENGTH = 6;

function PinDots({ pin }: { pin: string }) {
  return (
    <div className="flex gap-3 justify-center my-6">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full transition-all duration-150"
          style={{
            background:
              i < pin.length ? "var(--color-lemon)" : "var(--color-hairline)",
          }}
        />
      ))}
    </div>
  );
}

function Keypad({
  onDigit,
  onBack,
}: {
  onDigit: (d: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mx-auto">
      {KEYPAD.map((key, i) => {
        if (key === "") return <div key={i} />;
        if (key === "⌫") {
          return (
            <button
              key={i}
              type="button"
              onClick={onBack}
              onMouseDown={(e) => e.preventDefault()}
              className="h-14 rounded-lg text-xl font-light flex items-center justify-center select-none"
              style={{
                background: "var(--color-hairline)",
                color: "var(--color-ink-mute)",
              }}
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onDigit(key)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-14 rounded-lg text-xl font-light flex items-center justify-center select-none"
            style={{
              background: "var(--color-canvas-soft)",
              color: "var(--color-ink)",
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

export function StaffLogin({ staff }: { staff: StaffMember[] }) {
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState("");
  const [state, dispatch, pending] = useActionState<AuthResult, FormData>(
    loginWithPin,
    null
  );

  function handleDigit(d: string) {
    setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
  }

  function handleBack() {
    setPin((p) => p.slice(0, -1));
  }

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <p
          className="text-sm text-center mb-2"
          style={{ color: "var(--color-ink-mute)" }}
        >
          Select your name to continue
        </p>
        <div className="grid grid-cols-2 gap-2">
          {staff.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-lg border text-left transition-colors"
              style={{
                borderColor: "var(--color-hairline)",
                background: "var(--color-canvas-soft)",
              }}
            >
              <span
                className="font-medium text-sm"
                style={{ color: "var(--color-ink)" }}
              >
                {s.display_name}
              </span>
              <span className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
                {s.title ||
                  s.role.replace("restaurant_", "").replace("_", " ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setPin("");
        }}
        className="self-start text-sm mb-2"
        style={{ color: "var(--color-ink-mute)" }}
      >
        ← Back
      </button>

      <p className="text-base font-medium" style={{ color: "var(--color-ink)" }}>
        {selected.display_name}
      </p>
      <p className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
        Enter your PIN
      </p>

      <PinDots pin={pin} />

      {state?.error && (
        <p
          className="text-sm rounded-md px-3 py-2 w-full text-center"
          style={{ color: "var(--color-ruby)", background: "#fff0f4" }}
        >
          {state.error}
        </p>
      )}

      <Keypad onDigit={handleDigit} onBack={handleBack} />

      <Button
        type="button"
        variant="primary"
        className="w-full max-w-[240px] mt-4"
        disabled={pin.length < 4 || pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("restaurant_user_id", selected.id);
          fd.set("pin", pin);
          dispatch(fd);
        }}
      >
        {pending ? "Verifying…" : "Sign in"}
      </Button>
    </div>
  );
}
