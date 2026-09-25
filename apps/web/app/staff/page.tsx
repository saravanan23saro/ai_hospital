"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, loadSession, sessionFetch } from "../lib/session";
import AppHeader from "../components/Header";
import { Language, useLanguage } from "../lib/i18n";
import BackButton from "../components/BackButton";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
const SPECIALIZATIONS = [
  "Anesthesiology",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Gastroenterology",
  "General Surgery",
  "Internal Medicine",
  "Neurology",
  "Obstetrics and Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology (ENT)",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
] as const;
type Me = { email: string; roles: string[] };
type Department = { departmentId: string; name: string };
type DoctorProfile = {
  doctorNumber: string;
  fullName: string;
  specialization: string;
  departmentName: string;
  licenseNumber: string;
  experienceYears: number;
  verificationStatus: string;
  active: boolean;
};
type Application = {
  applicationId: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
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
  patientNumber: string;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth: string;
  patientGender: string;
  bloodGroup: string;
  allergies?: string;
  medicalConditions?: string;
  startsAt: string;
  endsAt: string;
  status: string;
};
export default function StaffPortal() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null,
  );
  const [applications, setApplications] = useState<Application[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  useEffect(() => {
    if (loadSession()) setToken("authenticated");
    else router.replace("/");
  }, [router]);
  useEffect(() => {
    if (token) loadIdentity();
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
      if (!identity?.roles?.includes("DOCTOR") && !identity?.roles?.includes("STAFF") && !identity?.roles?.includes("ADMIN")) {
        router.replace("/patient");
        return;
      }
      setDepartments(await api("/api/v1/departments"));
      if (identity.roles.includes("DOCTOR")) await loadDoctor();
      if (identity.roles.includes("ADMIN")) await loadAdmin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session could not be loaded");
    }
  }
  function logout() {
    clearStoredSession();
    setToken("");
    setMe(null);
    router.replace("/");
  }
  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const f = new FormData(e.currentTarget);
      await api("/api/v1/doctors/applications", {
        method: "POST",
        body: JSON.stringify({
          fullName: f.get("fullName"),
          specialization: f.get("specialization"),
          departmentId: f.get("departmentId"),
          qualifications: f.get("qualifications"),
          experienceYears: Number(f.get("experienceYears")),
          licenseNumber: f.get("licenseNumber"),
        }),
      });
      setNotice("Doctor application submitted for administrator review.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Application failed");
    }
  }
  async function loadAdmin() {
    try {
      setApplications(await api("/api/v1/admin/doctor-applications"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications");
    }
  }
  async function review(id: string, decision: string) {
    try {
      await api(`/api/v1/admin/doctor-applications/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      setNotice(`Application ${decision.toLowerCase()}d.`);
      await loadAdmin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
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
      setSchedules(doctorSchedules);
      setAppointments(doctorAppointments);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load doctor workspace",
      );
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
      setNotice("Schedule added.");
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
      setNotice(
        `Appointment updated to ${status.replaceAll("_", " ").toLowerCase()}.`,
      );
      await loadDoctor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update appointment");
    }
  }
  const { lang, t } = useLanguage();

  return (
    <main className="portal" style={{ paddingTop: "84px" }}>
      <AppHeader
        user={{
          fullName: doctorProfile?.fullName || me?.email?.split("@")[0] || "Staff Member",
          email: me?.email,
          roles: me?.roles || ["STAFF"],
        }}
        breadcrumbs={[{ label: t.staffWorkspace, href: "/staff" }]}
      />
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">{t.clinicalOperations}</p>
            <h1>{t.staffWorkspaceTitle}</h1>
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
          <p>Opening secure sign in…</p>
        ) : (
          <>
            {(me?.roles.includes("ADMIN") || me?.roles.includes("DOCTOR")) && (
              <div className="workspace-nav">
                {me?.roles.includes("ADMIN") && (
                  <button onClick={loadAdmin}>Doctor approvals</button>
                )}
                {me?.roles.includes("DOCTOR") && (
                  <button onClick={loadDoctor}>Refresh doctor data</button>
                )}
              </div>
            )}
            {!me?.roles.includes("DOCTOR") && !me?.roles.includes("ADMIN") && (
              <form className="card form wide-form" onSubmit={apply}>
                <h2>Apply as a doctor</h2>
                <div className="form-grid">
                  <label>
                    Full name
                    <input name="fullName" required />
                  </label>
                  <label>
                    Specialization
                    <select name="specialization" defaultValue="" required>
                      <option value="" disabled>
                        Select specialization
                      </option>
                      {SPECIALIZATIONS.map((specialization) => (
                        <option key={specialization} value={specialization}>
                          {specialization}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Department
                    <select name="departmentId" required>
                      {departments.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Experience years
                    <input
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="80"
                      required
                    />
                  </label>
                  <label>
                    License number
                    <input name="licenseNumber" required />
                  </label>
                </div>
                <label>
                  Qualifications
                  <textarea name="qualifications" required />
                </label>
                <button>Submit application</button>
              </form>
            )}
            {me?.roles.includes("ADMIN") && (
              <div className="list-grid">
                {applications.map((a) => (
                  <article className="card" key={a.applicationId}>
                    <h3>{a.fullName}</h3>
                    <p>
                      {a.specialization} · {a.experienceYears} years
                    </p>
                    <p>License: {a.licenseNumber}</p>
                    <div className="button-grid">
                      <button
                        onClick={() => review(a.applicationId, "APPROVE")}
                      >
                        Approve
                      </button>
                      <button
                        className="destructive-action"
                        onClick={() => review(a.applicationId, "REJECT")}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {me?.roles.includes("DOCTOR") && (
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
                      <span className="doctor-label">Doctor profile</span>
                      <h2>{doctorProfile.fullName}</h2>
                      <p>
                        {doctorProfile.specialization} ·{" "}
                        {doctorProfile.departmentName}
                      </p>
                    </div>
                    <dl className="doctor-profile-details">
                      <div>
                        <dt>Doctor ID</dt>
                        <dd>{doctorProfile.doctorNumber}</dd>
                      </div>
                      <div>
                        <dt>License</dt>
                        <dd>{doctorProfile.licenseNumber}</dd>
                      </div>
                      <div>
                        <dt>Experience</dt>
                        <dd>{doctorProfile.experienceYears} years</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span className="status">
                            {doctorProfile.active
                              ? "ACTIVE"
                              : doctorProfile.verificationStatus}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </article>
                )}
                <form className="card form" onSubmit={addSchedule}>
                  <h2>Add weekly availability</h2>
                  <div className="form-grid">
                    <label>
                      Day
                      <select name="dayOfWeek">
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="7">Sunday</option>
                      </select>
                    </label>
                    <label>
                      Starts
                      <input name="startsAt" type="time" required />
                    </label>
                    <label>
                      Ends
                      <input name="endsAt" type="time" required />
                    </label>
                    <label>
                      Slot minutes
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
                  <button>Add schedule</button>
                </form>
                <section className="doctor-section">
                  <h2>Weekly availability</h2>
                  <div className="list-grid">
                    {schedules.map((s) => (
                      <article className="card" key={s.scheduleId}>
                        <h3>Day {s.dayOfWeek}</h3>
                        <p>
                          {s.startsAt}–{s.endsAt} · {s.slotDurationMinutes} min
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="doctor-section">
                  <h2>My patient appointments</h2>
                  <div className="list-grid appointment-grid">
                    {appointments.map((a) => (
                      <article
                        className="card appointment-card"
                        key={a.appointmentId}
                      >
                        <div className="appointment-card-header">
                          <div>
                            <span className="appointment-number">
                              {a.appointmentNumber}
                            </span>
                            <h3>{a.patientName}</h3>
                          </div>
                          <span className="status">
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
                            <dd>{a.patientPhone}</dd>
                          </div>
                          <div>
                            <dt>Date of birth</dt>
                            <dd>{a.patientDateOfBirth || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt>Gender</dt>
                            <dd>
                              {a.patientGender?.replaceAll("_", " ") ||
                                "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt>Blood group</dt>
                            <dd>
                              {a.bloodGroup
                                ?.replace("_POSITIVE", "+")
                                .replace("_NEGATIVE", "-") || "Unknown"}
                            </dd>
                          </div>
                        </dl>
                        {(a.allergies || a.medicalConditions) && (
                          <div className="clinical-notes">
                            {a.allergies && (
                              <p>
                                <strong>Allergies:</strong> {a.allergies}
                              </p>
                            )}
                            {a.medicalConditions && (
                              <p>
                                <strong>Medical conditions:</strong>{" "}
                                {a.medicalConditions}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="appointment-actions">
                          {a.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/staff/consultation/${a.appointmentId}`
                                  )
                                }
                              >
                                Start consultation
                              </button>
                              <button
                                className="secondary-action"
                                onClick={() =>
                                  transitionAppointment(
                                    a.appointmentId,
                                    "CHECKED_IN",
                                  )
                                }
                              >
                                Check in
                              </button>
                            </>
                          )}
                          {a.status === "CHECKED_IN" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/staff/consultation/${a.appointmentId}`
                                )
                              }
                            >
                              Start consultation
                            </button>
                          )}
                          {a.status === "IN_PROGRESS" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/staff/consultation/${a.appointmentId}`
                                )
                              }
                            >
                              Continue consultation
                            </button>
                          )}
                          {a.status === "COMPLETED" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/staff/consultation/${a.appointmentId}`
                                )
                              }
                            >
                              View consultation & Rx
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {appointments.length === 0 && (
                      <p className="empty-result">
                        No patient appointments are assigned to you.
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
        <div className="actions">
          <Link className="secondary" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
