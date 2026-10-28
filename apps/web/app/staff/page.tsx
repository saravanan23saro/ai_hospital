"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, loadSession, sessionFetch } from "../lib/session";
import AppHeader from "../components/Header";
import { useLanguage } from "../lib/i18n";
import BackButton from "../components/BackButton";

import { API } from "../lib/api";

type Me = { userId?: string; email: string; roles: string[] };
type Department = { departmentId: string; name: string };

type StaffProfile = {
  staffId: string;
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  departmentId?: string;
  departmentName: string;
  staffType: string;
  designation: string;
  joiningDate?: string;
  active: boolean;
};

type Appointment = {
  appointmentId: string;
  appointmentNumber: string;
  patientNumber?: string;
  patientName?: string;
  patientPhone?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  cancellationReason?: string;
};

type LabOrder = {
  lab_order_id: string;
  patient_name?: string;
  patient_number?: string;
  test_code: string;
  test_name?: string;
  category: string;
  priority: string;
  status: string;
  result_summary?: string;
  result_flag?: string;
  created_at: string;
};

type Invoice = {
  invoice_id: string;
  patient_name?: string;
  amount_minor: number;
  status: string;
  created_at: string;
  items?: Array<{ description: string; quantity: number; unitPriceMinor: number }>;
};

type EmergencyCase = {
  emergency_case_id: string;
  patient_name?: string;
  patient_number?: string;
  acuity: number;
  status: string;
  presenting_complaint: string;
  bed_number?: string;
  doctor_name?: string;
  opened_at: string;
};

