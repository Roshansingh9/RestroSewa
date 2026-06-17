"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { createRestaurant } from "@/app/actions/restaurants";
import type { ActionResult } from "@/app/actions/restaurants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";

const TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "lodge", label: "Lodge" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
];

const TIERS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
];

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewRestaurantPage() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createRestaurant,
    null
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    const name = nameRef.current;
    const slug = slugRef.current;
    if (!name || !slug) return;

    function onNameInput() {
      if (!slugTouched.current && slug) {
        slug.value = toSlug(name!.value);
      }
    }

    function onSlugInput() {
      slugTouched.current = true;
    }

    name.addEventListener("input", onNameInput);
    slug.addEventListener("input", onSlugInput);
    return () => {
      name.removeEventListener("input", onNameInput);
      slug.removeEventListener("input", onSlugInput);
    };
  }, []);

  return (
    <div className="p-8 max-w-lg">
      <Link
        href="/superadmin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "var(--color-ink-mute)" }}
      >
        <ChevronLeft size={14} />
        Restaurants
      </Link>

      <h1
        className="text-xl mb-6"
        style={{
          color: "var(--color-ink)",
          fontWeight: 300,
          letterSpacing: "-0.4px",
        }}
      >
        New restaurant
      </h1>

      <form
        action={action}
        className="rounded-xl border px-6 py-6 flex flex-col gap-5"
        style={{
          background: "var(--color-canvas)",
          borderColor: "var(--color-hairline)",
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="name"
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
          >
            Restaurant name
          </label>
          <Input id="name" name="name" ref={nameRef} required placeholder="The Grand Café" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="slug"
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
          >
            URL slug
          </label>
          <div className="flex items-center gap-0">
            <span
              className="text-sm px-3 h-9 flex items-center rounded-l-sm border-y border-l"
              style={{
                color: "var(--color-ink-mute)",
                borderColor: "var(--color-hairline-input)",
                background: "var(--color-canvas-soft)",
                fontSize: 12,
              }}
            >
              /c/
            </span>
            <Input
              id="slug"
              name="slug"
              ref={slugRef}
              required
              placeholder="grand-cafe"
              className="rounded-l-none"
              pattern="[a-z0-9-]+"
            />
          </div>
          <p className="text-xs" style={{ color: "var(--color-ink-mute)", fontSize: 11 }}>
            Lowercase letters, numbers and hyphens only
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="type"
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
          >
            Business type
          </label>
          <select
            id="type"
            name="type"
            defaultValue="restaurant"
            className="h-9 rounded-sm border px-3 text-sm outline-none focus:border-primary"
            style={{
              borderColor: "var(--color-hairline-input)",
              color: "var(--color-ink)",
              background: "var(--color-canvas)",
            }}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
          >
            Subscription tier
          </label>
          <div className="flex gap-2">
            {TIERS.map((t) => (
              <label
                key={t.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: "var(--color-ink)" }}
              >
                <input
                  type="radio"
                  name="subscription_tier"
                  value={t.value}
                  defaultChecked={t.value === "free"}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {state?.error && (
          <p
            className="text-sm rounded-md px-3 py-2"
            style={{ color: "var(--color-ruby)", background: "#fff0f4" }}
          >
            {state.error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Create restaurant"}
          </Button>
          <Link href="/superadmin/dashboard">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
