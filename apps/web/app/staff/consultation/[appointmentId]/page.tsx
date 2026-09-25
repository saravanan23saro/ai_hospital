"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, sessionFetch } from "../../../lib/session";
import AppHeader from "../../../components/Header";
import BackButton from "../../../components/BackButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

type Medicine = {
  medicineName: string;
  genericName?: string;
  dosage: string;
  route?: string;
  frequency: string;
  duration: string;
  quantity?: string;
  foodInstruction?: string;
  timing?: string;
  specialInstructions?: string;
};

type ConsultationView = {
  consultationId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentNumber?: string;
  patientNumber?: string;
  patientName?: string;
  patientPhone?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  chiefComplaint?: string;
  symptoms?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  assessment?: string;
  treatmentAdvice?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  additionalNotes?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  prescription?: any;
};

type AppointmentDetail = {
  appointmentId: string;
  appointmentNumber: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export default function DoctorConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.appointmentId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalError, setModalError] = useState("");

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [consultation, setConsultation] = useState<ConsultationView | null>(null);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<any[]>([]);

  // Patient editable fields
  const [patientName, setPatientName] = useState("");
  const [patientDateOfBirth, setPatientDateOfBirth] = useState("");

  // Form states
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [assessment, setAssessment] = useState("");
  const [treatmentAdvice, setTreatmentAdvice] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Medicines builder state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medName, setMedName] = useState("");
  const [medGeneric, setMedGeneric] = useState("");
  const [medDosage, setMedDosage] = useState("500 mg");
  const [medRoute, setMedRoute] = useState("Oral");
  const [medFrequency, setMedFrequency] = useState("1-0-1");
  const [medDuration, setMedDuration] = useState("5 days");
  const [medFood, setMedFood] = useState("After food");
  const [medInstructions, setMedInstructions] = useState("");

  // Review modal
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loadSession()) {
      router.replace("/");
      return;
    }
    initConsultation();
  }, [appointmentId, router]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function api(path: string, options: RequestInit = {}) {
    const r = await sessionFetch(API, path, options);
    const b = await r.json().catch(() => null);
    if (!r.ok) throw new Error(b?.message || `Request failed (${r.status})`);
    return b;
  }

  async function initConsultation() {
    setLoading(true);
    setError("");
    try {
      // 1. Start or fetch consultation
      const cons = await api(`/api/v1/consultations/start/${appointmentId}`, {
        method: "POST",
      });
      setConsultation(cons);

      // Populate form if existing
      if (cons) {
        setChiefComplaint(cons.chiefComplaint || "");
        setSymptoms(cons.symptoms || "");
        setClinicalNotes(cons.clinicalNotes || "");
        setDiagnosis(cons.diagnosis || "");
        setAssessment(cons.assessment || "");
        setTreatmentAdvice(cons.treatmentAdvice || "");
        setFollowUpInstructions(cons.followUpInstructions || "");
        setFollowUpDate(cons.followUpDate || "");
        setAdditionalNotes(cons.additionalNotes || "");
        if (cons.prescription?.items) {
          setMedicines(cons.prescription.items);
        }

        if (cons.patientName && cons.patientName !== "Unknown Patient") {
          setPatientName(cons.patientName);
        }
        if (cons.patientDateOfBirth) {
          setPatientDateOfBirth(cons.patientDateOfBirth);
        }

        // Set appointment fallback from cons
        setAppointment({
          appointmentId: cons.appointmentId,
          appointmentNumber: cons.appointmentNumber || "APT-CONSULTATION",
          patientId: cons.patientId,
          patientNumber: cons.patientNumber && cons.patientNumber !== "PAT-UNKNOWN" ? cons.patientNumber : "PAT-REGISTERED",
          patientName: cons.patientName || "Patient",
          patientPhone: cons.patientPhone || "N/A",
          patientDateOfBirth: cons.patientDateOfBirth || undefined,
          patientGender: cons.patientGender || undefined,
          bloodGroup: cons.bloodGroup || undefined,
          allergies: cons.allergies || undefined,
          medicalConditions: cons.medicalConditions || undefined,
          startsAt: cons.startedAt || new Date().toISOString(),
          endsAt: cons.startedAt || new Date().toISOString(),
          status: cons.status,
        });

        // Load patient history
        loadPatientHistory(cons.patientId);
      }

      // 2. Fetch appointment details from doctor's list if present for extra info
      const appointmentsList = await api("/api/v1/doctors/me/appointments").catch(() => []);
      const appt = appointmentsList.find(
        (a: any) => a.appointmentId === appointmentId
      );
      if (appt) {
        setAppointment(appt);
        if (appt.patientName && appt.patientName !== "Unknown Patient") {
          setPatientName(appt.patientName);
        }
        if (appt.patientDateOfBirth) {
          setPatientDateOfBirth(appt.patientDateOfBirth);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load consultation");
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientHistory(patientId: string) {
    try {
      const [records, prescriptions] = await Promise.all([
        api(`/api/v1/operations/records/${patientId}`).catch(() => []),
        api(`/api/v1/prescriptions/patient/${patientId}`).catch(() => []),
      ]);
      setPastRecords(records || []);
      setPastPrescriptions(prescriptions || []);
    } catch (e) {
      // ignore non-critical history errors
    }
  }

  function addMedicine() {
    if (!medName.trim() || !medDosage.trim() || !medFrequency.trim() || !medDuration.trim()) {
      setError("Medicine Name, Dosage, Frequency, and Duration are required.");
      return;
    }
    setError("");
    const newMed: Medicine = {
      medicineName: medName.trim(),
      genericName: medGeneric.trim() || undefined,
      dosage: medDosage.trim(),
      route: medRoute,
      frequency: medFrequency.trim(),
      duration: medDuration.trim(),
      foodInstruction: medFood,
      specialInstructions: medInstructions.trim() || undefined,
    };
    setMedicines([...medicines, newMed]);
    // Reset inputs
    setMedName("");
    setMedGeneric("");
    setMedInstructions("");
  }

  function removeMedicine(index: number) {
    setMedicines(medicines.filter((_, i) => i !== index));
  }

  async function saveDraft() {
    let activeCons = consultation;
    if (!activeCons || !activeCons.consultationId) {
      try {
        activeCons = await api(`/api/v1/consultations/start/${appointmentId}`, { method: "POST" });
        setConsultation(activeCons);
      } catch (e) {
        setError("Could not start consultation draft.");
        return;
      }
    }
    if (!activeCons || !activeCons.consultationId) {
      setError("Could not start consultation draft.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await api(`/api/v1/consultations/${activeCons.consultationId}`, {
        method: "PUT",
        body: JSON.stringify({
          chiefComplaint,
          symptoms,
          clinicalNotes,
          diagnosis,
          assessment,
          treatmentAdvice,
          followUpInstructions,
          followUpDate: followUpDate || null,
          additionalNotes,
        }),
      });
      setNotice("Consultation draft saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    }
  }

  function handleReview(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setModalError("");
    if (medicines.length === 0) {
      setError("At least one medicine is required in the prescription before completing consultation.");
      return;
    }
    setShowReview(true);
  }

  async function downloadPrescriptionDoc(prescriptionId: string, prescriptionNumber?: string) {
    if (!prescriptionId) {
      setError("Prescription document is not available.");
      return;
    }
    setError("");
    try {
      const res = await sessionFetch(
        API,
        `/api/v1/prescriptions/${prescriptionId}/download`
      );
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${prescriptionNumber || "Rx"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice("Prescription document downloaded successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download prescription");
    }
  }

  async function finalizeComplete(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setModalError("");

    try {
      let activeCons = consultation;
      if (!activeCons || !activeCons.consultationId) {
        activeCons = await api(`/api/v1/consultations/start/${appointmentId}`, {
          method: "POST",
        });
        setConsultation(activeCons);
      }

      if (!activeCons || !activeCons.consultationId) {
        throw new Error("Could not initialize consultation session. Please refresh the page.");
      }

      const completeRes = await api(
        `/api/v1/consultations/${activeCons.consultationId}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            notes: {
              chiefComplaint,
              symptoms,
              clinicalNotes,
              diagnosis: diagnosis || "General Medical Consultation",
              assessment,
              treatmentAdvice,
              followUpInstructions,
              followUpDate: followUpDate || null,
              additionalNotes,
            },
            medicines: medicines.map((m) => ({
              medicineName: m.medicineName || "Prescribed Medicine",
              genericName: m.genericName || undefined,
              dosage: m.dosage || "As directed",
              route: m.route || "Oral",
              frequency: m.frequency || "1-0-1",
              duration: m.duration || "5 days",
              quantity: m.quantity || undefined,
              foodInstruction: m.foodInstruction || "After food",
              timing: m.timing || undefined,
              specialInstructions: m.specialInstructions || undefined,
            })),
            doctorAdvice: treatmentAdvice || additionalNotes || "Follow medication instructions.",
            followUpDate: followUpDate || null,
            patientName: patientName || undefined,
            patientDateOfBirth: patientDateOfBirth || undefined,
          }),
        }
      );
      setConsultation(completeRes);
      if (patientName && appointment) {
        setAppointment({ ...appointment, patientName, patientDateOfBirth });
      }
      setShowReview(false);
      setNotice("Consultation completed and prescription finalized! Patient has been notified.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete consultation";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="portal">
        <nav><Link className="brand" href="/staff">CareFlow AI</Link></nav>
        <section><p>Loading secure doctor consultation console…</p></section>
      </main>
    );
  }

  const isCompleted = consultation?.status === "COMPLETED";

  const resolvedPatientNumber =
    appointment?.patientNumber && appointment.patientNumber !== "PAT-UNKNOWN"
      ? appointment.patientNumber
      : consultation?.patientNumber && consultation.patientNumber !== "PAT-UNKNOWN"
      ? consultation.patientNumber
      : "PAT-REGISTERED";

  const resolvedAppointmentNumber =
    appointment?.appointmentNumber && appointment.appointmentNumber !== "APT-UNKNOWN"
      ? appointment.appointmentNumber
      : consultation?.appointmentNumber || "APT-CONSULTATION";

  return (
    <main className="portal" style={{ paddingTop: "84px" }}>
      <AppHeader
        user={{ fullName: "Doctor Workspace", roles: ["DOCTOR"] }}
        breadcrumbs={[
          { label: "Staff Workspace", href: "/staff" },
          { label: `Consultation (${resolvedAppointmentNumber})` },
        ]}
      />

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">DOCTOR CLINICAL WORKSPACE</p>
            <h1>Patient Consultation & Prescription</h1>
          </div>
          <BackButton
            label="← Back to Doctor Dashboard"
            fallbackHref="/staff"
          />
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

        {/* PATIENT INFORMATION BANNER */}
        {appointment && (
          <article className="card appointment-card" style={{ marginBottom: "2rem" }}>
            <div className="appointment-card-header">
              <div>
                <span className="appointment-number">{resolvedAppointmentNumber}</span>
                <h2>{patientName || appointment.patientName || "Patient"}</h2>
              </div>
              <span className="status">
                {isCompleted ? "COMPLETED" : "IN PROGRESS"}
              </span>
            </div>
            <dl className="patient-details" style={{ marginTop: "1rem" }}>
              <div>
                <dt>Patient ID</dt>
                <dd>{resolvedPatientNumber}</dd>
              </div>
              <div>
                <dt>DOB / Phone</dt>
                <dd>{patientDateOfBirth || appointment.patientDateOfBirth || "N/A"} · {appointment.patientPhone}</dd>
              </div>
              <div>
                <dt>Gender / Blood</dt>
                <dd>
                  {appointment.patientGender?.replaceAll("_", " ") || "N/A"} ·{" "}
                  {appointment.bloodGroup?.replace("_POSITIVE", "+").replace("_NEGATIVE", "-") || "N/A"}
                </dd>
              </div>
              <div>
                <dt>Appointment Time</dt>
                <dd>{new Date(appointment.startsAt).toLocaleString()}</dd>
              </div>
            </dl>

            {(appointment.allergies || appointment.medicalConditions) && (
              <div className="clinical-notes" style={{ marginTop: "1rem", background: "#fef2f2", padding: "1rem", borderRadius: "6px" }}>
                {appointment.allergies && (
                  <p style={{ color: "#991b1b" }}>
                    <strong>⚠️ Known Allergies:</strong> {appointment.allergies}
                  </p>
                )}
                {appointment.medicalConditions && (
                  <p style={{ color: "#9a3412" }}>
                    <strong>📋 Medical Conditions:</strong> {appointment.medicalConditions}
                  </p>
                )}
              </div>
            )}
          </article>
        )}

        {/* MEDICAL HISTORY & PAST PRESCRIPTIONS */}
        {(pastRecords.length > 0 || pastPrescriptions.length > 0) && (
          <article className="card" style={{ marginBottom: "2rem" }}>
            <h3>Patient Medical History & Previous Prescriptions</h3>
            {pastPrescriptions.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h4>Past Prescriptions ({pastPrescriptions.length})</h4>
                <ul>
                  {pastPrescriptions.slice(0, 3).map((p: any) => (
                    <li key={p.prescriptionId}>
                      <strong>{p.prescriptionNumber}</strong> ({new Date(p.createdAt).toLocaleDateString()}) - Diagnosis: {p.diagnosis || "N/A"} ({p.items?.length || 0} medicines)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}

        {/* CONSULTATION FORM */}
        <form
          className="card form wide-form"
          onSubmit={handleReview}
        >
          <h2>1. Patient Profile & Clinical Notes</h2>
          <div className="form-grid">
            <label>
              Patient Full Name *
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={isCompleted}
                placeholder="Enter patient full name..."
                required
              />
            </label>
            <label>
              Patient Date of Birth (DOB) *
              <input
                type="date"
                value={patientDateOfBirth}
                onChange={(e) => setPatientDateOfBirth(e.target.value)}
                disabled={isCompleted}
                required
              />
            </label>
          </div>

          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <label>
              Chief Complaint
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                disabled={isCompleted}
                placeholder="Primary reason for patient visit..."
              />
            </label>
            <label>
              Symptoms Observed
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                disabled={isCompleted}
                placeholder="Fever, cough, joint pain..."
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Clinical Notes & Examination
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                disabled={isCompleted}
                placeholder="Physical examination notes, blood pressure, vitals..."
              />
            </label>

            <label>
              Diagnosis / Clinical Assessment
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={isCompleted}
                placeholder="Primary diagnosis (e.g. Acute Bronchitis, Essential Hypertension)..."
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Treatment Advice
              <textarea
                value={treatmentAdvice}
                onChange={(e) => setTreatmentAdvice(e.target.value)}
                disabled={isCompleted}
                placeholder="Dietary advice, rest, exercise..."
              />
            </label>
            <label>
              Follow-up Instructions & Date
              <textarea
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                disabled={isCompleted}
                placeholder="Return if symptoms persist..."
              />
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                disabled={isCompleted}
                style={{ marginTop: "0.5rem" }}
              />
            </label>
          </div>

          {/* PRESCRIPTION BUILDER */}
          <h2 style={{ marginTop: "2rem" }}>2. Medical Prescription (Rx)</h2>
          {!isCompleted && (
            <div
              style={{
                background: "#f8fafc",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                marginBottom: "1.5rem",
              }}
            >
              <h3>+ Add Medicine Item</h3>
              <div className="form-grid">
                <label>
                  Medicine Name *
                  <input
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="e.g. Paracetamol 500 mg"
                  />
                </label>
                <label>
                  Generic Name (optional)
                  <input
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    placeholder="e.g. Acetaminophen"
                  />
                </label>
                <label>
                  Dosage *
                  <input
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="e.g. 500 mg / 1 tablet"
                  />
                </label>
                <label>
                  Route
                  <select
                    value={medRoute}
                    onChange={(e) => setMedRoute(e.target.value)}
                  >
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                    <option value="Subcutaneous">Subcutaneous</option>
                  </select>
                </label>
              </div>

              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <label>
                  Frequency *
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                  >
                    <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                    <option value="1-1-1">1-1-1 (Thrice daily)</option>
                    <option value="1-0-0">1-0-0 (Morning only)</option>
                    <option value="0-0-1">0-0-1 (Night only)</option>
                    <option value="Once daily">Once daily</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </label>
                <label>
                  Duration *
                  <input
                    value={medDuration}
                    onChange={(e) => setMedDuration(e.target.value)}
                    placeholder="e.g. 5 days / 2 weeks"
                  />
                </label>
                <label>
                  Food Instruction
                  <select
                    value={medFood}
                    onChange={(e) => setMedFood(e.target.value)}
                  >
                    <option value="After food">After food</option>
                    <option value="Before food">Before food</option>
                    <option value="With food">With food</option>
                    <option value="Empty stomach">Empty stomach</option>
                  </select>
                </label>
                <label>
                  Special Instructions
                  <input
                    value={medInstructions}
                    onChange={(e) => setMedInstructions(e.target.value)}
                    placeholder="e.g. Take with warm water"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={addMedicine}
                style={{ marginTop: "1rem" }}
              >
                + Add Medicine to Prescription
              </button>
            </div>
          )}

          {/* MEDICINES LIST TABLE */}
          <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                border: "1px solid #cbd5e1",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>#</th>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Medicine</th>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Dosage</th>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Frequency</th>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Duration</th>
                  <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Instructions</th>
                  {!isCompleted && (
                    <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{idx + 1}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                      <strong>{m.medicineName}</strong>
                      {m.genericName && (
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          ({m.genericName})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{m.dosage}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{m.frequency}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{m.duration}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                      {m.foodInstruction} {m.specialInstructions && `(${m.specialInstructions})`}
                    </td>
                    {!isCompleted && (
                      <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                        <button
                          type="button"
                          className="destructive-action"
                          onClick={() => removeMedicine(idx)}
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {medicines.length === 0 && (
                  <tr>
                    <td
                      colSpan={isCompleted ? 6 : 7}
                      style={{ padding: "20px", textAlign: "center", color: "#64748b" }}
                    >
                      No medicines added yet. Use the form above to add prescribed medicines.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ACTION BUTTONS */}
          {!isCompleted ? (
            <div className="button-grid" style={{ marginTop: "2rem" }}>
              <button type="button" className="secondary-action" onClick={saveDraft}>
                Save Consultation Draft
              </button>
              <button type="submit">Review & Complete Consultation</button>
            </div>
          ) : (
            <div className="button-grid" style={{ marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
              {consultation?.prescription?.prescriptionId && (
                <button
                  type="button"
                  onClick={() => downloadPrescriptionDoc(consultation.prescription.prescriptionId, consultation.prescription.prescriptionNumber)}
                  style={{
                    padding: "12px 24px",
                    background: "#0284c7",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  📥 Download Official Prescription (Rx)
                </button>
              )}
              <button
                type="button"
                className="secondary-action"
                onClick={() => router.push("/staff")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                ← Back to Staff Workspace
              </button>
            </div>
          )}
        </form>

        {/* REVIEW PRESCRIPTION MODAL */}
        {showReview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: "20px",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                maxWidth: "700px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                pointerEvents: "auto",
              }}
            >
              <div
                style={{
                  borderBottom: "2px solid #0284c7",
                  paddingBottom: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 style={{ margin: 0, color: "#0f172a" }}>
                  CAREFLOW SMART HOSPITAL
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  Medical Prescription Review & Final Submission
                </p>
              </div>

              {modalError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "2px solid #ef4444",
                    color: "#991b1b",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    fontWeight: "700",
                    fontSize: "15px",
                  }}
                >
                  ⚠️ {modalError}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "#f8fafc",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <strong>Patient:</strong> {patientName || appointment?.patientName || consultation?.patientName || "Patient"}
                  <br />
                  <strong>DOB:</strong> {patientDateOfBirth || appointment?.patientDateOfBirth || consultation?.patientDateOfBirth || "N/A"}
                </div>
                <div>
                  <strong>Appointment:</strong> {resolvedAppointmentNumber}
                  <br />
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
              </div>

              <p>
                <strong>Diagnosis:</strong> {diagnosis || "General Medical Assessment"}
              </p>

              <h4>Prescribed Medicines ({medicines.length}):</h4>
              <ol style={{ paddingLeft: "1.2rem" }}>
                {medicines.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: "8px" }}>
                    <strong>{m.medicineName}</strong> — {m.dosage} ({m.frequency} for {m.duration}) - <em>{m.foodInstruction}</em>
                  </li>
                ))}
              </ol>

              {treatmentAdvice && (
                <p>
                  <strong>Doctor Advice:</strong> {treatmentAdvice}
                </p>
              )}
              {followUpDate && (
                <p>
                  <strong>Follow-up Date:</strong> {followUpDate}
                </p>
              )}

              <div
                style={{
                  background: "#fffbebf5",
                  border: "1px solid #fde68a",
                  padding: "14px",
                  borderRadius: "8px",
                  marginTop: "1.5rem",
                  marginBottom: "1.5rem",
                  fontSize: "14px",
                  color: "#92400e",
                }}
              >
                ⚠️ <strong>Confirmation Required:</strong> Finalizing this consultation will lock the prescription, transition the appointment status to <strong>COMPLETED</strong>, and issue an instant notification to the patient.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  className="secondary-action"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReview(false);
                  }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ← Back to Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => finalizeComplete(e)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: "#083f38",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {submitting ? "⏳ Finalizing & Issuing Rx…" : "Confirm & Finalize Consultation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