type NotificationItem = {
  notificationId: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

const JOB_TYPE_LABELS: Record<string, string> = {
  RECEPTIONIST: "Receptionist / Front Desk Staff",
  APPOINTMENT_COORDINATOR: "Appointment Coordinator",
  NURSE: "Nurse / Clinical Support Staff",
  LAB_TECHNICIAN: "Laboratory Technician",
  BILLING: "Billing Staff",
  EMERGENCY: "Emergency / Triage Staff",
  OPERATIONS: "Hospital Operations Staff",
  ADMINISTRATIVE: "Hospital Operations Staff",
  PHARMACIST: "Pharmacy Staff",
  GENERAL: "Hospital Support Staff",
};

export default function StaffPortal() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  // Navigation tabs based on staff type
  const [activeTab, setActiveTab] = useState<
    "appointments" | "register-patient" | "directory" | "lab" | "billing" | "emergency" | "tasks"
  >("appointments");

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals & Action States
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<any | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  type StaffDoctor = {
    doctorId: string;
    fullName: string;
    specialization: string;
    departmentId: string;
    departmentName: string;
    consultationFee?: number;
    active: boolean;
  };

  const [doctorsList, setDoctorsList] = useState<StaffDoctor[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookPatientId, setBookPatientId] = useState("");
  const [bookPatientName, setBookPatientName] = useState("");
  const [bookDoctorId, setBookDoctorId] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookSlots, setBookSlots] = useState<any[]>([]);
  const [selectedBookSlot, setSelectedBookSlot] = useState<any | null>(null);
  const [loadingBookSlots, setLoadingBookSlots] = useState(false);

  // Lab Result Modal
  const [selectedLabOrder, setSelectedLabOrder] = useState<LabOrder | null>(null);
  const [labResultSummary, setLabResultSummary] = useState("");
  const [labResultFlag, setLabResultFlag] = useState("NORMAL");
  const [labRefRange, setLabRefRange] = useState("");
  const [labUnit, setLabUnit] = useState("");

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
        loadStaffAppointments();
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
      if (!identity?.roles?.includes("STAFF") && !identity?.roles?.includes("ADMIN")) {
        if (identity?.roles?.includes("DOCTOR")) {
          router.replace("/doctor");
        } else {
          router.replace("/patient");
        }
        return;
      }

      const [staffProfile, depts, docs] = await Promise.all([
        api("/api/v1/staff/me").catch(() => null),
        api("/api/v1/departments").catch(() => []),
        api("/api/v1/staff/doctors").catch(() => []),
      ]);

      if (staffProfile) {
        setProfile(staffProfile);
        // Default tab based on staff type
        const type = (staffProfile.staffType || "").toUpperCase();
        if (type === "LAB_TECHNICIAN") setActiveTab("lab");
        else if (type === "BILLING") setActiveTab("billing");
        else if (type === "EMERGENCY") setActiveTab("emergency");
        else setActiveTab("appointments");
      }

      setDepartments(depts || []);
      setDoctorsList(docs || []);
      await Promise.all([
        loadStaffAppointments(),
        loadNotifications(),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff profile");
    }
  }

  async function loadStaffAppointments() {
    try {
      const data = await api("/api/v1/appointments");
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal
    }
  }

  async function loadNotifications() {
    try {
      const data = await api("/api/v1/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal
    }
  }

  async function loadLabOrders() {
    try {
      const data = await api("/api/v1/operations/lab-orders");
      setLabOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load laboratory orders");
    }
  }

  async function loadInvoices() {
    try {
      const data = await api("/api/v1/operations/invoices");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invoices");
    }
  }

  async function loadEmergencyCases() {
    try {
      const data = await api("/api/v1/operations/emergency-cases");
      setEmergencyCases(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load emergency cases");
    }
  }

  // Handle Tab Switching
  function switchTab(tab: typeof activeTab) {
    setActiveTab(tab);
    setError("");
    setNotice("");
    if (tab === "appointments") loadStaffAppointments();
    else if (tab === "directory") searchPatients(patientSearch);
    else if (tab === "lab") loadLabOrders();
    else if (tab === "billing") loadInvoices();
    else if (tab === "emergency") loadEmergencyCases();
    else if (tab === "tasks") loadNotifications();
  }

  // Walk-in Patient Registration
  async function handleRegisterWalkInPatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const result = await api("/api/v1/staff/patients", {
        method: "POST",
        body: JSON.stringify({
          fullName: f.get("fullName"),
          email: f.get("email"),
          password: f.get("password") || "CareFlow2026!",
          phone: f.get("phone") || null,
          gender: f.get("gender") || "OTHER",
          dateOfBirth: f.get("dateOfBirth") || null,
          address: f.get("address") || "",
          emergencyContact: f.get("emergencyContact") || "",
          bloodGroup: f.get("bloodGroup") || "UNKNOWN",
          allergies: f.get("allergies") || "",
          medicalConditions: f.get("medicalConditions") || "",
        }),
      });
      setNotice(`Patient registered successfully! Patient ID: ${result.patientNumber}`);
      (e.target as HTMLFormElement).reset();
      setActiveTab("directory");
      setPatientSearch(result.fullName);
      searchPatients(result.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register patient");
    } finally {
      setActionBusy(false);
    }
  }

  // Search Assigned Patients
  async function searchPatients(query: string) {
    setPatientSearch(query);
    try {
      const path = query.trim()
        ? `/api/v1/staff/patients?query=${encodeURIComponent(query.trim())}`
        : "/api/v1/staff/patients";
      const results = await api(path);
      setPatientResults(Array.isArray(results) ? results : []);
    } catch {
      setPatientResults([]);
    }
  }

  // Reschedule Handlers
  async function openReschedule(appt: Appointment) {
    setRescheduleAppointment(appt);
    setSelectedRescheduleSlot(null);
    setRescheduleReason("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setRescheduleDate(dateStr);
    await loadSlotsForDoctor(appt.doctorId, dateStr);
  }

  async function loadSlotsForDoctor(doctorId?: string, dateStr?: string) {
    if (!doctorId || !dateStr) return;
    setLoadingSlots(true);
    setSelectedRescheduleSlot(null);
    try {
      const data = await api(`/api/v1/slots?doctorId=${doctorId}&date=${dateStr}`);
      setRescheduleSlots(data || []);
    } catch {
      setRescheduleSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmReschedule() {
    if (!rescheduleAppointment || !selectedRescheduleSlot) return;
    setActionBusy(true);
    setError("");
    try {
      await api(`/api/v1/appointments/${rescheduleAppointment.appointmentId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedRescheduleSlot.doctorId,
          startsAt: selectedRescheduleSlot.startsAt,
          endsAt: selectedRescheduleSlot.endsAt,
          reason: rescheduleReason.trim() || "Rescheduled by Hospital Staff",
        }),
      });
      setNotice(`Appointment rescheduled successfully to ${new Date(selectedRescheduleSlot.startsAt).toLocaleString()}!`);
      setRescheduleAppointment(null);
      await loadStaffAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reschedule appointment");
    } finally {
      setActionBusy(false);
    }
  }

  // Cancel Appointment Handler
  async function handleCancelAppointment(appointmentId: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setActionBusy(true);
    setError("");
    try {
      await api(`/api/v1/appointments/${appointmentId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled by Staff Member upon patient request" }),
      });
      setNotice("Appointment cancelled successfully and slot restored to availability.");
      await loadStaffAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel appointment");
    } finally {
      setActionBusy(false);
    }
  }

  // Book Appointment Handlers for Staff
  async function openStaffBooking(patientId?: string, patientName?: string) {
    setBookPatientId(patientId || "");
    setBookPatientName(patientName || "");
    const firstDoc = doctorsList[0]?.doctorId || "";
    setBookDoctorId(firstDoc);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setBookDate(dateStr);
    setSelectedBookSlot(null);
    setBookingModalOpen(true);
    if (firstDoc) {
      await loadBookingSlots(firstDoc, dateStr);
    }
  }

  async function loadBookingSlots(doctorId: string, dateStr: string) {
    if (!doctorId || !dateStr) return;
    setLoadingBookSlots(true);
    setSelectedBookSlot(null);
    try {
      const data = await api(`/api/v1/slots?doctorId=${doctorId}&date=${dateStr}`);
      setBookSlots(Array.isArray(data) ? data : []);
    } catch {
      setBookSlots([]);
    } finally {
      setLoadingBookSlots(false);
    }
  }

  async function handleConfirmStaffBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bookPatientId || !selectedBookSlot) {
      setError("Please select both a patient and an available slot.");
      return;
    }
    setActionBusy(true);
    setError("");
    try {
      const appt = await api("/api/v1/staff/appointments/book", {
        method: "POST",
        body: JSON.stringify({
          patientId: bookPatientId,
          doctorId: selectedBookSlot.doctorId,
          startsAt: selectedBookSlot.startsAt,
          endsAt: selectedBookSlot.endsAt,
        }),
      });
      setNotice(`Appointment booked successfully! Reference: ${appt.appointmentNumber}`);
      setBookingModalOpen(false);
      await loadStaffAppointments();
      setActiveTab("appointments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setActionBusy(false);
    }
  }

  // Save Lab Result
  async function handleSaveLabResult(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedLabOrder) return;
    setActionBusy(true);
    setError("");
    try {
      await api(`/api/v1/operations/lab-orders/${selectedLabOrder.lab_order_id}/result`, {
        method: "PATCH",
        body: JSON.stringify({
          resultSummary: labResultSummary,
          resultFlag: labResultFlag,
          referenceRange: labRefRange,
          unit: labUnit,
          technicianName: profile?.fullName || "Staff Technician",
        }),
      });
      setNotice(`Result recorded for test ${selectedLabOrder.test_code}.`);
      setSelectedLabOrder(null);
      await loadLabOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record lab result");
    } finally {
      setActionBusy(false);
    }
  }

  const { t } = useLanguage();
  const staffRoleType = (profile?.staffType || "OPERATIONS").toUpperCase();

  // Determine authorized tabs for the logged-in staff member
  const canAccessAppointments = ["RECEPTIONIST", "APPOINTMENT_COORDINATOR", "NURSE", "OPERATIONS", "ADMINISTRATIVE", "ADMIN"].includes(staffRoleType) || me?.roles?.includes("ADMIN");
  const canAccessPatientRegistration = ["RECEPTIONIST", "APPOINTMENT_COORDINATOR", "OPERATIONS", "ADMINISTRATIVE", "ADMIN"].includes(staffRoleType) || me?.roles?.includes("ADMIN");
  const canAccessLab = ["LAB_TECHNICIAN", "OPERATIONS", "ADMIN"].includes(staffRoleType) || me?.roles?.includes("ADMIN");
  const canAccessBilling = ["BILLING", "RECEPTIONIST", "OPERATIONS", "ADMIN"].includes(staffRoleType) || me?.roles?.includes("ADMIN");
  const canAccessEmergency = ["EMERGENCY", "NURSE", "OPERATIONS", "ADMIN"].includes(staffRoleType) || me?.roles?.includes("ADMIN");

  return (
    <main className="portal">
      <AppHeader
        user={me ? {
          userId: me.userId,
          fullName: profile?.fullName || me.email?.split("@")[0] || "Staff Member",
          email: me.email,
          roles: me.roles || ["STAFF"],
        } : null}
        breadcrumbs={[{ label: "Staff Portal", href: "/staff" }]}
      />
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">Hospital Operations &amp; Clinical Support</p>
            <h1>Staff Portal</h1>
          </div>
          <BackButton label={`← ${t.backHome}`} fallbackHref="/" />
        </div>

        {notice && (
          <div className="success" role="status" onClick={() => setNotice("")}>
            <span>✓ {notice}</span>
            <button
              type="button"
              className="toast-close"
              onClick={(e) => { e.stopPropagation(); setNotice(""); }}
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
              onClick={(e) => { e.stopPropagation(); setError(""); }}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {!token ? (
          <p>Opening secure staff workspace…</p>
        ) : (
          <>
            {/* STAFF PROFILE BANNER */}
            <article className="doctor-profile-card" style={{ marginBottom: "1.5rem" }}>
              <div className="doctor-profile-avatar" style={{ background: "#475569" }}>
                {(profile?.fullName || "Staff").charAt(0).toUpperCase()}
              </div>
              <div className="doctor-profile-main">
                <span className="doctor-label" style={{ background: "#e2e8f0", color: "#334155" }}>
                  Authorized Hospital Staff
                </span>
                <h2>{profile?.fullName || me?.email?.split("@")[0]}</h2>
                <p>
                  <strong>{JOB_TYPE_LABELS[staffRoleType] || staffRoleType}</strong> · {profile?.departmentName || "General Operations"}
                </p>
              </div>
              <dl className="doctor-profile-details">
                <div>
                  <dt>Employee ID</dt>
                  <dd style={{ fontWeight: 600 }}>{profile?.employeeId || "STF-CAREFLOW"}</dd>
                </div>
                <div>
                  <dt>Designation</dt>
                  <dd>{profile?.designation || "Staff Member"}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{profile?.departmentName || "General"}</dd>
                </div>
                <div>
                  <dt>Assigned Scope</dt>
                  <dd style={{ fontWeight: 600, color: "#166534" }}>
                    {doctorsList.length} Assigned {doctorsList.length === 1 ? "Doctor" : "Doctors"}
                  </dd>
                </div>
                <div>
                  <dt>Account Status</dt>
                  <dd>
                    <span className="status-pill active">
                      {profile?.active !== false ? "Active Staff" : "Inactive"}
                    </span>
                  </dd>
                </div>
              </dl>
            </article>

            {/* AUTHORIZED MODULE TABS */}
            <div className="workspace-nav" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {canAccessAppointments && (
                <button
                  type="button"
                  className={activeTab === "appointments" ? "active-tab-btn active" : ""}
                  onClick={() => switchTab("appointments")}
                >
                  📅 Hospital Appointments
                </button>
              )}
              {canAccessPatientRegistration && (
                <button
                  type="button"
                  className={activeTab === "register-patient" ? "active-tab-btn active" : ""}
                  onClick={() => switchTab("register-patient")}
                >
                  ➕ Register Walk-in Patient
                </button>
              )}
              <button
                type="button"
                className={activeTab === "directory" ? "active-tab-btn active" : ""}
                onClick={() => switchTab("directory")}
              >
                🔍 Patient Directory Search
              </button>
              {canAccessLab && (
                <button
                  type="button"
                  className={activeTab === "lab" ? "active-tab-btn active" : ""}
                  onClick={() => switchTab("lab")}
                >
                  🔬 Laboratory Management
                </button>
              )}
              {canAccessBilling && (
                <button
                  type="button"
                  className={activeTab === "billing" ? "active-tab-btn active" : ""}
                  onClick={() => switchTab("billing")}
                >
                  💳 Invoices &amp; Billing
                </button>
              )}
              {canAccessEmergency && (
                <button
                  type="button"
                  className={activeTab === "emergency" ? "active-tab-btn active" : ""}
                  onClick={() => switchTab("emergency")}
                >
                  🚨 Emergency &amp; Triage
                </button>
              )}
              <button
                type="button"
                className={activeTab === "tasks" ? "active-tab-btn active" : ""}
                onClick={() => switchTab("tasks")}
              >
                🔔 Staff Tasks &amp; Notifications
              </button>
            </div>

            {/* TAB 1: APPOINTMENTS & SCHEDULE MANAGEMENT */}
            {activeTab === "appointments" && canAccessAppointments && (
              <section className="doctor-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Assigned Appointments Schedule</h2>
                    <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                      Showing appointments for doctors assigned to your department ({profile?.departmentName || "General"}).
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                      <span>Live Synchronized</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openStaffBooking()}
                      style={{
                        background: "#A67C52",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      ➕ Book Appointment
                    </button>
                  </div>
                </div>

                <div className="list-grid appointment-grid">
                  {appointments.map((a) => (
                    <article className="card appointment-card" key={a.appointmentId}>
                      <div className="appointment-card-header">
                        <div>
                          <span className="appointment-number">{a.appointmentNumber}</span>
                          <h3>{a.doctorName || "Assigned Doctor"}</h3>
                          {a.specialization && (
                            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{a.specialization}</span>
                          )}
                        </div>
                        <span className="status" style={{
                          background: a.status === "CANCELLED" ? "#fee2e2" : a.status === "CONFIRMED" ? "#dcfce7" : a.status === "RESCHEDULED" ? "#fef3c7" : undefined,
                          color: a.status === "CANCELLED" ? "#991b1b" : a.status === "CONFIRMED" ? "#166534" : a.status === "RESCHEDULED" ? "#92400e" : undefined
                        }}>
                          {a.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <dl className="patient-details" style={{ marginTop: "0.75rem" }}>
                        <div>
                          <dt>Appointment Date &amp; Time</dt>
                          <dd style={{ fontWeight: 600 }}>{new Date(a.startsAt).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt>Duration</dt>
                          <dd>{Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000)} mins</dd>
                        </div>
                      </dl>

                      {a.cancellationReason && a.status === "CANCELLED" && (
                        <div style={{ fontSize: "0.85rem", color: "#991b1b", marginTop: "0.5rem", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                          <strong>Cancellation Reason:</strong> {a.cancellationReason}
                        </div>
                      )}

                      {["CONFIRMED", "REQUESTED", "CHECKED_IN", "NO_SHOW"].includes(a.status) && (
                        <div className="appointment-actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            className="secondary-action"
                            onClick={() => openReschedule(a)}
                          >
                            🕒 Reschedule
                          </button>
                          <button
                            type="button"
                            className="secondary-action"
                            style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                            onClick={() => handleCancelAppointment(a.appointmentId)}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                  {appointments.length === 0 && (
                    <p className="empty-result">No appointments found in hospital schedule.</p>
                  )}
                </div>
              </section>
            )}

            {/* TAB 2: REGISTER WALK-IN PATIENT */}
            {activeTab === "register-patient" && canAccessPatientRegistration && (
              <form className="card form wide-form" onSubmit={handleRegisterWalkInPatient}>
                <h2>Register New Walk-in Patient</h2>
                <p className="muted" style={{ marginBottom: "1rem" }}>
                  Create an official patient medical record and issue their unique CareFlow Patient Number (PAT-XXXX).
                </p>
                <div className="form-grid">
                  <label>
                    Patient Full Name *
                    <input name="fullName" required placeholder="e.g. Ramesh Kumar" />
                  </label>
                  <label>
                    Email Address *
                    <input name="email" type="email" required placeholder="patient@example.com" />
                  </label>
                  <label>
                    Phone Number
                    <input name="phone" placeholder="+919876543210" />
                  </label>
                  <label>
                    Gender
                    <select name="gender" defaultValue="OTHER">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label>
                    Date of Birth
                    <input name="dateOfBirth" type="date" />
                  </label>
                  <label>
                    Blood Group
                    <select name="bloodGroup" defaultValue="UNKNOWN">
                      <option value="UNKNOWN">Unknown</option>
                      <option value="A_POSITIVE">A+</option>
                      <option value="A_NEGATIVE">A-</option>
                      <option value="B_POSITIVE">B+</option>
                      <option value="B_NEGATIVE">B-</option>
                      <option value="O_POSITIVE">O+</option>
                      <option value="O_NEGATIVE">O-</option>
                      <option value="AB_POSITIVE">AB+</option>
                      <option value="AB_NEGATIVE">AB-</option>
                    </select>
                  </label>
                  <label>
                    Residential Address
                    <input name="address" placeholder="City, Street" />
                  </label>
                  <label>
                    Emergency Contact
                    <input name="emergencyContact" placeholder="Contact Name &amp; Phone" />
                  </label>
                </div>
                <div className="form-grid" style={{ marginTop: "0.5rem" }}>
                  <label>
                    Known Allergies
                    <input name="allergies" placeholder="e.g. Penicillin, Peanuts" />
                  </label>
                  <label>
                    Existing Medical Conditions
                    <input name="medicalConditions" placeholder="e.g. Hypertension, Diabetes" />
                  </label>
                </div>
                <button type="submit" disabled={actionBusy} style={{ marginTop: "1rem" }}>
                  {actionBusy ? "Registering Patient..." : "Register Patient & Create Record"}
                </button>
              </form>
            )}

            {/* TAB 3: PATIENT DIRECTORY & QUICK SEARCH */}
            {activeTab === "directory" && (
              <section className="doctor-section">
                <h2>Assigned Patient Directory</h2>
                <p style={{ margin: "0.25rem 0 1rem", color: "#64748b", fontSize: "0.9rem" }}>
                  Showing patients assigned to your department ({profile?.departmentName || "General"}).
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => searchPatients(e.target.value)}
                    placeholder="Search by assigned patient name, phone number, or patient ID..."
                    style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                  />
                </div>
                <div className="list-grid">
                  {patientResults.map((p) => {
                    const pid = p.patientId || p.patient_id;
                    const pnum = p.patientNumber || p.patient_number;
                    const pname = p.fullName || p.full_name;
                    const pdob = p.dateOfBirth || p.date_of_birth;
                    return (
                      <article className="card" key={pid}>
                        <span className="eyebrow">{pnum}</span>
                        <h3 style={{ margin: "0.25rem 0" }}>{pname}</h3>
                        <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#64748b" }}>
                          Phone: <strong>{p.phone || "Not provided"}</strong> · Gender: {p.gender || "N/A"}
                        </p>
                        {pdob && (
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                            DOB: {pdob}
                          </p>
                        )}
                        <button
                          type="button"
                          className="secondary-action"
                          style={{ marginTop: "0.75rem", fontSize: "0.85rem", width: "100%" }}
                          onClick={() => openStaffBooking(pid, pname)}
                        >
                          📅 Book Appointment
                        </button>
                      </article>
                    );
                  })}
                  {patientSearch && patientResults.length === 0 && (
                    <p className="empty-result">No assigned patient records found matching "{patientSearch}".</p>
                  )}
                  {!patientSearch && patientResults.length === 0 && (
                    <p className="empty-result">No patients currently assigned to your department.</p>
                  )}
                </div>
              </section>
            )}

            {/* TAB 4: LABORATORY MANAGEMENT */}
            {activeTab === "lab" && canAccessLab && (
              <section className="doctor-section">
                <h2>Laboratory Test Orders &amp; Results</h2>
                <div className="list-grid">
                  {labOrders.map((ord) => (
                    <article className="card" key={ord.lab_order_id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span className="eyebrow">{ord.category}</span>
                          <h3>{ord.test_name || ord.test_code}</h3>
                          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0" }}>
                            Patient: <strong>{ord.patient_name || "Patient"}</strong> ({ord.patient_number})
                          </p>
                        </div>
                        <span className="status-pill active">{ord.status}</span>
                      </div>
                      {ord.result_summary && (
                        <div style={{ margin: "0.5rem 0", padding: "8px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.85rem" }}>
                          <strong>Result:</strong> {ord.result_summary}
                          {ord.result_flag && <span> · Flag: <strong>{ord.result_flag}</strong></span>}
                        </div>
                      )}
                      {ord.status !== "COMPLETED" && (
                        <button
                          type="button"
                          className="secondary-action"
                          style={{ marginTop: "0.5rem" }}
                          onClick={() => {
                            setSelectedLabOrder(ord);
                            setLabResultSummary(ord.result_summary || "");
                            setLabResultFlag(ord.result_flag || "NORMAL");
                          }}
                        >
                          📝 Record / Complete Test Result
                        </button>
                      )}
                    </article>
                  ))}
                  {labOrders.length === 0 && (
                    <p className="empty-result">No pending laboratory orders found.</p>
                  )}
                </div>
              </section>
            )}

            {/* TAB 5: BILLING & INVOICING */}
            {activeTab === "billing" && canAccessBilling && (
              <section className="doctor-section">
                <h2>Hospital Billing &amp; Invoices</h2>
                <div className="list-grid">
                  {invoices.map((inv) => (
                    <article className="card" key={inv.invoice_id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span className="eyebrow">INVOICE #{inv.invoice_id.substring(0, 8).toUpperCase()}</span>
                          <h3>₹{(inv.amount_minor || 0) / 100}</h3>
                          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0" }}>
                            Patient: <strong>{inv.patient_name || "Patient Record"}</strong>
                          </p>
                        </div>
                        <span className="status" style={{
                          background: inv.status === "PAID" ? "#dcfce7" : "#fef3c7",
                          color: inv.status === "PAID" ? "#166534" : "#92400e"
                        }}>
                          {inv.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0" }}>
                        Date: {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </article>
                  ))}
                  {invoices.length === 0 && (
                    <p className="empty-result">No recent hospital invoices found.</p>
                  )}
                </div>
              </section>
            )}

            {/* TAB 6: EMERGENCY & TRIAGE */}
            {activeTab === "emergency" && canAccessEmergency && (
              <section className="doctor-section">
                <h2>Emergency Department &amp; Triage</h2>
                <div className="list-grid">
                  {emergencyCases.map((ec) => (
                    <article className="card" key={ec.emergency_case_id} style={{ borderLeft: ec.acuity <= 2 ? "4px solid #dc2626" : "4px solid #f59e0b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span className="eyebrow" style={{ color: ec.acuity <= 2 ? "#dc2626" : undefined }}>
                            ACUITY LEVEL {ec.acuity} {ec.acuity === 1 ? "(RESUSCITATION)" : ec.acuity === 2 ? "(EMERGENT)" : "(URGENT)"}
                          </span>
                          <h3 style={{ margin: "2px 0" }}>{ec.presenting_complaint}</h3>
                          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            Patient: <strong>{ec.patient_name || "Emergency Patient"}</strong> ({ec.patient_number})
                          </p>
                        </div>
                        <span className="status-pill active">{ec.status}</span>
                      </div>
                      {ec.bed_number && (
                        <p style={{ fontSize: "0.85rem", margin: "4px 0" }}>Bed: <strong>{ec.bed_number}</strong></p>
                      )}
                      <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                        Admitted: {new Date(ec.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </article>
                  ))}
                  {emergencyCases.length === 0 && (
                    <p className="empty-result">No active emergency cases in triage queue.</p>
                  )}
                </div>
              </section>
            )}

            {/* TAB 7: STAFF TASKS & NOTIFICATIONS */}
            {activeTab === "tasks" && (
              <section className="doctor-section">
                <h2>Assigned Notifications &amp; Alerts</h2>
                <div className="list-grid">
                  {notifications.map((n) => (
                    <article className="card" key={n.notificationId}>
                      <span className="eyebrow">{n.channel} · {new Date(n.createdAt).toLocaleString()}</span>
                      <h3>{n.subject}</h3>
                      <p>{n.body}</p>
                    </article>
                  ))}
                  {notifications.length === 0 && (
                    <p className="empty-result">No assigned tasks or notifications.</p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <div className="actions" style={{ marginTop: "2rem" }}>
          <Link className="secondary" href="/">
            Back home
          </Link>
        </div>
      </section>

      {/* STAFF RESCHEDULE MODAL */}
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
            if (!actionBusy) setRescheduleAppointment(null);
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
                  Staff Appointment Reschedule
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref: <strong>{rescheduleAppointment.appointmentNumber}</strong> · Attending: {rescheduleAppointment.doctorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleAppointment(null)}
                disabled={actionBusy}
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
                Select New Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadSlotsForDoctor(rescheduleAppointment.doctorId, e.target.value);
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
                Available Doctor Slots
              </label>
              {loadingSlots ? (
                <p style={{ fontSize: "0.9rem", color: "#64748b", padding: "0.5rem 0" }}>Checking doctor availability...</p>
              ) : rescheduleSlots.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px" }}>
                  No available slots for this date. Please select another date.
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
                Staff Coordination Note / Reason
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Reason for reschedule"
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
                disabled={actionBusy}
                onClick={() => setRescheduleAppointment(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedRescheduleSlot || actionBusy}
                onClick={confirmReschedule}
              >
                {actionBusy ? "Updating Schedule..." : "Confirm & Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAB RESULT MODAL */}
      {selectedLabOrder && (
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
            if (!actionBusy) setSelectedLabOrder(null);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "1.75rem",
              background: "#fff",
              borderRadius: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Record Laboratory Result</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              Test: <strong>{selectedLabOrder.test_name || selectedLabOrder.test_code}</strong> · Patient: {selectedLabOrder.patient_name}
            </p>
            <form onSubmit={handleSaveLabResult} className="form">
              <label>
                Result Summary &amp; Findings *
                <textarea
                  value={labResultSummary}
                  onChange={(e) => setLabResultSummary(e.target.value)}
                  required
                  placeholder="e.g. Hb: 13.8 g/dL, Platelets: 250,000/uL. Normal findings."
                  rows={3}
                />
              </label>
              <div className="form-grid">
                <label>
                  Result Classification *
                  <select value={labResultFlag} onChange={(e) => setLabResultFlag(e.target.value)}>
                    <option value="NORMAL">NORMAL</option>
                    <option value="ABNORMAL">ABNORMAL</option>
                    <option value="CRITICAL">CRITICAL (Alert Doctor)</option>
                  </select>
                </label>
                <label>
                  Reference Range
                  <input
                    value={labRefRange}
                    onChange={(e) => setLabRefRange(e.target.value)}
                    placeholder="e.g. 12.0 - 16.0"
                  />
                </label>
                <label>
                  Unit
                  <input
                    value={labUnit}
                    onChange={(e) => setLabUnit(e.target.value)}
                    placeholder="e.g. g/dL, mg/dL"
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={actionBusy}
                  onClick={() => setSelectedLabOrder(null)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionBusy}>
                  {actionBusy ? "Saving Result..." : "Save & Complete Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* STAFF APPOINTMENT BOOKING MODAL */}
      {bookingModalOpen && (
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
            if (!actionBusy) setBookingModalOpen(false);
          }}
        >
          <form
            className="card"
            style={{
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleConfirmStaffBooking}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.35rem", color: "#1e293b" }}>
                  Book Patient Appointment
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Schedule a confirmed consultation slot on behalf of a registered hospital patient.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                disabled={actionBusy}
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

            {/* Patient selection */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Patient *
              </label>
              {bookPatientName ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <span><strong>{bookPatientName}</strong></span>
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => { setBookPatientId(""); setBookPatientName(""); }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Search patient name or ID..."
                    value={patientSearch}
                    onChange={(e) => searchPatients(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "6px" }}
                  />
                  {patientResults.length > 0 && (
                    <div style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff" }}>
                      {patientResults.map((p) => (
                        <div
                          key={p.patient_id}
                          style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.85rem" }}
                          onClick={() => {
                            setBookPatientId(p.patient_id);
                            setBookPatientName(`${p.full_name} (${p.patient_number})`);
                          }}
                        >
                          <strong>{p.full_name}</strong> · {p.patient_number} · {p.phone || "No phone"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Attending Physician *
              </label>
              <select
                value={bookDoctorId}
                onChange={(e) => {
                  setBookDoctorId(e.target.value);
                  loadBookingSlots(e.target.value, bookDate);
                }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                required
              >
                <option value="" disabled>Select a doctor</option>
                {doctorsList.map((d) => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.fullName} ({d.specialization} · {d.departmentName})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Date */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Appointment Date *
              </label>
              <input
                type="date"
                value={bookDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setBookDate(e.target.value);
                  loadBookingSlots(bookDoctorId, e.target.value);
                }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                required
              />
            </div>

            {/* Available Slots */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Select Available Slot *
              </label>
              {loadingBookSlots ? (
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading availability...</p>
              ) : bookSlots.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {bookSlots.map((slot, idx) => {
                    const isSelected = selectedBookSlot?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBookSlot(slot)}
                        style={{
                          padding: "8px 4px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: isSelected ? "2px solid #A67C52" : "1px solid #cbd5e1",
                          background: isSelected ? "#F7F1E8" : "#fff",
                          color: isSelected ? "#3D3228" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {new Date(slot.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No available slots for this date. Please choose another date or doctor.</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setBookingModalOpen(false)}
                disabled={actionBusy}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionBusy || !selectedBookSlot || !bookPatientId}
                style={{ background: "#A67C52", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
              >
                {actionBusy ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
