"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, loadSession, sessionFetch } from "../lib/session";
import AppHeader from "../components/Header";
import { Language, useLanguage } from "../lib/i18n";
import BackButton from "../components/BackButton";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
type Row = Record<string, unknown>;
export default function OperationsPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [view, setView] = useState("");

  useEffect(() => {
    setReady(Boolean(loadSession()));
  }, []);
  async function api(path: string, options: RequestInit = {}) {
    const r = await sessionFetch(API, path, options);
    const body = await r.json().catch(() => null);
    if (r.status === 401) {
      clearStoredSession();
      try {
        sessionStorage.setItem("careflow_session_expired_notice", "Your session expired. Please sign in again.");
      } catch {}
      setError("Your session expired. Please sign in again.");
      setTimeout(() => {
        router.replace("/");
      }, 1200);
      throw new Error("Your session expired. Please sign in again.");
    }
    if (!r.ok) throw new Error(body?.message || `Request failed (${r.status})`);
    return body;
  }
  async function load(path: string, name: string) {
    setError("");
    try {
      const body = await api(path);
      if (name === "Dashboard") setDashboard(body);
      else setRows(body);
      setView(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  async function createEmergency(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/v1/operations/emergency-cases", {
        method: "POST",
        body: JSON.stringify({
          patientId: f.get("patientId") || null,
          acuity: Number(f.get("acuity")),
          presentingComplaint: f.get("presentingComplaint"),
        }),
      });
      setNotice("Emergency case opened.");
      await load("/api/v1/operations/emergency-cases", "Emergency queue");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not open case");
    }
  }
  async function createCapacity(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/v1/operations/capacity", {
        method: "POST",
        body: JSON.stringify({
          departmentId: f.get("departmentId"),
          staffedBeds: Number(f.get("staffedBeds")),
          occupiedBeds: Number(f.get("occupiedBeds")),
          waitingPatients: Number(f.get("waitingPatients")),
        }),
      });
      setNotice("Capacity snapshot captured.");
      await load("/api/v1/operations/dashboard", "Dashboard");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not save capacity");
    }
  }
  return (
    <main className="portal" style={{ paddingTop: "84px" }}>
      <AppHeader
        user={{ fullName: "Operations Control", roles: ["ADMIN"] }}
        breadcrumbs={[{ label: "Hospital Operations", href: "/operations" }]}
      />
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">{t.liveOperations}</p>
            <h1>{t.operationalControl}</h1>
          </div>
          <BackButton label={`← ${t.backToStaffPortal}`} fallbackHref="/staff" />
        </div>
        {!ready && (
          <div className="error">
            Sign in through the staff portal before opening operations.
          </div>
        )}
        {notice && <div className="success">{notice}</div>}
        {error && <div className="error">{error}</div>}
        <div className="workspace-nav">
          <button
            className={view === "Dashboard" ? "active" : ""}
            aria-current={view === "Dashboard" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("/api/v1/operations/dashboard", "Dashboard")}
          >
            Dashboard
          </button>
          <button
            className={view === "Emergency queue" ? "active" : ""}
            aria-current={view === "Emergency queue" ? "page" : undefined}
            disabled={!ready}
            onClick={() =>
              load("/api/v1/operations/emergency-cases", "Emergency queue")
            }
          >
            Emergency
          </button>
          <button
            className={view === "Laboratory" ? "active" : ""}
            aria-current={view === "Laboratory" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("/api/v1/operations/lab-orders", "Laboratory")}
          >
            Laboratory
          </button>
          <button
            className={view === "Billing" ? "active" : ""}
            aria-current={view === "Billing" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("/api/v1/operations/invoices", "Billing")}
          >
            Billing
          </button>
        </div>
        <div className="portal-grid">
          <form className="card form" onSubmit={createEmergency}>
            <h2>Open emergency case</h2>
            <label>
              Patient ID (optional)
              <input name="patientId" />
            </label>
            <label>
              Acuity
              <select name="acuity">
                <option value="1">1 · Resuscitation</option>
                <option value="2">2 · Emergent</option>
                <option value="3">3 · Urgent</option>
                <option value="4">4 · Less urgent</option>
                <option value="5">5 · Non-urgent</option>
              </select>
            </label>
            <label>
              Presenting complaint
              <textarea name="presentingComplaint" required />
            </label>
            <button disabled={!ready}>Open case</button>
          </form>
          <form className="card form" onSubmit={createCapacity}>
            <h2>Capture capacity</h2>
            <label>
              Department ID
              <input name="departmentId" required />
            </label>
            <div className="form-grid">
              <label>
                Staffed beds
                <input name="staffedBeds" type="number" min="0" required />
              </label>
              <label>
                Occupied beds
                <input name="occupiedBeds" type="number" min="0" required />
              </label>
            </div>
            <label>
              Waiting patients
              <input name="waitingPatients" type="number" min="0" required />
            </label>
            <button disabled={!ready}>Save snapshot</button>
          </form>
        </div>
        {view && (
          <section className="operations-results">
            <h2>{view}</h2>
            {dashboard && view === "Dashboard" && (
              <div className="metric-grid">
                {Object.entries(dashboard)
                  .filter(([, v]) => typeof v !== "object")
                  .map(([k, v]) => (
                    <article className="metric" key={k}>
                      <strong>{String(v)}</strong>
                      <span>{k.replace(/([A-Z])/g, " $1")}</span>
                    </article>
                  ))}
              </div>
            )}
            <div className="list-grid">
              {rows.map((row, i) => (
                <article className="card data-card" key={i}>
                  {Object.entries(row).map(([k, v]) => (
                    <p key={k}>
                      <strong>{k.replaceAll("_", " ")}:</strong>{" "}
                      {String(v ?? "—")}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="actions">
          <Link href="/staff">Staff portal</Link>
          <Link className="secondary" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
