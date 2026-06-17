import Link from "next/link";

const FEATURES = [
  {
    title: "Table & Session Management",
    description: "Open tables, track active sessions, and manage walk-ins from one clean interface.",
  },
  {
    title: "Multi-Role Access",
    description: "Separate dashboards for restaurant admins, staff, and platform super admins.",
  },
  {
    title: "Menu & Workstation Control",
    description: "Manage menu categories, items, and workstation queues in real time.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-canvas)" }}>
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center px-6 py-24 text-center"
        style={{
          background: "linear-gradient(135deg, #0f0d07 0%, #1c1a0e 50%, #100c06 100%)",
          minHeight: "60vh",
        }}
      >
        <div className="mb-6">
          <span
            style={{
              fontSize: 40,
              fontWeight: 300,
              letterSpacing: "-0.8px",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            Restro
            <span style={{ color: "var(--color-lemon)", fontWeight: 500 }}>Sewa</span>
          </span>
        </div>

        <p
          className="mb-4 max-w-md"
          style={{ color: "rgba(255,255,255,0.65)", fontSize: 18, fontWeight: 300, lineHeight: 1.5 }}
        >
          Hospitality management for modern restaurants, cafés &amp; lodges.
        </p>

        <p
          className="mb-10 max-w-sm"
          style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}
        >
          Manage tables, menus, orders, staff and payments — all in one place.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              letterSpacing: "-0.1px",
            }}
          >
            Admin / Employee Login
          </Link>
          <Link
            href="/superadmin/login"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Super Admin Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="flex-1 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <p
            className="text-center mb-12 text-sm uppercase tracking-widest"
            style={{ color: "var(--color-ink-mute)", letterSpacing: "0.12em" }}
          >
            Everything you need
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border px-5 py-5"
                style={{
                  background: "var(--color-canvas-soft)",
                  borderColor: "var(--color-hairline)",
                }}
              >
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--color-ink)", letterSpacing: "-0.2px" }}
                >
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-mute)" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-6 text-center"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <p className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
          &copy; {new Date().getFullYear()} RestroSewa &mdash; Hospitality Management Platform
        </p>
      </footer>
    </div>
  );
}
