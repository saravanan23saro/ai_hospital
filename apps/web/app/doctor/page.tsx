"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, loadSession, sessionFetch } from "../lib/session";
import AppHeader from "../components/Header";
import { useLanguage } from "../lib/i18n";
import BackButton from "../components/BackButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

type Me = { userId?: string; email: string; roles: string[] };
type Department = { departmentId: string; name: string };

type DoctorProfile = {
  id?: string;
  doctorId?: string;
  doctorNumber: string;
  fullName: string;
  specialization: string;
  departmentName: string;
  licenseNumber: string;
  experienceYears: number;
  verificationStatus: string;
  active: boolean;
};

type Schedule = {
  scheduleId: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  slotDurationMinutes: number;
};

type Appointment = {
  appointmentId: string;
  appointmentNumber: string;
  patientNumber?: string;
  patientName?: string;
  patientPhone?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  doctorId?: string;
};

export default function DoctorPortal() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Reschedule state
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<any | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);

  useEffect(() => {
    if (loadSession()) setToken("authenticated");
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    if (token) loadIdentity();
  }, [token]);

  // Real-time SSE schedule updates
  useEffect(() => {
    if (!token) return;
    const session = loadSession();
    if (!session?.accessToken) return;

    let es: EventSource | null = null;
    try {
      const sseUrl = `${API}/api/v1/schedules/stream?token=${encodeURIComponent(session.accessToken)}`;
      es = new EventSource(sseUrl);

      const handleScheduleUpdate = () => {
        loadDoctor();
      };

      es.addEventListener("APPOINTMENT_BOOKED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_CANCELLED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_RESCHEDULED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_SLOT_AVAILABLE", handleScheduleUpdate);
    } catch {
      // non-fatal
    }

    return () => {
      if (es) es.close();
    };
  }, [token]);

  async function api(path: string, options: RequestInit = {}) {
    const r = await sessionFetch(API, path, options);
    const b = await r.json().catch(() => null);
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
    if (!r.ok) throw new Error(b?.message || `Request failed (${r.status})`);
    return b;
  }

  async function loadIdentity() {
    try {
      const identity = await api("/api/v1/auth/me");
      setMe(identity);

      // Strict role-based redirect
      if (!identity?.roles?.includes("DOCTOR") && !identity?.roles?.includes("ADMIN")) {
        if (identity?.roles?.includes("STAFF")) {
          router.replace("/staff");
        } else {
          router.replace("/patient");
        }
        return;
      }

      setDepartments(await api("/api/v1/departments"));
      await loadDoctor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session could not be loaded");
    }
  }

  async function loadDoctor() {
    try {
      const [profile, doctorSchedules, doctorAppointments] = await Promise.all([
        api("/api/v1/doctors/me/profile"),
        api("/api/v1/doctors/me/schedules"),
        api("/api/v1/doctors/me/appointments"),
      ]);
      setDoctorProfile(profile);
      setSchedules(doctorSchedules || []);
      setAppointments(doctorAppointments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load doctor workspace");
    }
  }

  async function addSchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const f = new FormData(e.currentTarget);
      await api("/api/v1/doctors/me/schedules", {
        method: "POST",
        body: JSON.stringify({
          dayOfWeek: Number(f.get("dayOfWeek")),
          startsAt: f.get("startsAt"),
          endsAt: f.get("endsAt"),
          slotDurationMinutes: Number(f.get("slotDurationMinutes")),
        }),
      });
      setNotice("Weekly schedule added successfully.");
      await loadDoctor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add schedule");
    }
  }

  async function transitionAppointment(id: string, status: string) {
    setError("");
    try {
      await api(`/api/v1/appointments/${id}/transition`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setNotice(`Appointment updated to ${status.replaceAll("_", " ").toLowerCase()}.`);
      await loadDoctor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update appointment");
    }
  }

  async function openDoctorReschedule(appt: Appointment) {
    setRescheduleAppointment(appt);
    setSelectedRescheduleSlot(null);
    setRescheduleReason("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setRescheduleDate(dateStr);
    await loadDoctorSlots(appt.doctorId || doctorProfile?.id, dateStr);
  }

  async function loadDoctorSlots(doctorId?: string, dateStr?: string) {
    const docId = doctorId || doctorProfile?.id;
    if (!docId || !dateStr) return;
    setLoadingSlots(true);
    setSelectedRescheduleSlot(null);
    try {
      const data = await api(`/api/v1/slots?doctorId=${docId}&date=${dateStr}`);
      setRescheduleSlots(data || []);
    } catch (e) {
      setRescheduleSlots([]);
      setError(e instanceof Error ? e.message : "Could not load slots for this date");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmDoctorReschedule() {
    if (!rescheduleAppointment || !selectedRescheduleSlot) return;
    setRescheduleBusy(true);
    setError("");
    try {
      await api(`/api/v1/appointments/${rescheduleAppointment.appointmentId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedRescheduleSlot.doctorId,
          startsAt: selectedRescheduleSlot.startsAt,
          endsAt: selectedRescheduleSlot.endsAt,
          reason: rescheduleReason.trim() || undefined,
        }),
      });
      setNotice(`Appointment rescheduled successfully to ${new Date(selectedRescheduleSlot.startsAt).toLocaleString()}!`);
      setRescheduleAppointment(null);
      await loadDoctor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reschedule appointment");
    } finally {
      setRescheduleBusy(false);
    }
  }

  const { t } = useLanguage();

  return (
    <main className="portal">
      <AppHeader
        user={me ? {
          userId: me.userId,
          fullName: doctorProfile?.fullName || me.email?.split("@")[0] || "Doctor",
          email: me.email,
          roles: me.roles || ["DOCTOR"],
        } : null}
        breadcrumbs={[{ label: "Doctor Portal", href: "/doctor" }]}
      />
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">Physician Clinical Workspace</p>
            <h1>Doctor Portal</h1>
          </div>
          <BackButton label={`← ${t.backHome}`} fallbackHref="/" />
        </div>

        {notice && (
          <div className="success" role="status" onClick={() => setNotice("")}>
            <span>✓ {notice}</span>
            <button
              type="button"
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setNotice("");
              }}
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="error" role="alert" onClick={() => setError("")}>
            <span>⚠️ {error}</span>
            <button
              type="button"
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setError("");
              }}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {!token ? (
          <p>Opening secure doctor session…</p>
        ) : (
          <>
            {doctorProfile && (
              <article className="doctor-profile-card">
                <div className="doctor-profile-avatar">
                  {doctorProfile.fullName
                    .replace(/^Dr\.\s*/i, "")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="doctor-profile-main">
                  <span className="doctor-label">Verified Medical Practitioner</span>
                  <h2>{doctorProfile.fullName}</h2>
                  <p>
                    {doctorProfile.specialization} · {doctorProfile.departmentName}
                  </p>
                </div>
                <dl className="doctor-profile-details">
                  <div>
                    <dt>Doctor ID</dt>
                    <dd>{doctorProfile.doctorNumber}</dd>
                  </div>
                  <div>
                    <dt>License number</dt>
                    <dd>{doctorProfile.licenseNumber}</dd>
                  </div>
                  <div>
                    <dt>Experience</dt>
                    <dd>{doctorProfile.experienceYears} years</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span className="status-pill active">
                        {doctorProfile.active ? "Active" : "Inactive"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </article>
            )}

            {/* WEEKLY AVAILABILITY SCHEDULES */}
            <form className="card form" onSubmit={addSchedule} style={{ marginTop: "1.5rem" }}>
              <h2>Configure weekly availability schedule</h2>
              <div className="form-grid">
                <label>
                  Day of week
                  <select name="dayOfWeek" defaultValue="1" required>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </label>
                <label>
                  Starts at
                  <input name="startsAt" type="time" defaultValue="09:00" required />
                </label>
                <label>
                  Ends at
                  <input name="endsAt" type="time" defaultValue="13:00" required />
                </label>
                <label>
                  Slot duration (minutes)
                  <input
                    name="slotDurationMinutes"
                    type="number"
                    min="5"
                    max="240"
                    defaultValue="30"
                    required
                  />
                </label>
              </div>
              <button>Add schedule block</button>
            </form>

            <section className="doctor-section" style={{ marginTop: "1.5rem" }}>
              <h2>Weekly availability hours</h2>
              <div className="list-grid">
                {schedules.map((s) => (
                  <article className="card" key={s.scheduleId}>
                    <h3>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][s.dayOfWeek - 1] || `Day ${s.dayOfWeek}`}
                    </h3>
                    <p>
                      {s.startsAt}–{s.endsAt} · {s.slotDurationMinutes} min consultations
                    </p>
                  </article>
                ))}
                {schedules.length === 0 && (
                  <p className="empty-result">No weekly schedule blocks defined yet.</p>
                )}
              </div>
            </section>

            {/* PATIENT APPOINTMENTS */}
            <section className="doctor-section" style={{ marginTop: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ margin: 0 }}>My Patient Appointments</h2>
                  <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                    Live clinical queue and scheduled patient consultations.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                  <span>Live Synchronized</span>
                </div>
              </div>

              <div className="list-grid appointment-grid">
                {appointments.map((a) => (
                  <article className="card appointment-card" key={a.appointmentId}>
                    <div className="appointment-card-header">
                      <div>
                        <span className="appointment-number">{a.appointmentNumber}</span>
                        <h3>{a.patientName}</h3>
                      </div>
                      <span className="status" style={{
                        background: a.status === "CONFIRMED" ? "#dcfce7" : a.status === "CHECKED_IN" ? "#e0f2fe" : a.status === "IN_PROGRESS" ? "#fef3c7" : a.status === "COMPLETED" ? "#f1f5f9" : undefined,
                        color: a.status === "CONFIRMED" ? "#166534" : a.status === "CHECKED_IN" ? "#0369a1" : a.status === "IN_PROGRESS" ? "#92400e" : undefined
                      }}>
                        {a.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <dl className="patient-details">
                      <div>
                        <dt>Patient ID</dt>
                        <dd>{a.patientNumber}</dd>
                      </div>
                      <div>
                        <dt>Appointment</dt>
                        <dd>{new Date(a.startsAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{a.patientPhone || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt>Blood group</dt>
                        <dd>{a.bloodGroup?.replace("_POSITIVE", "+").replace("_NEGATIVE", "-") || "Unknown"}</dd>
                      </div>
                    </dl>

                    {(a.allergies || a.medicalConditions) && (
                      <div className="clinical-notes" style={{ marginTop: "0.5rem" }}>
                        {a.allergies && (
                          <p><strong>Allergies:</strong> {a.allergies}</p>
                        )}
                        {a.medicalConditions && (
                          <p><strong>Conditions:</strong> {a.medicalConditions}</p>
                        )}
                      </div>
                    )}

                    {a.status === "NO_SHOW" && (
                      <div style={{ fontSize: "0.85rem", color: "#991b1b", marginTop: "0.5rem", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                        ⚠️ Patient marked as No-Show. Reschedule when ready.
                      </div>
                    )}

                    <div className="appointment-actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                      {a.status === "CONFIRMED" && (
                        <>
                          <button onClick={() => router.push(`/staff/consultation/${a.appointmentId}`)}>
                            Start consultation
                          </button>
                          <button
                            className="secondary-action"
                            onClick={() => transitionAppointment(a.appointmentId, "CHECKED_IN")}
                          >
                            Check in
                          </button>
                          <button
                            className="secondary-action"
                            style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                            onClick={() => transitionAppointment(a.appointmentId, "NO_SHOW")}
                          >
                            Mark No-Show
                          </button>
                        </>
                      )}
                      {a.status === "CHECKED_IN" && (
                        <button onClick={() => router.push(`/doctor/consultation/${a.appointmentId}`)}>
                          Start consultation
                        </button>
                      )}
                      {a.status === "IN_PROGRESS" && (
                        <button onClick={() => router.push(`/doctor/consultation/${a.appointmentId}`)}>
                          Continue consultation
                        </button>
                      )}
                      {a.status === "COMPLETED" && (
                        <button onClick={() => router.push(`/doctor/consultation/${a.appointmentId}`)}>
                          View consultation &amp; Rx
                        </button>
                      )}
                      {["CONFIRMED", "REQUESTED", "CHECKED_IN", "NO_SHOW"].includes(a.status) && (
                        <button
                          className="secondary-action"
                          onClick={() => openDoctorReschedule(a)}
                        >
                          🕒 Reschedule
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {appointments.length === 0 && (
                  <p className="empty-result">No patient appointments are scheduled.</p>
                )}
              </div>
            </section>
          </>
        )}

        <div className="actions" style={{ marginTop: "2rem" }}>
          <Link className="secondary" href="/">
            Back home
          </Link>
        </div>
      </section>

      {/* RESCHEDULE MODAL */}
      {rescheduleAppointment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
          onClick={() => {
            if (!rescheduleBusy) setRescheduleAppointment(null);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.35rem", color: "#1e293b" }}>
                  Reschedule Appointment
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref: <strong>{rescheduleAppointment.appointmentNumber}</strong> · Patient: {rescheduleAppointment.patientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleAppointment(null)}
                disabled={rescheduleBusy}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Target Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadDoctorSlots(rescheduleAppointment.doctorId || doctorProfile?.id, e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Available Time Slots
              </label>
              {loadingSlots ? (
                <p style={{ fontSize: "0.9rem", color: "#64748b", padding: "0.5rem 0" }}>Loading slots...</p>
              ) : rescheduleSlots.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px" }}>
                  No available slots for this date.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
                  {rescheduleSlots.map((s) => {
                    const isSelected = selectedRescheduleSlot?.startsAt === s.startsAt;
                    return (
                      <button
                        key={s.startsAt}
                        type="button"
                        onClick={() => setSelectedRescheduleSlot(s)}
                        style={{
                          padding: "0.5rem",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "8px",
                          background: isSelected ? "#eff6ff" : "#f8fafc",
                          color: isSelected ? "#1d4ed8" : "#334155",
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        {new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Reason for Rescheduling
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Patient requested schedule shift"
                rows={2}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary"
                disabled={rescheduleBusy}
                onClick={() => setRescheduleAppointment(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedRescheduleSlot || rescheduleBusy}
                onClick={confirmDoctorReschedule}
              >
                {rescheduleBusy ? "Securing new slot..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
