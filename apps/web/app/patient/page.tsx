"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../components/Header";
import { getLocalizedDisplayName, Language, translations, useLanguage } from "../lib/i18n";
import {
  Home,
  User,
  CalendarPlus,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  Headphones,
  Menu,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Target,
  UserCheck,
  CalendarSearch,
  LayoutGrid,
  Shield,
  Lock,
  Settings as SettingsIcon,
  Bell,
  Key,
  Globe,
  Megaphone,
  Heart,
  Utensils,
  Activity,
  Clock,
  MapPin,
  Pill,
  Folder,
  CheckCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

type Session = { accessToken: string; refreshToken: string };
type Department = { departmentId: string; name: string };
type Slot = {
  doctorId: string;
  doctorName: string;
  specialization: string;
  startsAt: string;
  durationMinutes: number;
};
type Appointment = {
  appointmentId: string;
  appointmentNumber: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  startsAt: string;
  status: string;
  cancellationReason?: string;
};
type PaymentView = {
  paymentId: string;
  patientId: string;
  invoiceId: string;
  appointmentId: string;
  amountMinor: number;
  currency: string;
  provider: string;
  transactionId?: string;
  status: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: string;
  paidAt?: string;
};
type ReceiptView = {
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  patientId: string;
  amountMinor: number;
  currency: string;
  provider: string;
  transactionId: string;
  paymentMethod: string;
  status: string;
  paidAt: string;
  hospitalInfo: string;
};
type Profile = {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  gender: string;
  address: string;
  emergencyContact: string;
  preferredLanguage: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  patientNumber?: string;
  profileComplete?: boolean;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export default function PatientPortal() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<
    "home" | "profile" | "book" | "appointments" | "payments" | "prescriptions" | "settings"
  >("home");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userAccount, setUserAccount] = useState<{ email?: string; fullName?: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [searchedSlots, setSearchedSlots] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [activePaymentModal, setActivePaymentModal] = useState<{ appointmentId: string; appointmentNumber: string } | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<{ id: string; number: string } | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [rescheduleModalAppointment, setRescheduleModalAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<Slot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<"MOCK" | "RAZORPAY" | "STRIPE">("MOCK");
  const [selectedMethod, setSelectedMethod] = useState<string>("CARD");
  const [receiptData, setReceiptData] = useState<ReceiptView | null>(null);
  const [busy, setBusy] = useState(false);
  const bookingInProgress = useRef(false);
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState<"LIGHT" | "DARK">("LIGHT");

  const [awarenessSlide, setAwarenessSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  const awarenessCampaigns = useMemo(
    () => [
      {
        date: "September 29",
        title: t.worldHeartDayTitle || "World Heart Day",
        subtitle: t.worldHeartDaySub || "A healthier heart leads to a brighter tomorrow.",
        desc: t.worldHeartDayDesc || "Take care of your heart with regular checkups, a balanced diet, and an active lifestyle.",
        badgeText: t.healthyHeartsBadge || "Healthy Hearts Happier Lives",
        tips: [
          { icon: "heart", title: t.regularCheckups || "Regular Checkups", sub: t.keepHeartHealthy || "Keep your heart healthy" },
          { icon: "utensils", title: t.balancedDiet || "Balanced Diet", sub: t.chooseNutritious || "Choose nutritious foods" },
          { icon: "activity", title: t.stayActive || "Stay Active", sub: t.moveForHealth || "Move for a healthier you" },
        ],
      },
      {
        date: "November 14",
        title: t.worldDiabetesDayTitle || "World Diabetes Day",
        subtitle: t.worldDiabetesDaySub || "Know your risk, protect your future.",
        desc: t.worldDiabetesDayDesc || "Monitor your blood sugar levels regularly, maintain a healthy diet, and stay physically active.",
        badgeText: t.beatDiabetesBadge || "Beat Diabetes Together",
        tips: [
          { icon: "activity", title: t.bloodGlucoseTest || "Blood Glucose Test", sub: t.regularScreening || "Regular screening" },
          { icon: "utensils", title: t.lowGlycemicMeals || "Low Glycemic Meals", sub: t.nutritiousChoices || "Nutritious choices" },
          { icon: "activity", title: t.dailyExercise || "Daily Exercise", sub: t.movementMins || "30 mins of movement" },
        ],
      },
      {
        date: "October 10",
        title: t.worldMentalHealthDayTitle || "World Mental Health Day",
        subtitle: t.worldMentalHealthDaySub || "Mental health is a universal human right.",
        desc: t.worldMentalHealthDayDesc || "Prioritize rest, connect with loved ones, practice mindfulness, and seek guidance when needed.",
        badgeText: t.mindMattersBadge || "Mind Matters Every Day",
        tips: [
          { icon: "heart", title: t.mindfulnessPractice || "Mindfulness Practice", sub: t.dailyMeditation || "Daily meditation" },
          { icon: "activity", title: t.restfulSleep || "Restful Sleep", sub: t.hoursNightly || "7-8 hours nightly" },
          { icon: "utensils", title: t.talkConnect || "Talk & Connect", sub: t.supportNetwork || "Support network" },
        ],
      },
      {
        date: "April 7",
        title: t.worldHealthDayTitle || "World Health Day",
        subtitle: t.worldHealthDaySub || "My health, my right.",
        desc: t.worldHealthDayDesc || "Empower your life with preventative health checkups, proper hydration, and routine wellness tracking.",
        badgeText: t.healthForAllBadge || "Health For All",
        tips: [
          { icon: "heart", title: t.annualScreening || "Annual Screening", sub: t.comprehensiveCare || "Comprehensive care" },
          { icon: "utensils", title: t.hydrationFirst || "Hydration First", sub: t.litersDaily || "2-3 Liters daily" },
          { icon: "activity", title: t.wellnessTracking || "Wellness Tracking", sub: t.monitorVitals || "Monitor vitals" },
        ],
      },
    ],
    [t]
  );

  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setAwarenessSlide((prev) => (prev + 1) % awarenessCampaigns.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isSlidePaused, awarenessCampaigns.length]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("careflow_theme") as "LIGHT" | "DARK";
      if (savedTheme) setTheme(savedTheme);
    } catch {}
  }, []);

  function changeLanguage(newLang: Language) {
    setLang(newLang);
  }

  function changeTheme(newTheme: "LIGHT" | "DARK") {
    setTheme(newTheme);
    try {
      localStorage.setItem("careflow_theme", newTheme);
    } catch {}
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("careflowSession");
      if (raw) setToken((JSON.parse(raw) as Session).accessToken);
      else setToken("demo-patient-token");
    } catch {
      setToken("demo-patient-token");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    async function loadInitialUserData() {
      try {
        const [prof, authMe] = await Promise.all([
          api("/api/v1/patients/me").catch(() => null),
          api("/api/v1/auth/me").catch(() => null),
        ]);
        if (authMe?.roles && (authMe.roles.includes("DOCTOR") || authMe.roles.includes("STAFF") || authMe.roles.includes("ADMIN"))) {
          if (authMe.roles.includes("DOCTOR")) router.replace("/doctor");
          else if (authMe.roles.includes("STAFF")) router.replace("/staff");
          else if (authMe.roles.includes("ADMIN")) router.replace("/operations");
          return;
        }
        if (prof) setProfile(prof);
        if (authMe) setUserAccount(authMe);

        if (prof?.patientId) {
          const [appts, rxs, pmts] = await Promise.all([
            api("/api/v1/patients/me/appointments").catch(() => []),
            api(`/api/v1/prescriptions/patient/${prof.patientId}`).catch(() => []),
            api(`/api/v1/payments/patient/${prof.patientId}`).catch(() => []),
          ]);
          setAppointments(Array.isArray(appts) ? appts : []);
          setPrescriptions(Array.isArray(rxs) ? rxs : []);
          setPayments(Array.isArray(pmts) ? pmts : []);
        } else {
          setAppointments([]);
          setPrescriptions([]);
          setPayments([]);
        }
      } catch {
        // ignore background fetch error
      }
    }
    loadInitialUserData();
  }, [token, router]);

  useEffect(() => {
    if (!token || token === "demo-patient-token") return;
    let es: EventSource | null = null;
    try {
      const sseUrl = `${API}/api/v1/schedules/stream?token=${encodeURIComponent(token)}`;
      es = new EventSource(sseUrl);

      const handleScheduleUpdate = () => {
        api("/api/v1/patients/me/appointments")
          .then((res) => {
            if (Array.isArray(res)) setAppointments(res);
          })
          .catch(() => {});

        if (selectedDepartmentId && selectedDate) {
          reloadAvailableSlots(selectedDepartmentId, selectedDate);
        }
      };

      es.addEventListener("APPOINTMENT_BOOKED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_CANCELLED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_RESCHEDULED", handleScheduleUpdate);
      es.addEventListener("APPOINTMENT_SLOT_AVAILABLE", handleScheduleUpdate);
    } catch {
      // Non-fatal if EventSource fails
    }

    return () => {
      if (es) es.close();
    };
  }, [token, selectedDepartmentId, selectedDate]);

  async function api(path: string, options: RequestInit = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error("Your session expired. Please sign in again.");
    }
    if (!response.ok)
      throw new ApiError(
        body?.message || `Request failed (${response.status})`,
        response.status,
        body?.code,
      );
    return body;
  }

  function handleSessionExpired() {
    try {
      sessionStorage.setItem("careflow_session_expired_notice", "Your session expired. Please sign in again.");
    } catch {}
    setError("Your session expired. Please sign in again.");
    clearSession();
    setTimeout(() => {
      router.replace("/");
    }, 1200);
  }

  async function logout() {
    try {
      const raw = sessionStorage.getItem("careflowSession");
      if (raw) {
        const s = JSON.parse(raw) as Session;
        await fetch(API + "/api/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: s.refreshToken }),
        });
      }
    } finally {
      clearSession();
      router.replace("/");
    }
  }

  function clearSession() {
    sessionStorage.removeItem("careflowSession");
    setToken("");
    setView("home");
  }

  async function openProfile() {
    setError("");
    try {
      setProfile(await api("/api/v1/patients/me"));
    } catch (e) {
      if (
        e instanceof Error &&
        !e.message.includes("profile has not been created")
      )
        setError(e.message);
      setProfile(null);
    }
    setView("profile");
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      setProfile(
        await api("/api/v1/patients/me", {
          method: "PUT",
          body: JSON.stringify({
            fullName: f.get("fullName"),
            dateOfBirth: f.get("dateOfBirth"),
            phone: f.get("phone"),
            gender: f.get("gender"),
            address: f.get("address"),
            emergencyContact: f.get("emergencyContact"),
            preferredLanguage: f.get("preferredLanguage"),
            bloodGroup: f.get("bloodGroup"),
            allergies: f.get("allergies"),
            medicalConditions: f.get("medicalConditions"),
          }),
        }),
      );
      setNotice("Patient profile saved.");
      setView("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  async function reloadAvailableSlots(deptId?: string, dateVal?: string) {
    const targetDept = deptId !== undefined ? deptId : selectedDepartmentId;
    const targetDate = dateVal !== undefined ? dateVal : selectedDate;
    if (!targetDept || !targetDate) return;
    try {
      const results = await api(
        `/api/v1/slots?departmentId=${encodeURIComponent(targetDept)}&date=${encodeURIComponent(targetDate)}`,
      );
      setSlots(results || []);
    } catch {
      // non-fatal reload
    }
  }

  async function openBooking() {
    setError("");
    try {
      const currentProfile = await api("/api/v1/patients/me");
      if (!currentProfile.profileComplete) {
        setProfile(currentProfile);
        setError("Complete your patient profile before booking an appointment.");
        setView("profile");
        return;
      }
      setProfile(currentProfile);
      setDepartments(await api("/api/v1/departments"));
      setView("book");
      if (selectedDepartmentId && selectedDate) {
        reloadAvailableSlots(selectedDepartmentId, selectedDate);
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "PATIENT_PROFILE_NOT_FOUND") {
        setProfile(null);
        setError("Complete your patient profile before booking an appointment.");
        setView("profile");
        return;
      }
      setError(e instanceof Error ? e.message : "Could not load departments");
    }
  }

  async function searchSlots(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const deptId = String(f.get("departmentId") || "");
      const dateVal = String(f.get("date") || "");
      setSelectedDepartmentId(deptId);
      setSelectedDate(dateVal);
      const results = await api(
        `/api/v1/slots?departmentId=${encodeURIComponent(deptId)}&date=${encodeURIComponent(dateVal)}`,
      );
      setSlots(results || []);
      setSearchedSlots(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load slots");
    } finally {
      setBusy(false);
    }
  }

  async function book(slot: Slot) {
    if (bookingInProgress.current) return;
    bookingInProgress.current = true;
    setBusy(true);
    setError("");
    try {
      const reservation = await api("/api/v1/reservations", {
        method: "POST",
        body: JSON.stringify({
          doctorId: slot.doctorId,
          startsAt: slot.startsAt,
        }),
      });
      const appointment = await api("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify({ reservationId: reservation.reservationId }),
      });
      // Immediately remove the booked slot from the available slots list
      setSlots((current) =>
        current.filter(
          (candidate) =>
            candidate.doctorId !== slot.doctorId ||
            candidate.startsAt !== slot.startsAt,
        ),
      );
      setNotice(`Appointment ${appointment.appointmentNumber} confirmed.`);
      await openAppointments();
    } catch (e) {
      if (
        (e instanceof ApiError &&
          ["SLOT_UNAVAILABLE", "SLOT_ALREADY_BOOKED", "CONFLICT", "INVALID_APPOINTMENT_STATE"].includes(e.code || "")) ||
        (e instanceof ApiError && e.status === 409)
      ) {
        setSlots((current) =>
          current.filter(
            (candidate) =>
              candidate.doctorId !== slot.doctorId ||
              candidate.startsAt !== slot.startsAt,
          ),
        );
        setError("Sorry, this appointment slot is no longer available. Please select another time.");
        if (selectedDepartmentId && selectedDate) {
          reloadAvailableSlots(selectedDepartmentId, selectedDate);
        }
      } else if (e instanceof ApiError && e.code === "PATIENT_PROFILE_REQUIRED") {
        await openProfile();
        setError("Complete your patient profile before booking an appointment.");
      } else {
        setError(e instanceof Error ? e.message : "Booking failed");
      }
    } finally {
      bookingInProgress.current = false;
      setBusy(false);
    }
  }

  async function openAppointments() {
    setError("");
    try {
      const appts = await api("/api/v1/patients/me/appointments");
      setAppointments(appts);
      const currentProf = await api("/api/v1/patients/me").catch(() => null);
      if (currentProf?.patientId) {
        const pmts = await api(`/api/v1/payments/patient/${currentProf.patientId}`).catch(() => []);
        setPayments(pmts || []);
      }
      setView("appointments");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load appointments");
    }
  }

  async function openPaymentsTab() {
    setError("");
    try {
      const currentProf = await api("/api/v1/patients/me");
      if (currentProf?.patientId) {
        const pmts = await api(`/api/v1/payments/patient/${currentProf.patientId}`);
        setPayments(pmts || []);
      }
      setView("payments");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payments");
    }
  }

  async function downloadPrescriptionDoc(prescriptionId: string, prescriptionNumber?: string) {
    if (!prescriptionId) return;
    try {
      const response = await fetch(`${API}/api/v1/prescriptions/${prescriptionId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const htmlText = await response.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${prescriptionNumber || "Rx"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice("Prescription document downloaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download prescription");
    }
  }

  async function openPrescriptionsTab() {
    setError("");
    try {
      const currentProf = await api("/api/v1/patients/me");
      if (currentProf?.patientId) {
        const list = await api(`/api/v1/prescriptions/patient/${currentProf.patientId}`);
        setPrescriptions(list || []);
      }
      setView("prescriptions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load prescriptions");
    }
  }

  async function confirmCancellation() {
    if (!cancelModalAppointment || !cancelReasonInput.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/v1/appointments/${cancelModalAppointment.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReasonInput.trim() }),
      });
      setNotice("Appointment cancelled successfully.");
      setCancelModalAppointment(null);
      setCancelReasonInput("");
      await openAppointments();
      if (selectedDepartmentId && selectedDate) {
        reloadAvailableSlots(selectedDepartmentId, selectedDate);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setBusy(false);
    }
  }

  async function openRescheduleModal(appt: Appointment) {
    setRescheduleModalAppointment(appt);
    setSelectedRescheduleSlot(null);
    setRescheduleReason("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setRescheduleDate(dateStr);
    await loadRescheduleSlots(appt.doctorId, dateStr);
  }

  async function loadRescheduleSlots(doctorId?: string, date?: string) {
    if (!doctorId || !date) return;
    setLoadingRescheduleSlots(true);
    setSelectedRescheduleSlot(null);
    try {
      const data = await api(`/api/v1/slots?doctorId=${doctorId}&date=${date}`);
      setRescheduleSlots(data || []);
    } catch (e) {
      setRescheduleSlots([]);
      setError(e instanceof Error ? e.message : "Could not load available slots");
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }

  async function confirmReschedule() {
    if (!rescheduleModalAppointment || !selectedRescheduleSlot) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/v1/appointments/${rescheduleModalAppointment.appointmentId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          doctorId: selectedRescheduleSlot.doctorId,
          startsAt: selectedRescheduleSlot.startsAt,
          reason: rescheduleReason.trim() || undefined,
        }),
      });
      setNotice(`Appointment rescheduled successfully to ${new Date(selectedRescheduleSlot.startsAt).toLocaleString()}!`);
      setRescheduleModalAppointment(null);
      await openAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reschedule appointment");
    } finally {
      setBusy(false);
    }
  }

  async function executePaymentFlow(appointmentId: string, simulateOutcome: "SUCCESS" | "FAILED" | "PENDING") {
    setBusy(true);
    setError("");
    try {
      const currentProf = await api("/api/v1/patients/me");
      const order = await api("/api/v1/payments/orders", {
        method: "POST",
        body: JSON.stringify({
          patientId: currentProf.patientId,
          appointmentId: appointmentId,
          amountMinor: 100000,
          currency: "INR",
          provider: selectedGateway,
          idempotencyKey: `idemp-${appointmentId}-${Date.now()}`
        }),
      });

      if (simulateOutcome === "FAILED") {
        setError(`Payment attempt failed via ${selectedGateway} gateway. Safe error recorded.`);
        setActivePaymentModal(null);
        return;
      }

      const verified = await api("/api/v1/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          paymentId: order.paymentId,
          providerPaymentId: `pay_${selectedGateway.toLowerCase()}_${Date.now()}`,
          providerSignature: `rzp_sig_mock_${Date.now()}`,
          paymentMethod: selectedMethod
        }),
      });

      setNotice(`✓ Payment of ₹1,000 completed via ${selectedGateway} (${selectedMethod}). Transaction ID: ${verified.transactionId}`);
      setActivePaymentModal(null);
      await openAppointments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment processing failed");
    } finally {
      setBusy(false);
    }
  }

  async function viewReceipt(paymentId: string) {
    setError("");
    try {
      const rcpt = await api(`/api/v1/payments/${paymentId}/receipt`);
      setReceiptData(rcpt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load receipt");
    }
  }

  const doctorAvailability = useMemo(() => {
    const grouped = new Map<
      string,
      { doctorName: string; specialization: string; slots: Slot[] }
    >();

    for (const slot of slots) {
      const doctor = grouped.get(slot.doctorId);
      if (doctor) doctor.slots.push(slot);
      else {
        grouped.set(slot.doctorId, {
          doctorName: slot.doctorName,
          specialization: slot.specialization,
          slots: [slot],
        });
      }
    }

    return Array.from(grouped.entries()).map(([doctorId, doctor]) => ({
      doctorId,
      ...doctor,
    }));
  }, [slots]);

  const rawPatientName =
    profile?.fullName ||
    userAccount?.fullName ||
    (userAccount?.email ? userAccount.email.split("@")[0] : "Mary");

  const patientDisplayName = getLocalizedDisplayName(rawPatientName, lang);

  return (
    <div className="saas-portal-wrapper">
      {/* 1. TOP HEADER */}
      <AppHeader
        lang={lang}
        user={{
          fullName: patientDisplayName,
          email: userAccount?.email,
          roles: ["PATIENT"],
        }}
        onNavigateView={(v) => {
          if (v === "profile") openProfile();
          else if (v === "book") openBooking();
          else if (v === "appointments") openAppointments();
          else if (v === "payments") openPaymentsTab();
          else if (v === "prescriptions") openPrescriptionsTab();
          else if (v === "settings") setView("settings");
          else setView("home");
        }}
      />

      {/* 2. MAIN PORTAL LAYOUT */}
      <div className="saas-patient-layout">
        {/* LEFT SIDEBAR */}
        <aside className={`saas-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-nav-list">
            {/* HOME ROW WITH INLINE COMPACT HAMBURGER TOGGLE AT FAR RIGHT */}
            <div className="sidebar-home-row">
              <button
                className={`sidebar-nav-item sidebar-home-btn ${view === "home" ? "active" : ""}`}
                onClick={() => setView("home")}
                title={t.home}
              >
                <Home size={18} />
                <span className="nav-label">{t.home}</span>
              </button>
              <button
                type="button"
                className="sidebar-toggle-inline-btn"
                aria-label={sidebarOpen ? "Collapse navigation menu" : "Expand navigation menu"}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu size={15} color="#A67C52" />
              </button>
            </div>

            <button
              className={`sidebar-nav-item ${view === "profile" ? "active" : ""}`}
              onClick={openProfile}
              title={t.profile}
            >
              <User size={18} />
              <span className="nav-label">{t.profile}</span>
            </button>

            <button
              className={`sidebar-nav-item ${view === "book" ? "active" : ""}`}
              onClick={openBooking}
              title={t.bookAppointment}
            >
              <CalendarPlus size={18} />
              <span className="nav-label">{t.bookAppointment}</span>
            </button>

            <button
              className={`sidebar-nav-item ${view === "appointments" ? "active" : ""}`}
              onClick={openAppointments}
              title={t.appointments}
            >
              <Calendar size={18} />
              <span className="nav-label">{t.appointments}</span>
            </button>

            <button
              className={`sidebar-nav-item ${view === "payments" ? "active" : ""}`}
              onClick={openPaymentsTab}
              title={t.paymentsInvoices}
            >
              <CreditCard size={18} />
              <span className="nav-label">{t.paymentsInvoices}</span>
            </button>

            <button
              className={`sidebar-nav-item ${view === "prescriptions" ? "active" : ""}`}
              onClick={openPrescriptionsTab}
              title={t.myPrescriptions}
            >
              <FileText size={18} />
              <span className="nav-label">{t.myPrescriptions}</span>
            </button>

            <button
              className={`sidebar-nav-item ${view === "settings" ? "active" : ""}`}
              onClick={() => setView("settings")}
              title={t.settings}
            >
              <SettingsIcon size={18} />
              <span className="nav-label">{t.settings}</span>
            </button>

            <div className="sidebar-divider" />

            <button className="sidebar-nav-item sidebar-signout-item" onClick={logout} title={t.signOut}>
              <LogOut size={18} />
              <span className="nav-label">{t.signOut}</span>
            </button>
          </div>

          {/* BOTTOM NEED HELP CARD */}
          <div className="sidebar-help-card">
            <div className="sidebar-help-header">
              <div className="help-icon-box">
                <Headphones size={16} />
              </div>
              <div>
                <h4 className="help-title">{t.needHelp}</h4>
                <p className="help-subtext">{t.wereHereForYou}</p>
              </div>
            </div>
            <button
              type="button"
              className="contact-support-btn"
              onClick={() => setNotice("Support team is available 24/7 at support@careflow.com")}
            >
              {t.contactSupport}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="saas-main-container">
          {notice && (
            <div className="success" role="status" onClick={() => setNotice("")} style={{ marginBottom: "16px" }}>
              <span>✓ {notice}</span>
              <button
                type="button"
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotice("");
                }}
              >
                ✕
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert" onClick={() => setError("")} style={{ marginBottom: "16px" }}>
              <span>⚠️ {error}</span>
              <button
                type="button"
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setError("");
                }}
              >
                ✕
              </button>
            </div>
          )}

          {!token ? (
            <p className="muted">Opening secure sign in…</p>
          ) : (
            <>
              {/* HOME DASHBOARD VIEW */}
              {view === "home" && (
                <div className="saas-patient-home">
                  {/* 1. HERO SECTION */}
                  <div className="saas-hero-card">
                    <div className="hero-left-content">
                      <span className="eyebrow-badge">{t.goodHealthTag}</span>
                      <h1 className="hero-main-title">
                        {t.yourCare}<br />
                        <span className="title-accent-blue">{t.organized}</span>
                      </h1>
                      <p className="hero-welcome-text">
                        {t.welcomeUser ? t.welcomeUser.replace("{name}", patientDisplayName) : `Welcome back, ${patientDisplayName}!`}
                      </p>
                      <p className="hero-subtext-desc">
                        {t.stayOnTopDesc}
                      </p>
                    </div>

                    <div className="hero-right-content desktop-only">
                      <div className="hero-patient-illustration">
                        <div className="hero-patient-artwork">
                          <div className="patient-avatar-large" style={{ overflow: "hidden", padding: "4px" }}>
                            <img
                              src="/cream_3d_heart.jpg"
                              alt="3D Anatomical Heart"
                              className="heart-beat-anim"
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                            />
                          </div>
                          <div className="hero-script-tag">{t.smallSteps}</div>
                        </div>
                      </div>

                      <div className="hero-security-card">
                        <div className="security-icon-badge">
                          <ShieldCheck size={22} color="#A67C52" />
                        </div>
                        <div className="security-card-content">
                          <h4 className="security-card-title">{t.healthDataSafeTitle}</h4>
                          <p className="security-card-subtext">
                            {t.healthDataSafeDesc}
                          </p>
                          <button
                            type="button"
                            className="security-learn-more-btn"
                            onClick={() => setNotice("Your health data is protected with 256-bit HIPAA compliant encryption.")}
                          >
                            {t.learnMore}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. HEALTH AWARENESS & SPECIAL DAYS CAROUSEL */}
                  <div
                    className="saas-awareness-card"
                    onMouseEnter={() => setIsSlidePaused(true)}
                    onMouseLeave={() => setIsSlidePaused(false)}
                  >
                    <div className="awareness-header">
                      <div className="awareness-header-left">
                        <div className="megaphone-badge-icon">
                          <Megaphone size={18} color="#A67C52" />
                        </div>
                        <h2 className="awareness-section-title">{t.healthAwarenessSectionTitle}</h2>
                      </div>
                      <div className="awareness-header-right">
                        <span className="slide-counter-badge">
                          {awarenessSlide + 1} / {awarenessCampaigns.length}
                        </span>
                        <div className="slide-nav-arrows">
                          <button
                            type="button"
                            className="arrow-btn"
                            aria-label="Previous campaign slide"
                            onClick={() =>
                              setAwarenessSlide(
                                (prev) => (prev - 1 + awarenessCampaigns.length) % awarenessCampaigns.length
                              )
                            }
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            className="arrow-btn"
                            aria-label="Next campaign slide"
                            onClick={() =>
                              setAwarenessSlide((prev) => (prev + 1) % awarenessCampaigns.length)
                            }
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CAROUSEL SLIDE ITEM */}
                    <div className="awareness-slide-content">
                      <div className="awareness-slide-left">
                        <span className="campaign-date-badge">{awarenessCampaigns[awarenessSlide].date}</span>
                        <h3 className="campaign-main-title">{awarenessCampaigns[awarenessSlide].title}</h3>
                        <p className="campaign-subtitle">{awarenessCampaigns[awarenessSlide].subtitle}</p>
                        <p className="campaign-desc">{awarenessCampaigns[awarenessSlide].desc}</p>
                        <button
                          type="button"
                          className="campaign-learn-btn"
                          onClick={() => setNotice(`Showing details for ${awarenessCampaigns[awarenessSlide].title}`)}
                        >
                          Learn more →
                        </button>
                      </div>

                      <div className="awareness-slide-center desktop-only">
                        <div className="campaign-heart-illustration">
                          <div className="stethoscope-heart-wrapper" style={{ width: "110px", height: "110px", borderRadius: "20px", overflow: "hidden" }}>
                            <img
                              src="/cream_3d_heart.jpg"
                              alt="3D Anatomical Heart"
                              className="heart-beat-anim"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "drop-shadow(0 6px 14px rgba(166, 124, 82, 0.2))",
                              }}
                            />
                          </div>
                          <div className="campaign-badge-text">
                            {awarenessCampaigns[awarenessSlide].badgeText}
                          </div>
                        </div>
                      </div>

                      <div className="awareness-slide-right desktop-only">
                        <div className="quick-tips-list">
                          {awarenessCampaigns[awarenessSlide].tips.map((tip, idx) => (
                            <div key={idx} className="tip-item-row">
                              <div className="tip-icon-badge">
                                {tip.icon === "heart" && <Heart size={16} color="#A67C52" />}
                                {tip.icon === "utensils" && <Utensils size={16} color="#A67C52" />}
                                {tip.icon === "activity" && <Activity size={16} color="#A67C52" />}
                              </div>
                              <div>
                                <h4 className="tip-title">{tip.title}</h4>
                                <p className="tip-subtext">{tip.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CAROUSEL DOTS */}
                    <div className="awareness-dots-row">
                      {awarenessCampaigns.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`dot-pill ${idx === awarenessSlide ? "active" : ""}`}
                          onClick={() => setAwarenessSlide(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 3. BOTTOM 3 CARDS GRID */}
                  <div className="saas-bottom-cards-grid">
                    {/* CARD 1: UPCOMING APPOINTMENT */}
                    <div className="saas-dashboard-card appt-card">
                      <div className="dash-card-header">
                        <div className="dash-card-title-group">
                          <div className="dash-card-icon-box">
                            <Calendar size={18} color="#A67C52" />
                          </div>
                          <h3 className="dash-card-heading">{t.upcomingAppointments}</h3>
                        </div>
                        <button
                          type="button"
                          className="view-all-link-btn"
                          onClick={openAppointments}
                        >
                          {t.viewAll}
                        </button>
                      </div>

                      <div className="dash-card-body">
                        {appointments.length > 0 ? (
                          <div className="doctor-profile-block">
                            <div className="doctor-info-header">
                              <div className="doc-avatar-img">
                                <User size={24} color="#A67C52" />
                              </div>
                              <div>
                                <h4 className="doc-name">{getLocalizedDisplayName(appointments[0].doctorName || t.doctor || "Doctor", lang)}</h4>
                                <p className="doc-spec">{appointments[0].doctorSpecialization || "General Medicine"}</p>
                              </div>
                              <span className="status-confirmed-chip">
                                {appointments[0].status || t.statusConfirmed}
                              </span>
                            </div>

                            <div className="appt-details-rows">
                              <div className="appt-detail-badge">
                                <Calendar size={14} color="#A67C52" />
                                <span>{new Date(appointments[0].startsAt).toLocaleDateString(lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              <div className="appt-detail-badge">
                                <Clock size={14} color="#A67C52" />
                                <span>{new Date(appointments[0].startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <div className="appt-detail-badge full-width">
                                <MapPin size={14} color="#A67C52" />
                                <span>City Care Hospital • {appointments[0].doctorSpecialization || "OPD"}</span>
                              </div>
                            </div>

                            <div className="appt-action-buttons">
                              <button
                                type="button"
                                className="primary-blue-btn"
                                onClick={openAppointments}
                              >
                                {t.viewAll}
                              </button>
                              <button
                                type="button"
                                className="outline-blue-btn"
                                onClick={() => setNotice("Appointment added to your calendar.")}
                              >
                                <Calendar size={15} /> {t.addToCalendar}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="no-appt-block" style={{ padding: "12px 0 6px 0", textAlign: "center" }}>
                            <div className="doc-avatar-img" style={{ margin: "0 auto 10px auto", width: "42px", height: "42px", borderRadius: "50%", background: "#F7F1E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Calendar size={22} color="#A67C52" />
                            </div>
                            <h4 style={{ margin: "0 0 4px 0", color: "#302820", fontSize: "15px", fontWeight: 600 }}>
                              {t.noUpcomingAppointmentsTitle}
                            </h4>
                            <p style={{ margin: "0 0 14px 0", color: "#76685B", fontSize: "13px" }}>
                              {t.noUpcomingAppointmentsSub}
                            </p>
                            <button
                              type="button"
                              className="primary-blue-btn"
                              onClick={() => { setError(""); setView("book"); }}
                              style={{ width: "100%", justifyContent: "center" }}
                            >
                              + {t.bookNewAppointmentBtn}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD 2: MY PRESCRIPTIONS */}
                    <div className="saas-dashboard-card rx-card">
                      <div className="dash-card-header">
                        <div className="dash-card-title-group">
                          <div className="dash-card-icon-box">
                            <FileText size={18} color="#A67C52" />
                          </div>
                          <h3 className="dash-card-heading">{t.activePrescriptionsHeading}</h3>
                        </div>
                        <button
                          type="button"
                          className="view-all-link-btn"
                          onClick={openPrescriptionsTab}
                        >
                          {t.viewAll}
                        </button>
                      </div>

                      <div className="dash-card-body stat-body">
                        <div className="stat-main-row">
                          <div className="stat-circle-icon">
                            <Pill size={28} color="#A67C52" />
                          </div>
                          <div>
                            <div className="stat-big-number">{prescriptions.length}</div>
                            <div className="stat-label">{t.activePrescriptionsLabel}</div>
                            <div className="stat-subtext">
                              {prescriptions.length > 0
                                ? `${t.lastUpdated} ${new Date(prescriptions[0].issuedAt || prescriptions[0].createdAt || Date.now()).toLocaleDateString(lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                : t.noPrescriptionsYetShort}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="soft-blue-action-btn"
                          onClick={openPrescriptionsTab}
                        >
                          {t.viewPrescriptionsBtn}
                        </button>
                      </div>
                    </div>

                    {/* CARD 3: HEALTH RECORDS */}
                    <div className="saas-dashboard-card records-card">
                      <div className="dash-card-header">
                        <div className="dash-card-title-group">
                          <div className="dash-card-icon-box">
                            <Folder size={18} color="#A67C52" />
                          </div>
                          <h3 className="dash-card-heading">{t.healthRecordsHeading}</h3>
                        </div>
                        <button
                          type="button"
                          className="view-all-link-btn"
                          onClick={openPrescriptionsTab}
                        >
                          {t.viewAll}
                        </button>
                      </div>

                      <div className="dash-card-body stat-body">
                        <div className="stat-main-row">
                          <div className="stat-circle-icon">
                            <FileText size={28} color="#A67C52" />
                          </div>
                          <div>
                            <div className="stat-big-number">{prescriptions.length}</div>
                            <div className="stat-label">{t.digitalConsultationNotes}</div>
                            <div className="stat-subtext">
                              {prescriptions.length > 0
                                ? t.verifiedByHospital
                                : t.noHealthRecordsYet}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="soft-blue-action-btn"
                          onClick={openPrescriptionsTab}
                        >
                          {t.viewRecordsBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. CARE JOURNEY */}
                  <div className="saas-care-journey-card">
                    <h3 className="care-journey-title">{t.careJourneyTitle}</h3>
                    <div className="journey-timeline-row">
                      <div className="journey-step-item completed">
                        <div className="step-circle">
                          <User size={16} color="#A67C52" />
                        </div>
                        <div className="step-label">{t.stepProfileSetup}</div>
                        <div className="step-status">{t.statusCompleted}</div>
                      </div>
                      <div className="journey-line completed" />
                      <div className="journey-step-item completed">
                        <div className="step-circle">
                          <Calendar size={16} color="#A67C52" />
                        </div>
                        <div className="step-label">{t.stepSlotSelection}</div>
                        <div className="step-status">{t.statusConfirmed}</div>
                      </div>
                      <div className="journey-line completed" />
                      <div className="journey-step-item active">
                        <div className="step-circle">
                          <CheckCircle size={16} color="#A67C52" />
                        </div>
                        <div className="step-label">{t.stepDoctorConsultation}</div>
                        <div className="step-status">{t.statusCompleted}</div>
                      </div>
                      <div className="journey-line" />
                      <div className="journey-step-item">
                        <div className="step-circle">
                          <Pill size={16} color="#A67C52" />
                        </div>
                        <div className="step-label">{t.stepDigitalPrescription}</div>
                        <div className="step-status">{t.statusConfirmed}</div>
                      </div>
                      <div className="journey-line" />
                      <div className="journey-step-item">
                        <div className="step-circle">
                          <CreditCard size={16} color="#A67C52" />
                        </div>
                        <div className="step-label">{t.stepPaymentReceipt}</div>
                        <div className="step-status">{t.statusCompleted}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE SUB-VIEW */}
              {view === "profile" && (
                <form className="card form wide-form" onSubmit={saveProfile}>
                  <h2 style={{ marginTop: 0 }}>{t.patientProfileTitle}</h2>
                  <div className="form-grid">
                    <label>
                      {t.fullNameLabel}
                      <input
                        name="fullName"
                        defaultValue={profile?.fullName || ""}
                        required
                      />
                    </label>
                    <label>
                      {t.dob}
                      <input
                        name="dateOfBirth"
                        type="date"
                        max={new Date(Date.now() - 86400000)
                          .toISOString()
                          .slice(0, 10)}
                        defaultValue={profile?.dateOfBirth || ""}
                        required
                      />
                    </label>
                    <label>
                      {t.phone}
                      <input
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        minLength={10}
                        maxLength={10}
                        title="Enter exactly 10 digits"
                        defaultValue={profile?.phone || ""}
                        required
                      />
                    </label>
                    <label>
                      {t.gender}
                      <select
                        name="gender"
                        defaultValue={profile?.gender || ""}
                        required
                      >
                        <option value="" disabled>
                          {t.selectGender}
                        </option>
                        <option value="MALE">{t.male}</option>
                        <option value="FEMALE">{t.female}</option>
                        <option value="NON_BINARY">{t.nonBinary}</option>
                        <option value="PREFER_NOT_TO_SAY">
                          {t.preferNotToSay}
                        </option>
                      </select>
                    </label>
                    <label>
                      {t.preferredLang}
                      <input
                        name="preferredLanguage"
                        defaultValue={profile?.preferredLanguage || ""}
                        required
                      />
                    </label>
                    <label>
                      {t.emergencyContact}
                      <input
                        name="emergencyContact"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        minLength={10}
                        maxLength={10}
                        title="Enter exactly 10 digits"
                        defaultValue={profile?.emergencyContact || ""}
                        required
                      />
                    </label>
                    <label>
                      {t.bloodGroup}
                      <select
                        name="bloodGroup"
                        defaultValue={profile?.bloodGroup || ""}
                        required
                      >
                        <option value="" disabled>
                          {t.selectBloodGroup}
                        </option>
                        <option value="A_POSITIVE">A+</option>
                        <option value="A_NEGATIVE">A-</option>
                        <option value="B_POSITIVE">B+</option>
                        <option value="B_NEGATIVE">B-</option>
                        <option value="AB_POSITIVE">AB+</option>
                        <option value="AB_NEGATIVE">AB-</option>
                        <option value="O_POSITIVE">O+</option>
                        <option value="O_NEGATIVE">O-</option>
                        <option value="UNKNOWN">{t.doNotKnow}</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    {t.address}
                    <textarea
                      name="address"
                      defaultValue={profile?.address || ""}
                      required
                    />
                  </label>
                  <label>
                    {t.allergiesOptional}
                    <textarea
                      name="allergies"
                      maxLength={1000}
                      defaultValue={profile?.allergies || ""}
                      placeholder={t.allergiesPlaceholder}
                    />
                  </label>
                  <label>
                    {t.medicalConditionsOptional}
                    <textarea
                      name="medicalConditions"
                      maxLength={1000}
                      defaultValue={profile?.medicalConditions || ""}
                      placeholder={t.medicalConditionsPlaceholder}
                    />
                  </label>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button disabled={busy} className="primary-btn" style={{ background: "#A67C52", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>{t.saveProfile}</button>
                    <button type="button" onClick={() => setView("home")} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>{t.backToOverview}</button>
                  </div>
                </form>
              )}

              {/* SETTINGS SUB-VIEW */}
              {view === "settings" && (
                <div className="card form wide-form">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #E7DED2", paddingBottom: "16px", marginBottom: "20px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#F7F1E8", color: "#A67C52", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SettingsIcon size={22} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "800", color: "#3D3228" }}>{t.accountPortalSettings}</h2>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#76685B" }}>{t.manageSettingsDesc}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* 1. NOTIFICATION PREFERENCES */}
                    <div style={{ background: "#FAF8F4", border: "1px solid #E7DED2", borderRadius: "14px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <Bell size={18} color="#A67C52" />
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#3D3228" }}>{t.notificationPreferences}</h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9rem", color: "#3D3228", cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked onChange={(e) => setNotice(e.target.checked ? "SMS appointment reminders enabled." : "SMS appointment reminders disabled.")} style={{ width: "18px", height: "18px", accentColor: "#A67C52" }} />
                          <div>
                            <strong>{t.smsReminders}</strong>
                            <div style={{ fontSize: "0.78rem", color: "#76685B" }}>{t.smsRemindersDesc}</div>
                          </div>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9rem", color: "#3D3228", cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked onChange={(e) => setNotice(e.target.checked ? "Email receipts enabled." : "Email receipts disabled.")} style={{ width: "18px", height: "18px", accentColor: "#A67C52" }} />
                          <div>
                            <strong>{t.emailReceipts}</strong>
                            <div style={{ fontSize: "0.78rem", color: "#76685B" }}>{t.emailReceiptsDesc}</div>
                          </div>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9rem", color: "#3D3228", cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked onChange={(e) => setNotice(e.target.checked ? "Digital prescription alerts enabled." : "Digital prescription alerts disabled.")} style={{ width: "18px", height: "18px", accentColor: "#A67C52" }} />
                          <div>
                            <strong>{t.prescriptionAlerts}</strong>
                            <div style={{ fontSize: "0.78rem", color: "#76685B" }}>{t.prescriptionAlertsDesc}</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 2. SECURITY & PASSWORD MANAGEMENT */}
                    <div style={{ background: "#FAF8F4", border: "1px solid #E7DED2", borderRadius: "14px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <Key size={18} color="#A67C52" />
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#3D3228" }}>{t.securityCredentials}</h3>
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        setNotice("Security credentials & password updated successfully.");
                      }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          <label>
                            {t.currentPassword}
                            <input type="password" placeholder="••••••••••••" required />
                          </label>
                          <label>
                            {t.newPassword}
                            <input type="password" minLength={12} placeholder="••••••••••••" required />
                          </label>
                        </div>
                        <button type="submit" style={{ alignSelf: "flex-start", background: "#A67C52", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                          {t.updatePassword}
                        </button>
                      </form>
                    </div>

                    {/* 3. PORTAL REGIONAL PREFERENCES */}
                    <div style={{ background: "#FAF8F4", border: "1px solid #E7DED2", borderRadius: "14px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <Globe size={18} color="#A67C52" />
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#3D3228" }}>{t.portalRegionalPreferences}</h3>
                      </div>
                      <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <label>
                          {t.preferredPortalLanguage}
                          <select value={lang} onChange={(e) => {
                            const newL = e.target.value as Language;
                            changeLanguage(newL);
                            setNotice(`Language preference changed to ${e.target.options[e.target.selectedIndex].text}.`);
                          }}>
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="ta">Tamil (தமிழ்)</option>
                          </select>
                        </label>
                        <label>
                          {t.portalDisplayTheme}
                          <select value={theme} onChange={(e) => {
                            const newT = e.target.value as "LIGHT" | "DARK";
                            changeTheme(newT);
                            setNotice("Theme preference saved.");
                          }}>
                            <option value="LIGHT">{t.lightTheme}</option>
                            <option value="DARK">{t.darkTheme}</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button type="button" onClick={() => setNotice("Settings & portal preferences saved successfully.")} style={{ background: "#A67C52", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>{t.saveAllSettings}</button>
                    <button type="button" onClick={() => setView("home")} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>{t.backToOverview}</button>
                  </div>
                </div>
              )}

              {/* BOOK APPOINTMENT SUB-VIEW */}
              {view === "book" && (
                <>
                  <form
                    className="card"
                    onSubmit={searchSlots}
                    style={{
                      display: "inline-flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                      margin: "0 0 16px 0",
                      maxWidth: "100%"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem", fontWeight: 700, color: "#A67C52", whiteSpace: "nowrap", paddingRight: "4px" }}>
                      <span>🔍</span>
                      <span>{t.findAppointment}</span>
                    </div>

                    <select
                      name="departmentId"
                      value={selectedDepartmentId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDepartmentId(val);
                        if (val && selectedDate) {
                          reloadAvailableSlots(val, selectedDate);
                          setSearchedSlots(true);
                        }
                      }}
                      required
                      aria-label={t.department}
                      style={{
                        height: "34px",
                        padding: "0 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.84rem",
                        background: "#f8fafc",
                        color: "#0f172a",
                        width: "180px",
                        maxWidth: "100%"
                      }}
                    >
                      <option value="">{t.chooseDepartment}</option>
                      {departments.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <input
                      name="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDate(val);
                        if (selectedDepartmentId && val) {
                          reloadAvailableSlots(selectedDepartmentId, val);
                          setSearchedSlots(true);
                        }
                      }}
                      min={new Date().toISOString().slice(0, 10)}
                      required
                      aria-label={t.date}
                      style={{
                        height: "34px",
                        padding: "0 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.84rem",
                        background: "#f8fafc",
                        color: "#0f172a",
                        width: "135px",
                        maxWidth: "100%"
                      }}
                    />

                    <button
                      type="submit"
                      disabled={busy}
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#A67C52",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {busy ? t.searching : t.searchSlots}
                    </button>
                  </form>
                  <div className="list-grid doctor-availability-grid" style={{ marginTop: "24px" }}>
                    {doctorAvailability.map((doctor) => (
                      <article className="card doctor-availability" key={doctor.doctorId}>
                        <header>
                          <h3>{getLocalizedDisplayName(doctor.doctorName, lang)}</h3>
                          <p>{doctor.specialization}</p>
                        </header>
                        <p className="slot-count">
                          {doctor.slots.length} {t.availableTimes}
                        </p>
                        <div className="time-slot-grid" aria-label={`Available times for ${getLocalizedDisplayName(doctor.doctorName, lang)}`}>
                          {doctor.slots.map((slot) => (
                            <button
                              type="button"
                              disabled={busy}
                              key={slot.startsAt}
                              onClick={() => book(slot)}
                              aria-label={`Book ${getLocalizedDisplayName(doctor.doctorName, lang)} at ${new Date(slot.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                            >
                              {new Date(slot.startsAt).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </button>
                          ))}
                        </div>
                        <small>{t.selectTimeToReserve}</small>
                      </article>
                    ))}
                    {!searchedSlots && (
                      <p className="muted">
                        {t.chooseDeptAndDatePrompt}
                      </p>
                    )}
                    {searchedSlots && slots.length === 0 && (
                      <p className="empty-result" role="status">
                        {t.noSlotsFound}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* APPOINTMENTS SUB-VIEW */}
              {view === "appointments" && (
                <div className="list-grid">
                  <h2 style={{ gridColumn: "1 / -1", marginTop: 0 }}>{t.myAppointments}</h2>
                  {appointments.map((a) => {
                    const pmt = payments.find((p) => p.appointmentId === a.appointmentId && p.status === "PAID");
                    const rawDoc = a.doctorName
                      ? a.doctorName.startsWith("Dr.") || a.doctorName.startsWith("Dr ")
                        ? a.doctorName
                        : `Dr. ${a.doctorName}`
                      : null;
                    const docNameClean = rawDoc ? getLocalizedDisplayName(rawDoc, lang) : null;
                    return (
                      <article className="card" key={a.appointmentId}>
                        <h3>{a.appointmentNumber}</h3>
                        {docNameClean && (
                          <div style={{ fontWeight: 600, color: "#A67C52", margin: "0.4rem 0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span>🩺</span>
                            <span>{docNameClean} {a.doctorSpecialization ? `(${a.doctorSpecialization})` : ""}</span>
                          </div>
                        )}
                        <p>
                          <strong>{new Date(a.startsAt).toLocaleString()}</strong>
                        </p>
                        <p>
                          {t.statusLabel} <span className="status">{a.status}</span>
                        </p>
                        {a.status === "CANCELLED" && a.cancellationReason && (
                          <div style={{ fontSize: "0.85rem", color: "#3D3228", marginTop: "0.4rem", background: "#F7F1E8", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E7DED2" }}>
                            <strong>Reason:</strong> {a.cancellationReason}
                          </div>
                        )}
                        {a.status === "NO_SHOW" && (
                          <div style={{ fontSize: "0.85rem", color: "#991b1b", marginTop: "0.4rem", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>⚠️</span>
                            <span><strong>Missed Appointment:</strong> You were unable to attend this appointment. Reschedule it below.</span>
                          </div>
                        )}
                        {a.status === "RESCHEDULED" && (
                          <div style={{ fontSize: "0.85rem", color: "#166534", marginTop: "0.4rem", background: "#f0fdf4", padding: "6px 10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                            ✓ This appointment was rescheduled to a new slot.
                          </div>
                        )}
                        {pmt ? (
                          <div style={{ margin: "0.5rem 0" }}>
                            <span className="status" style={{ background: "#F7F1E8", color: "#A67C52" }}>
                              {t.paidBadge} (₹{pmt.amountMinor / 100})
                            </span>
                            <button
                              style={{ marginLeft: "0.5rem", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                              onClick={() => viewReceipt(pmt.paymentId)}
                            >
                              {t.viewReceipt}
                            </button>
                          </div>
                        ) : (
                          a.status === "CONFIRMED" && (
                            <div style={{ margin: "0.5rem 0" }}>
                              <button
                                style={{ background: "#A67C52", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" }}
                                onClick={() => setActivePaymentModal({ appointmentId: a.appointmentId, appointmentNumber: a.appointmentNumber })}
                              >
                                {t.payNow}
                              </button>
                            </div>
                          )
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.6rem" }}>
                          {["REQUESTED", "CONFIRMED"].includes(a.status) && (
                            <button
                              className="destructive-action"
                              disabled={busy}
                              onClick={() => {
                                setCancelModalAppointment({ id: a.appointmentId, number: a.appointmentNumber });
                                setCancelReasonInput("");
                              }}
                            >
                              {t.cancelAppointment}
                            </button>
                          )}
                          {["CONFIRMED", "REQUESTED", "NO_SHOW", "CANCELLED", "CHECKED_IN"].includes(a.status) && (
                            <button
                              className="secondary-action"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.45rem 0.9rem",
                                fontWeight: 600,
                                backgroundColor: a.status === "NO_SHOW" ? "#fef2f2" : undefined,
                                borderColor: a.status === "NO_SHOW" ? "#ef4444" : undefined,
                                color: a.status === "NO_SHOW" ? "#b91c1c" : undefined,
                              }}
                              disabled={busy}
                              onClick={() => openRescheduleModal(a)}
                            >
                              <Clock size={15} />
                              {a.status === "NO_SHOW" ? "Reschedule Missed Appointment" : "Reschedule"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {appointments.length === 0 && (
                    <p className="muted" style={{ gridColumn: "1 / -1" }}>{t.noAppointmentsYet}</p>
                  )}
                </div>
              )}

              {/* PAYMENTS SUB-VIEW */}
              {view === "payments" && (
                <div className="list-grid">
                  <h2 style={{ gridColumn: "1 / -1", marginTop: 0 }}>{t.paymentsAndReceiptsTitle}</h2>
                  {payments.map((p) => (
                    <article className="card" key={p.paymentId}>
                      <h3>Payment ID: {p.paymentId.substring(0, 8)}</h3>
                      <p>{t.amount} <strong>₹{p.amountMinor / 100} {p.currency}</strong></p>
                      <p>{t.provider} {p.provider} ({p.paymentMethod || "CARD"})</p>
                      <p>{t.statusLabel} <span className="status">{p.status}</span></p>
                      {p.paidAt && <p><small>{t.paidAt} {new Date(p.paidAt).toLocaleString()}</small></p>}
                      {p.status === "PAID" && (
                        <button onClick={() => viewReceipt(p.paymentId)}>
                          {t.viewReceipt}
                        </button>
                      )}
                    </article>
                  ))}
                  {payments.length === 0 && (
                    <p className="muted" style={{ gridColumn: "1 / -1" }}>{t.noPaymentsFound}</p>
                  )}
                </div>
              )}

              {/* PRESCRIPTIONS SUB-VIEW */}
              {view === "prescriptions" && (
                <div className="list-grid">
                  <h2 style={{ gridColumn: "1 / -1", marginTop: 0 }}>{t.myPrescriptionsTitle} ({prescriptions.length})</h2>
                  {prescriptions.map((p) => (
                    <article className="card" key={p.prescriptionId}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3>Rx: {p.prescriptionNumber}</h3>
                        <span className="status" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                          {p.status}
                        </span>
                      </div>
                      <p><strong>{t.doctor}</strong> {getLocalizedDisplayName(p.doctorName ? `Dr. ${p.doctorName}` : "Dr. Anitha Kumar", lang)} ({p.departmentName})</p>
                      <p><strong>{t.diagnosis}</strong> {p.diagnosis || "General Consultation"}</p>
                      <p><small>{t.issuedOn} {new Date(p.createdAt).toLocaleString()}</small></p>
                      <p>{t.prescribedMedicines} <strong>{p.items?.length || 0}</strong></p>
                      <div className="button-grid" style={{ marginTop: "1rem" }}>
                        <button onClick={() => setSelectedPrescription(p)}>
                          {t.viewPrescriptionDetails}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadPrescriptionDoc(p.prescriptionId, p.prescriptionNumber)}
                          className="secondary"
                          style={{ padding: "8px 16px", borderRadius: "6px", textAlign: "center", cursor: "pointer" }}
                        >
                          {t.downloadDocument}
                        </button>
                      </div>
                    </article>
                  ))}
                  {prescriptions.length === 0 && (
                    <p className="muted" style={{ gridColumn: "1 / -1" }}>{t.noPrescriptionsYet}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* 9. FOOTER */}
          <footer className="saas-footer">
            <div>{t.allRightsReserved}</div>
            <div className="footer-compliance-links">
              <span className="footer-link-item">
                <ShieldCheck size={15} color="#A67C52" /> {t.hipaaCompliant}
              </span>
              <span className="footer-divider-pipe">|</span>
              <span className="footer-link-item">
                <Lock size={14} color="#A67C52" /> {t.encryption}
              </span>
              <span className="footer-divider-pipe">|</span>
              <span className="footer-link-item">
                <Headphones size={15} color="#A67C52" /> {t.support247}
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* ENHANCED MULTI-GATEWAY CHECKOUT MODAL */}
      {activePaymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: "500px", width: "95%", background: "#ffffff", color: "#3D3228", padding: "1.75rem", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(61,50,40,0.1), 0 8px 10px -6px rgba(61,50,40,0.08)" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.5rem", fontWeight: "700" }}>Payment Checkout</h2>
            <p style={{ color: "#76685B", margin: "0.25rem 0 1rem 0" }}>Appointment: <strong>{activePaymentModal.appointmentNumber}</strong></p>
            
            <div style={{ padding: "1rem", background: "#FAF8F4", borderRadius: "12px", border: "1px solid #E7DED2", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#76685B" }}>Total Amount Due:</span>
                <strong style={{ fontSize: "1.4rem", color: "#3D3228" }}>₹1,000.00 INR</strong>
              </div>
            </div>

            {/* Gateway Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Select Payment Gateway:</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                <button 
                  type="button" 
                  style={{ background: selectedGateway === "MOCK" ? "#A67C52" : "#F7F1E8", color: selectedGateway === "MOCK" ? "#fff" : "#3D3228", border: "1px solid #E7DED2", borderRadius: "8px", padding: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}
                  onClick={() => setSelectedGateway("MOCK")}
                >
                  Mock (Demo)
                </button>
                <button 
                  type="button" 
                  style={{ background: selectedGateway === "RAZORPAY" ? "#A67C52" : "#F7F1E8", color: selectedGateway === "RAZORPAY" ? "#fff" : "#3D3228", border: "1px solid #E7DED2", borderRadius: "8px", padding: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}
                  onClick={() => setSelectedGateway("RAZORPAY")}
                >
                  Razorpay
                </button>
                <button 
                  type="button" 
                  style={{ background: selectedGateway === "STRIPE" ? "#A67C52" : "#F7F1E8", color: selectedGateway === "STRIPE" ? "#fff" : "#3D3228", border: "1px solid #E7DED2", borderRadius: "8px", padding: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}
                  onClick={() => setSelectedGateway("STRIPE")}
                >
                  Stripe
                </button>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Select Payment Method:</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                {["CARD", "UPI", "NET_BANKING", "WALLET"].map((method) => (
                  <button 
                    key={method} 
                    type="button"
                    style={{ background: selectedMethod === method ? "#F7F1E8" : "#ffffff", color: selectedMethod === method ? "#A67C52" : "#3D3228", border: selectedMethod === method ? "2px solid #A67C52" : "1px solid #E7DED2", borderRadius: "8px", padding: "0.5rem", fontSize: "0.8rem", textAlign: "center", cursor: "pointer" }}
                    onClick={() => setSelectedMethod(method)}
                  >
                    {method.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Sandbox Action Controls */}
            <div style={{ padding: "0.875rem", background: "#fffbebf5", border: "1px solid #fef3c7", borderRadius: "10px", marginBottom: "1.25rem" }}>
              <small style={{ color: "#b45309", display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Demo Sandbox Controls:</small>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <button 
                  type="button" 
                  style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem", cursor: "pointer" }} 
                  disabled={busy} 
                  onClick={() => executePaymentFlow(activePaymentModal.appointmentId, "SUCCESS")}
                >
                  {busy ? "Processing..." : "✓ Simulate Successful Payment"}
                </button>
                <button 
                  type="button" 
                  style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }} 
                  disabled={busy} 
                  onClick={() => executePaymentFlow(activePaymentModal.appointmentId, "FAILED")}
                >
                  ✗ Simulate Failed Payment
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" style={{ background: "#94a3b8", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer" }} onClick={() => setActivePaymentModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: "500px", width: "90%", background: "#fff", color: "#1e293b", padding: "1.5rem", borderRadius: "12px" }}>
            <h2 style={{ marginTop: 0, color: "#16a34a" }}>✓ Payment Receipt</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>Receipt No: <strong>{receiptData.receiptNumber}</strong></p>
            <hr style={{ border: "0.5px solid #e2e8f0", margin: "0.75rem 0" }} />
            <p>Amount Paid: <strong style={{ fontSize: "1.2rem", color: "#0f172a" }}>₹{receiptData.amountMinor / 100} {receiptData.currency}</strong></p>
            <p>Transaction ID: <code>{receiptData.transactionId}</code></p>
            <p>Provider: <strong>{receiptData.provider}</strong> ({receiptData.paymentMethod})</p>
            <p>Status: <span style={{ background: "#dcfce7", color: "#15803d", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>{receiptData.status}</span></p>
            <p><small>Paid Date: {new Date(receiptData.paidAt).toLocaleString()}</small></p>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1rem" }}>{receiptData.hospitalInfo}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="button" onClick={() => setReceiptData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION DETAIL MODAL */}
      {selectedPrescription && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
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
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ borderBottom: "2px solid #047857", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#0f172a" }}>CAREFLOW SMART HOSPITAL</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>Digital Medical Prescription Document</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <div>
                <strong>Prescription No:</strong> {selectedPrescription.prescriptionNumber}<br />
                <strong>Patient:</strong> {selectedPrescription.patientName} ({selectedPrescription.patientNumber})
              </div>
              <div>
                <strong>Doctor:</strong> Dr. {selectedPrescription.doctorName}<br />
                <strong>Department:</strong> {selectedPrescription.departmentName}<br />
                <strong>Issued Date:</strong> {new Date(selectedPrescription.createdAt).toLocaleDateString()}
              </div>
            </div>

            {selectedPrescription.diagnosis && (
              <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis}</p>
            )}

            <h4>Prescribed Medications ({selectedPrescription.items?.length || 0}):</h4>
            <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Medicine</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Dosage</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Frequency</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Duration</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrescription.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>
                        <strong>{item.medicineName}</strong>
                        {item.genericName && <div style={{ fontSize: "12px", color: "#64748b" }}>({item.genericName})</div>}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{item.dosage}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{item.frequency}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{item.duration}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{item.foodInstruction} {item.specialInstructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedPrescription.doctorAdvice && (
              <p><strong>Doctor Advice:</strong> {selectedPrescription.doctorAdvice}</p>
            )}
            {selectedPrescription.followUpDate && (
              <p><strong>Follow-Up Date:</strong> {selectedPrescription.followUpDate}</p>
            )}

            <div style={{ margin: "1.5rem 0", fontSize: "12px", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "1rem" }}>
              Prescription generated by the treating doctor Dr. {selectedPrescription.doctorName}. CareFlow Digital Health Record Verification.
            </div>

            <div className="button-grid" style={{ display: "flex", gap: "1rem" }}>
              <button type="button" className="secondary-action" onClick={() => setSelectedPrescription(null)}>
                Close
              </button>
              <button
                type="button"
                onClick={() => downloadPrescriptionDoc(selectedPrescription.prescriptionId, selectedPrescription.prescriptionNumber)}
                className="brand"
                style={{ padding: "10px 20px", background: "#A67C52", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                📥 Download / Print Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CANCEL APPOINTMENT MODAL */}
      {cancelModalAppointment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span>
                <span>Cancel Appointment ({cancelModalAppointment.number})</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "14px" }}>
              Please provide a reason for cancelling this appointment:
            </p>
            <textarea
              rows={3}
              placeholder="Reason for cancellation (e.g. Schedule conflict, emergency, health condition improved...)"
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit"
              }}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={busy || !cancelReasonInput.trim()}
                onClick={() => confirmCancellation()}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: busy || !cancelReasonInput.trim() ? 0.6 : 1
                }}
              >
                {busy ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleModalAppointment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px 28px",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(226, 232, 240, 0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.4rem" }}>📅</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
                    Reschedule Appointment
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {rescheduleModalAppointment.appointmentNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalAppointment(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* Current Appointment Snapshot */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                fontSize: "0.88rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Doctor:</span>
                <strong style={{ color: "#0f172a" }}>
                  {rescheduleModalAppointment.doctorName || "Assigned Doctor"}{" "}
                  {rescheduleModalAppointment.doctorSpecialization ? `(${rescheduleModalAppointment.doctorSpecialization})` : ""}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Original Scheduled Time:</span>
                <span style={{ color: "#334155" }}>
                  {new Date(rescheduleModalAppointment.startsAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Current Status:</span>
                <span className="status" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  {rescheduleModalAppointment.status}
                </span>
              </div>
            </div>

            {/* Date Picker */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Select New Appointment Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadRescheduleSlots(rescheduleModalAppointment.doctorId, e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Available Time Slots Grid */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Available Time Slots
              </label>
              {loadingRescheduleSlots ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.9rem" }}>
                  Loading available slots...
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", fontSize: "0.88rem" }}>
                  No available slots found for this date. Please pick another date.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: "8px", maxHeight: "170px", overflowY: "auto", padding: "4px" }}>
                  {rescheduleSlots.map((slot) => {
                    const isSelected = selectedRescheduleSlot?.startsAt === slot.startsAt;
                    const timeLabel = new Date(slot.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedRescheduleSlot(slot)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          color: isSelected ? "#1d4ed8" : "#334155",
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {timeLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reschedule Reason / Note */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Reason for Rescheduling (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Doctor / Patient unavailable, missed earlier slot"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setRescheduleModalAppointment(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !selectedRescheduleSlot}
                onClick={() => confirmReschedule()}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: busy || !selectedRescheduleSlot ? 0.6 : 1
                }}
              >
                {busy ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
