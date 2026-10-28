"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, loadSession, sessionFetch } from "../lib/session";
import AppHeader from "../components/Header";
import { useLanguage } from "../lib/i18n";
import BackButton from "../components/BackButton";

import { API } from "../lib/api";

type Row = Record<string, unknown>;

type Me = {
  userId?: string;
  email: string;
  roles: string[];
};

type Department = {
  departmentId: string;
  name: string;
};

type DoctorView = {
  doctorId: string;
  userId: string;
  doctorNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee?: number;
  verificationStatus: string;
  active: boolean;
};

type StaffView = {
  staffId: string;
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  departmentId?: string;
  departmentName?: string;
  staffType: string;
  designation: string;
  joiningDate?: string;
  active: boolean;
  createdAt: string;
};

type UserView = {
  userId: string;
  email: string;
  status: string;
  createdAt: string;
  roles: string[];
  fullName?: string;
};

type PatientSearchResult = {
  patient_id: string;
  patient_number: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
};

type EmergencyCaseView = {
  emergency_case_id: string;
  patient_id?: string;
  patient_name?: string;
  patient_number?: string;
  patient_gender?: string;
  patient_dob?: string;
  acuity: number;
  status: string;
  presenting_complaint: string;
  arrival_mode?: string;
  assigned_doctor_id?: string;
  doctor_name?: string;
  department_id?: string;
  department_name?: string;
  bed_number?: string;
  triage_vitals?: string;
  notes?: string;
  opened_at: string;
  updated_at: string;
};

type EmergencyStats = {
  waitingPatients: number;
  criticalCases: number;
  inAssessment: number;
  inTreatment: number;
  availableBeds: number;
  occupiedBeds: number;
  admittedToday: number;
};

type LabOrderView = {
  lab_order_id: string;
  patient_id: string;
  patient_name?: string;
  patient_number?: string;
  ordered_by: string;
  ordered_by_email?: string;
  test_code: string;
  test_name?: string;
  category?: string;
  priority: string;
  status: string;
  result_summary?: string;
  result_flag?: string;
  reference_range?: string;
  unit?: string;
  technician_name?: string;
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
};

type LabStats = {
  pendingOrders: number;
  samplesCollected: number;
  processing: number;
  completed: number;
  criticalResults: number;
  todaysTests: number;
};

type InvoiceItem = {
  itemId?: string;
  category: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor?: number;
};

type InvoiceView = {
  invoice_id: string;
  patient_id: string;
  patient_name?: string;
  patient_number?: string;
  appointment_id?: string;
  amount_minor: number;
  paid_amount_minor: number;
  discount_minor: number;
  tax_minor: number;
  currency: string;
  status: string;
  notes?: string;
  created_at: string;
  items?: InvoiceItem[];
};

type BillingStats = {
  todaysRevenueMinor: number;
  pendingPaymentsCount: number;
  paidInvoicesCount: number;
  partiallyPaidCount: number;
  refundsCount: number;
  todaysTransactionsCount: number;
};

const SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Dermatology", "Pediatrics",
  "General Medicine", "ENT", "Gynecology", "Anesthesiology", "Emergency Medicine",
  "Endocrinology", "Gastroenterology", "General Surgery", "Oncology",
  "Ophthalmology", "Psychiatry", "Pulmonology", "Radiology", "Urology"
];

const STAFF_TYPES = [
  "RECEPTIONIST",
  "APPOINTMENT_COORDINATOR",
  "NURSE",
  "LAB_TECHNICIAN",
  "BILLING",
  "EMERGENCY",
  "OPERATIONS",
  "PHARMACIST",
  "ADMINISTRATIVE"
];

const LAB_CATEGORIES = [
  "General", "Blood", "Urine", "Biochemistry", "Microbiology", "Pathology", "Imaging"
];

const INVOICE_CATEGORIES = [
  "Consultation", "Laboratory", "Emergency", "Procedure", "Medicine", "Other"
];

function parseUuid(val: unknown): string | null | undefined {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) return trimmed;
  return undefined; // signals invalid non-empty string
}

export default function OperationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [view, setView] = useState("Dashboard");

  // Shared Reference Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorView[]>([]);
  const [staffList, setStaffList] = useState<StaffView[]>([]);
  const [usersList, setUsersList] = useState<UserView[]>([]);

  // Patient Search State
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  // Admin Search & Filters
  const [docSearch, setDocSearch] = useState("");
  const [docDeptFilter, setDocDeptFilter] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("");

  const [staffSearch, setStaffSearch] = useState("");
  const [staffDeptFilter, setStaffDeptFilter] = useState("");
  const [staffTypeFilter, setStaffTypeFilter] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  // EMERGENCY MODULE STATE
  const [emergencyStats, setEmergencyStats] = useState<EmergencyStats | null>(null);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCaseView[]>([]);
  const [capacityList, setCapacityList] = useState<Record<string, unknown>[]>([]);
  const [emAcuityFilter, setEmAcuityFilter] = useState("");
  const [emStatusFilter, setEmStatusFilter] = useState("");
  const [emDeptFilter, setEmDeptFilter] = useState("");
  const [emSearch, setEmSearch] = useState("");
  const [emModalOpen, setEmModalOpen] = useState(false);
  const [emDetailCase, setEmDetailCase] = useState<EmergencyCaseView | null>(null);

  // LABORATORY MODULE STATE
  const [labStats, setLabStats] = useState<LabStats | null>(null);
  const [labOrders, setLabOrders] = useState<LabOrderView[]>([]);
  const [labCategoryFilter, setLabCategoryFilter] = useState("");
  const [labPriorityFilter, setLabPriorityFilter] = useState("");
  const [labStatusFilter, setLabStatusFilter] = useState("");
  const [labSearch, setLabSearch] = useState("");
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labResultModalOpen, setLabResultModalOpen] = useState(false);
  const [targetLabForResult, setTargetLabForResult] = useState<LabOrderView | null>(null);
  const [targetLabForReport, setTargetLabForReport] = useState<LabOrderView | null>(null);

  // BILLING MODULE STATE
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceItem[]>([
    { category: "Consultation", description: "Standard Consultation Fee", quantity: 1, unitPriceMinor: 50000 }
  ]);
  const [discountRupees, setDiscountRupees] = useState(0);
  const [taxRupees, setTaxRupees] = useState(0);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<Record<string, unknown> | null>(null);

  // Modal & Dialog States
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorView | null>(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffView | null>(null);

  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    type: "doctor" | "staff" | "user" | "emergency" | "lab";
    id: string;
    action: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (loadSession()) {
      setReady(true);
      loadIdentity();
    } else {
      router.replace("/");
    }
  }, [router]);

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

  async function loadIdentity() {
    try {
      const identity: Me = await api("/api/v1/auth/me");
      setMe(identity);

      // Strict role-based redirect: only ADMIN is authorized in operations portal
      if (!identity?.roles?.includes("ADMIN")) {
        if (identity?.roles?.includes("DOCTOR")) {
          router.replace("/doctor");
        } else if (identity?.roles?.includes("STAFF")) {
          router.replace("/staff");
        } else {
          router.replace("/patient");
        }
        return;
      }

      const depts = await api("/api/v1/departments").catch(() => []);
      setDepartments(depts);
      const docList = await api("/api/v1/admin/doctors").catch(() => []);
      setDoctors(docList);
      await load("/api/v1/operations/dashboard", "Dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    }
  }

  async function load(path: string, name: string) {
    setError("");
    try {
      if (name === "Dashboard") {
        const body = await api(path);
        setDashboard(body);
        setView(name);
      } else if (name === "Doctors") {
        const query = new URLSearchParams();
        if (docSearch) query.set("search", docSearch);
        if (docDeptFilter) query.set("departmentId", docDeptFilter);
        if (docStatusFilter) query.set("active", docStatusFilter === "active" ? "true" : "false");
        const list = await api(`/api/v1/admin/doctors?${query.toString()}`);
        setDoctors(list);
        setView(name);
      } else if (name === "Staff") {
        const query = new URLSearchParams();
        if (staffSearch) query.set("search", staffSearch);
        if (staffDeptFilter) query.set("departmentId", staffDeptFilter);
        if (staffTypeFilter) query.set("staffType", staffTypeFilter);
        if (staffStatusFilter) query.set("active", staffStatusFilter === "active" ? "true" : "false");
        const list = await api(`/api/v1/admin/staff?${query.toString()}`);
        setStaffList(list);
        setView(name);
      } else if (name === "User Management") {
        const query = new URLSearchParams();
        if (userSearch) query.set("search", userSearch);
        if (userRoleFilter) query.set("role", userRoleFilter);
        if (userStatusFilter) query.set("status", userStatusFilter);
        const list = await api(`/api/v1/admin/users?${query.toString()}`);
        setUsersList(list);
        setView(name);
      } else if (name === "Emergency queue" || name === "Emergency") {
        const query = new URLSearchParams();
        if (emAcuityFilter) query.set("acuity", emAcuityFilter);
        if (emStatusFilter) query.set("status", emStatusFilter);
        if (emDeptFilter) query.set("departmentId", emDeptFilter);
        if (emSearch) query.set("search", emSearch);
        const [stats, casesList, capacityData] = await Promise.all([
          api("/api/v1/operations/emergency/stats").catch(() => null),
          api(`/api/v1/operations/emergency-cases?${query.toString()}`).catch(() => []),
          api("/api/v1/operations/capacity").catch(() => [])
        ]);
        setEmergencyStats(stats);
        setEmergencyCases(casesList);
        setCapacityList(capacityData);
        setView("Emergency");
      } else if (name === "Laboratory") {
        const query = new URLSearchParams();
        if (labCategoryFilter) query.set("category", labCategoryFilter);
        if (labPriorityFilter) query.set("priority", labPriorityFilter);
        if (labStatusFilter) query.set("status", labStatusFilter);
        if (labSearch) query.set("search", labSearch);
        const [stats, ordersList] = await Promise.all([
          api("/api/v1/operations/lab/stats").catch(() => null),
          api(`/api/v1/operations/lab-orders?${query.toString()}`).catch(() => [])
        ]);
        setLabStats(stats);
        setLabOrders(ordersList);
        setView("Laboratory");
      } else if (name === "Billing") {
        const query = new URLSearchParams();
        if (invoiceStatusFilter) query.set("status", invoiceStatusFilter);
        if (invoiceSearch) query.set("search", invoiceSearch);
        const [stats, invoicesList] = await Promise.all([
          api("/api/v1/operations/billing/stats").catch(() => null),
          api(`/api/v1/operations/invoices?${query.toString()}`).catch(() => [])
        ]);
        setBillingStats(stats);
        setInvoices(invoicesList);
        setView("Billing");
      } else {
        const body = await api(path);
        setRows(body);
        setView(name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  // PATIENT SEARCH HANDLER
  async function searchPatients(q: string) {
    setPatientSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setPatientSearchResults([]);
      return;
    }
    try {
      const results = await api(`/api/v1/operations/patients/search?query=${encodeURIComponent(q.trim())}`);
      setPatientSearchResults(results);
    } catch {}
  }

  // --- EMERGENCY ACTIONS ---
  async function handleCreateEmergencyCase(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const rawPat = selectedPatient?.patient_id || (f.get("patientId") as string);
    const patUuid = parseUuid(rawPat);
    if (patUuid === undefined) {
      setError("Invalid Patient ID format. Please search and select a patient from the autocomplete list or provide a valid 36-character UUID.");
      return;
    }
    const deptUuid = parseUuid(f.get("departmentId"));
    if (deptUuid === undefined) {
      setError("Invalid Department ID format. Please select a valid department from the dropdown.");
      return;
    }
    const docUuid = parseUuid(f.get("assignedDoctorId"));
    if (docUuid === undefined) {
      setError("Invalid Doctor ID format. Please select a valid doctor from the dropdown.");
      return;
    }
    try {
      await api("/api/v1/operations/emergency-cases", {
        method: "POST",
        body: JSON.stringify({
          patientId: patUuid,
          acuity: Number(f.get("acuity")),
          presentingComplaint: f.get("presentingComplaint"),
          arrivalMode: f.get("arrivalMode") || "WALK_IN",
          departmentId: deptUuid,
          assignedDoctorId: docUuid,
          bedNumber: f.get("bedNumber") || null,
          triageVitals: f.get("triageVitals") || null,
          notes: f.get("notes") || null,
        }),
      });
      setNotice("Emergency case opened successfully.");
      setEmModalOpen(false);
      setSelectedPatient(null);
      setPatientSearchQuery("");
      await load("", "Emergency");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not open emergency case");
    }
  }

  async function updateEmergencyStatus(caseId: string, status: string) {
    try {
      await api(`/api/v1/operations/emergency-cases/${caseId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(`Emergency case status updated to ${status}.`);
      await load("", "Emergency");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function createCapacity(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const deptUuid = parseUuid(f.get("departmentId"));
    if (!deptUuid) {
      setError("Please select a valid department for capacity snapshot.");
      return;
    }
    const staffed = Number(f.get("staffedBeds"));
    const occupied = Number(f.get("occupiedBeds"));
    if (occupied > staffed) {
      setError("Occupied beds cannot exceed staffed beds.");
      return;
    }
    try {
      await api("/api/v1/operations/capacity", {
        method: "POST",
        body: JSON.stringify({
          departmentId: deptUuid,
          staffedBeds: staffed,
          occupiedBeds: occupied,
          waitingPatients: Number(f.get("waitingPatients")),
        }),
      });
      setNotice("Bed capacity snapshot saved successfully.");
      await load("", "Emergency");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not save capacity");
    }
  }

  // --- LABORATORY ACTIONS ---
  async function handleCreateLabOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const rawPat = selectedPatient?.patient_id || (f.get("patientId") as string);
    const patUuid = parseUuid(rawPat);
    if (!patUuid) {
      setError("Please search and select a valid patient for the lab order.");
      return;
    }
    try {
      await api("/api/v1/operations/lab-orders", {
        method: "POST",
        body: JSON.stringify({
          patientId: patUuid,
          testCode: f.get("testCode"),
          testName: f.get("testName") || f.get("testCode"),
          category: f.get("category") || "General",
          priority: f.get("priority") || "ROUTINE",
          clinicalNotes: f.get("clinicalNotes") || null,
        }),
      });
      setNotice("Laboratory test order created successfully.");
      setLabModalOpen(false);
      setSelectedPatient(null);
      setPatientSearchQuery("");
      await load("", "Laboratory");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not create lab order");
    }
  }

  async function updateLabStatus(orderId: string, status: string) {
    try {
      await api(`/api/v1/operations/lab-orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(`Lab order status updated to ${status}.`);
      await load("", "Laboratory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lab update failed");
    }
  }

  async function handleSaveLabResult(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!targetLabForResult) return;
    const f = new FormData(e.currentTarget);
    try {
      await api(`/api/v1/operations/lab-orders/${targetLabForResult.lab_order_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "COMPLETED",
          resultSummary: f.get("resultSummary"),
          resultFlag: f.get("resultFlag") || "NORMAL",
          referenceRange: f.get("referenceRange") || null,
          unit: f.get("unit") || null,
          technicianName: f.get("technicianName") || null,
        }),
      });
      setNotice("Lab result recorded and order marked COMPLETED.");
      setLabResultModalOpen(false);
      setTargetLabForResult(null);
      await load("", "Laboratory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record lab result");
    }
  }

  // --- BILLING ACTIONS ---
  function addInvoiceLineItem() {
    setInvoiceLineItems([
      ...invoiceLineItems,
      { category: "Other", description: "Service Item", quantity: 1, unitPriceMinor: 10000 }
    ]);
  }

  function removeInvoiceLineItem(idx: number) {
    if (invoiceLineItems.length <= 1) return;
    setInvoiceLineItems(invoiceLineItems.filter((_, i) => i !== idx));
  }

  function updateLineItem(idx: number, field: keyof InvoiceItem, val: unknown) {
    const updated = [...invoiceLineItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setInvoiceLineItems(updated);
  }

  const invoiceSubtotalMinor = invoiceLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPriceMinor), 0);
  const discountMinor = Math.max(0, discountRupees * 100);
  const taxMinor = Math.max(0, taxRupees * 100);
  const invoiceGrandTotalMinor = Math.max(0, invoiceSubtotalMinor - discountMinor + taxMinor);

  async function handleCreateInvoice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const rawPat = selectedPatient?.patient_id || (f.get("patientId") as string);
    const patUuid = parseUuid(rawPat);
    if (!patUuid) {
      setError("Please search and select a valid patient for the invoice.");
      return;
    }
    const apptUuid = parseUuid(f.get("appointmentId"));
    if (apptUuid === undefined) {
      setError("Invalid Appointment ID format.");
      return;
    }
    try {
      await api("/api/v1/operations/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId: patUuid,
          appointmentId: apptUuid,
          amountMinor: invoiceGrandTotalMinor,
          currency: "INR",
          discountMinor,
          taxMinor,
          notes: f.get("notes") || null,
          items: invoiceLineItems.map((item) => ({
            category: item.category,
            description: item.description,
            quantity: Number(item.quantity),
            unitPriceMinor: Number(item.unitPriceMinor),
          })),
        }),
      });
      setNotice("Invoice created successfully.");
      setInvoiceModalOpen(false);
      setSelectedPatient(null);
      setPatientSearchQuery("");
      await load("", "Billing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    }
  }

  async function handlePayInvoice(invoice: InvoiceView) {
    setError("");
    try {
      // 1. Create Payment Order
      const order = await api("/api/v1/payments/orders", {
        method: "POST",
        body: JSON.stringify({
          patientId: invoice.patient_id,
          invoiceId: invoice.invoice_id,
          amountMinor: invoice.amount_minor,
          currency: invoice.currency || "INR",
          provider: "MOCK",
        }),
      });

      // 2. Verify Payment (Mock execution)
      await api("/api/v1/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          paymentId: order.paymentId,
          providerPaymentId: "pay_mock_" + Date.now(),
          providerSignature: "mock_signature_ok",
          paymentMethod: "CARD",
        }),
      });

      setNotice("Payment processed successfully! Invoice marked PAID.");
      
      // Fetch Receipt
      const rcpt = await api(`/api/v1/payments/${order.paymentId}/receipt`).catch(() => null);
      if (rcpt) setReceiptData(rcpt);

      await load("", "Billing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing failed");
    }
  }

  async function handleRefundPayment(invoice: InvoiceView) {
    try {
      const pList = await api(`/api/v1/payments/patient/${invoice.patient_id}`).catch(() => []);
      const match = pList.find((p: any) => p.invoiceId === invoice.invoice_id && (p.status === "PAID" || p.status === "AUTHORIZED"));
      if (!match) {
        setError("No completed payment transaction found for this invoice to refund.");
        return;
      }
      await api(`/api/v1/payments/${match.paymentId}/refund`, {
        method: "POST",
        body: JSON.stringify({ amountMinor: match.amountMinor, reason: "Customer requested refund" }),
      });
      setNotice("Payment transaction refunded successfully.");
      await load("", "Billing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    }
  }

  // --- DOCTOR & STAFF ACTIONS ---
  async function handleSaveDoctor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const pwd = f.get("password") as string;
    const confirmPwd = f.get("confirmPassword") as string;

    if (!editingDoctor && pwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (editingDoctor) {
        await api(`/api/v1/admin/doctors/${editingDoctor.doctorId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: f.get("fullName"),
            phone: f.get("phone") || null,
            gender: f.get("gender") || null,
            dateOfBirth: f.get("dateOfBirth") || null,
            departmentId: f.get("departmentId"),
            specialization: f.get("specialization"),
            licenseNumber: f.get("licenseNumber"),
            experienceYears: Number(f.get("experienceYears")),
            consultationFee: Number(f.get("consultationFee") || 50000),
          }),
        });
        setNotice("Doctor details updated successfully.");
      } else {
        await api("/api/v1/admin/doctors", {
          method: "POST",
          body: JSON.stringify({
            fullName: f.get("fullName"),
            email: f.get("email"),
            password: pwd,
            phone: f.get("phone") || null,
            gender: f.get("gender") || null,
            dateOfBirth: f.get("dateOfBirth") || null,
            departmentId: f.get("departmentId"),
            specialization: f.get("specialization"),
            licenseNumber: f.get("licenseNumber"),
            experienceYears: Number(f.get("experienceYears")),
            consultationFee: Number(f.get("consultationFee") || 50000),
          }),
        });
        setNotice("Doctor registered successfully with ROLE = DOCTOR.");
      }
      setDocModalOpen(false);
      setEditingDoctor(null);
      await load("", "Doctors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save doctor");
    }
  }

  async function toggleDoctorStatus(doctorId: string, active: boolean) {
    try {
      const endpoint = active ? "activate" : "deactivate";
      await api(`/api/v1/admin/doctors/${doctorId}/${endpoint}`, { method: "POST" });
      setNotice(`Doctor account ${active ? "activated" : "deactivated"} successfully.`);
      await load("", "Doctors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function handleDeleteDoctor(doctorId: string) {
    try {
      await api(`/api/v1/admin/doctors/${doctorId}`, { method: "DELETE" });
      setNotice("Doctor deleted successfully.");
      await load("", "Doctors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete doctor");
    }
  }

  async function handleDeleteStaff(staffId: string) {
    try {
      await api(`/api/v1/admin/staff/${staffId}`, { method: "DELETE" });
      setNotice("Staff member deleted successfully.");
      await load("", "Staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff member");
    }
  }

  async function handleSaveStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const pwd = f.get("password") as string;
    const confirmPwd = f.get("confirmPassword") as string;

    if (!editingStaff && pwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (editingStaff) {
        await api(`/api/v1/admin/staff/${editingStaff.staffId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: f.get("fullName"),
            phone: f.get("phone") || null,
            gender: f.get("gender") || null,
            dateOfBirth: f.get("dateOfBirth") || null,
            departmentId: f.get("departmentId") || null,
            staffType: f.get("staffType"),
            designation: f.get("designation"),
          }),
        });
        setNotice("Staff details updated successfully.");
      } else {
        await api("/api/v1/admin/staff", {
          method: "POST",
          body: JSON.stringify({
            fullName: f.get("fullName"),
            email: f.get("email"),
            password: pwd,
            phone: f.get("phone") || null,
            gender: f.get("gender") || null,
            dateOfBirth: f.get("dateOfBirth") || null,
            departmentId: f.get("departmentId") || null,
            staffType: f.get("staffType"),
            designation: f.get("designation"),
            employeeId: f.get("employeeId") || null,
          }),
        });
        setNotice("Staff member registered successfully with ROLE = STAFF.");
      }
      setStaffModalOpen(false);
      setEditingStaff(null);
      await load("", "Staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff");
    }
  }

  async function toggleStaffStatus(staffId: string, active: boolean) {
    try {
      const endpoint = active ? "activate" : "deactivate";
      await api(`/api/v1/admin/staff/${staffId}/${endpoint}`, { method: "POST" });
      setNotice(`Staff account ${active ? "activated" : "deactivated"} successfully.`);
      await load("", "Staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function toggleUserStatus(userId: string, active: boolean) {
    try {
      const endpoint = active ? "activate" : "deactivate";
      await api(`/api/v1/admin/users/${userId}/${endpoint}`, { method: "POST" });
      setNotice(`User account ${active ? "activated" : "deactivated"} successfully.`);
      await load("", "User Management");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!targetUserId || !newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      await api(`/api/v1/admin/users/${targetUserId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      setNotice("User password reset successfully.");
      setResetPwdModalOpen(false);
      setTargetUserId(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    }
  }

  const isAdmin = Boolean(me?.roles?.includes("ADMIN"));

  return (
    <main className="portal admin-portal-container">
      <AppHeader
        user={me ? {
          userId: me.userId,
          email: me.email,
          fullName: me.email ? me.email.split("@")[0] : "Operations Control",
          roles: me.roles || ["ADMIN"],
        } : null}
        breadcrumbs={[{ label: "Hospital Operations", href: "/operations" }]}
      />
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow">{isAdmin ? (t.adminSectionTitle || "ADMINISTRATION") : t.liveOperations}</p>
            <h1>{isAdmin ? "Admin & Operations Portal" : t.operationalControl}</h1>
          </div>
          <BackButton label={`← ${t.backToStaffPortal}`} fallbackHref="/staff" />
        </div>

        {!ready && (
          <div className="error">
            Sign in through the staff portal before opening operations.
          </div>
        )}

        {notice && (
          <div className="success" role="status" onClick={() => setNotice("")}>
            <span>✓ {notice}</span>
            <button type="button" className="toast-close" onClick={() => setNotice("")}>✕</button>
          </div>
        )}

        {error && (
          <div className="error" role="alert" onClick={() => setError("")}>
            <span>⚠️ {error}</span>
            <button type="button" className="toast-close" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="workspace-nav" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          <button
            className={view === "Dashboard" ? "active" : ""}
            aria-current={view === "Dashboard" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("/api/v1/operations/dashboard", "Dashboard")}
          >
            Dashboard
          </button>

          {isAdmin && (
            <>
              <button
                className={view === "Doctors" ? "active" : ""}
                aria-current={view === "Doctors" ? "page" : undefined}
                disabled={!ready}
                onClick={() => load("", "Doctors")}
              >
                🏥 {t.doctorsManagement || "Doctors"}
              </button>

              <button
                className={view === "Staff" ? "active" : ""}
                aria-current={view === "Staff" ? "page" : undefined}
                disabled={!ready}
                onClick={() => load("", "Staff")}
              >
                👥 {t.staffManagement || "Staff"}
              </button>

              <button
                className={view === "User Management" ? "active" : ""}
                aria-current={view === "User Management" ? "page" : undefined}
                disabled={!ready}
                onClick={() => load("", "User Management")}
              >
                🛡️ {t.userManagement || "User Management"}
              </button>
            </>
          )}

          <button
            className={view === "Emergency" ? "active" : ""}
            aria-current={view === "Emergency" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("", "Emergency")}
          >
            🚨 {t.emergencyTitle || "Emergency"}
          </button>

          <button
            className={view === "Laboratory" ? "active" : ""}
            aria-current={view === "Laboratory" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("", "Laboratory")}
          >
            🔬 {t.labTitle || "Laboratory"}
          </button>

          <button
            className={view === "Billing" ? "active" : ""}
            aria-current={view === "Billing" ? "page" : undefined}
            disabled={!ready}
            onClick={() => load("", "Billing")}
          >
            💳 {t.billingTitle || "Billing"}
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW: DOCTORS MANAGEMENT (ADMIN ONLY)                        */}
        {/* ------------------------------------------------------------- */}
        {view === "Doctors" && isAdmin && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.doctorsManagement || "Doctors"}</h2>
                <p>{t.doctorsManagementSubtitle || "Register new medical doctors, view profiles, and control account status."}</p>
              </div>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  setEditingDoctor(null);
                  setDocModalOpen(true);
                }}
              >
                + {t.registerDoctor || "Register Doctor"}
              </button>
            </div>

            <div className="card admin-filter-card">
              <div className="admin-filter-grid-doc">
                <label className="admin-filter-label">
                  Search Doctors
                  <input
                    type="text"
                    placeholder="Search name, email, license..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Department
                  <select value={docDeptFilter} onChange={(e) => setDocDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-label">
                  Status
                  <select value={docStatusFilter} onChange={(e) => setDocStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Deactivated Only</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "Doctors")}>
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="admin-cards-grid">
              {doctors.map((d) => (
                <article className="card admin-data-card" key={d.doctorId} style={{ borderLeft: d.active ? "4px solid #A67C52" : "4px solid #9CA3AF" }}>
                  <div>
                    <div className="admin-card-header">
                      <div>
                        <span className="eyebrow" style={{ fontSize: "0.75rem", marginBottom: "2px", display: "block" }}>{d.doctorNumber}</span>
                        <h3 style={{ margin: "2px 0 6px", fontSize: "1.2rem", color: "#3D3228" }}>{d.fullName}</h3>
                        <span style={{ display: "inline-block", background: "#F7F1E8", color: "#A67C52", fontWeight: 700, fontSize: "0.8rem", padding: "3px 10px", borderRadius: "6px", border: "1px solid #E7DED2" }}>
                          {d.specialization} · {d.departmentName}
                        </span>
                      </div>
                      <span className={`admin-card-badge ${d.active ? "active" : "inactive"}`}>
                        {d.active ? "ACTIVE" : "DEACTIVATED"}
                      </span>
                    </div>

                    <div className="admin-card-details-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Email</span>
                        <span className="admin-detail-value">{d.email}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">License Number</span>
                        <span className="admin-detail-value" style={{ fontFamily: "monospace" }}>{d.licenseNumber}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Phone</span>
                        <span className="admin-detail-value">{d.phone || "Not provided"}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Experience</span>
                        <span className="admin-detail-value">{d.experienceYears} Years</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Consultation Fee</span>
                        <span className="admin-detail-value">₹{(d.consultationFee || 50000) / 100}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Gender / DOB</span>
                        <span className="admin-detail-value">{d.gender || "—"} {d.dateOfBirth ? `· ${d.dateOfBirth}` : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card-footer">
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => {
                        setEditingDoctor(d);
                        setDocModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    {d.active ? (
                      <button
                        type="button"
                        className="destructive-action"
                        style={{ height: "38px", padding: "0 16px", fontSize: "0.88rem", borderRadius: "8px" }}
                        onClick={() => {
                          setConfirmDialog({
                            type: "doctor",
                            id: d.doctorId,
                            action: "deactivate",
                            name: d.fullName
                          });
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-primary-btn"
                        style={{ minHeight: "38px", height: "38px", padding: "0 16px", fontSize: "0.88rem" }}
                        onClick={() => toggleDoctorStatus(d.doctorId, true)}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        height: "38px",
                        padding: "0 16px",
                        fontSize: "0.88rem",
                        borderRadius: "8px",
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setConfirmDialog({
                          type: "doctor",
                          id: d.doctorId,
                          action: "delete",
                          name: d.fullName,
                        });
                      }}
                    >
                      {t.delete || "Delete"}
                    </button>
                  </div>
                </article>
              ))}

              {doctors.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No doctors found matching the selected criteria.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: STAFF MANAGEMENT (ADMIN ONLY)                          */}
        {/* ------------------------------------------------------------- */}
        {view === "Staff" && isAdmin && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.staffManagement || "Staff Management"}</h2>
                <p>{t.staffManagementSubtitle || "Register and manage nursing, administrative, and clinical operational staff."}</p>
              </div>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  setEditingStaff(null);
                  setStaffModalOpen(true);
                }}
              >
                + {t.registerStaff || "Register Staff"}
              </button>
            </div>

            <div className="card admin-filter-card">
              <div className="admin-filter-grid-staff">
                <label className="admin-filter-label">
                  Search Staff
                  <input
                    type="text"
                    placeholder="Search name, email, ID..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Department
                  <select value={staffDeptFilter} onChange={(e) => setStaffDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-label">
                  Staff Type
                  <select value={staffTypeFilter} onChange={(e) => setStaffTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {STAFF_TYPES.map((st) => (
                      <option key={st} value={st}>{st.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-label">
                  Status
                  <select value={staffStatusFilter} onChange={(e) => setStaffStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Deactivated Only</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "Staff")}>
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="admin-cards-grid">
              {staffList.map((s) => (
                <article className="card admin-data-card" key={s.staffId} style={{ borderLeft: s.active ? "4px solid #A67C52" : "4px solid #9CA3AF" }}>
                  <div>
                    <div className="admin-card-header">
                      <div>
                        <span className="eyebrow" style={{ fontSize: "0.75rem", marginBottom: "2px", display: "block" }}>{s.employeeId}</span>
                        <h3 style={{ margin: "2px 0 6px", fontSize: "1.2rem", color: "#3D3228" }}>{s.fullName}</h3>
                        <span style={{ display: "inline-block", background: "#F7F1E8", color: "#A67C52", fontWeight: 700, fontSize: "0.8rem", padding: "3px 10px", borderRadius: "6px", border: "1px solid #E7DED2" }}>
                          {s.designation} ({s.staffType.replaceAll("_", " ")}) · {s.departmentName || "General"}
                        </span>
                      </div>
                      <span className={`admin-card-badge ${s.active ? "active" : "inactive"}`}>
                        {s.active ? "ACTIVE" : "DEACTIVATED"}
                      </span>
                    </div>

                    <div className="admin-card-details-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Email</span>
                        <span className="admin-detail-value">{s.email}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Phone</span>
                        <span className="admin-detail-value">{s.phone || "Not provided"}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Joining Date</span>
                        <span className="admin-detail-value">{s.joiningDate || "Recent"}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Gender / DOB</span>
                        <span className="admin-detail-value">{s.gender || "—"} {s.dateOfBirth ? `· ${s.dateOfBirth}` : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card-footer">
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => {
                        setEditingStaff(s);
                        setStaffModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    {s.active ? (
                      <button
                        type="button"
                        className="destructive-action"
                        style={{ height: "38px", padding: "0 16px", fontSize: "0.88rem", borderRadius: "8px" }}
                        onClick={() => {
                          setConfirmDialog({
                            type: "staff",
                            id: s.staffId,
                            action: "deactivate",
                            name: s.fullName
                          });
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-primary-btn"
                        style={{ minHeight: "38px", height: "38px", padding: "0 16px", fontSize: "0.88rem" }}
                        onClick={() => toggleStaffStatus(s.staffId, true)}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        height: "38px",
                        padding: "0 16px",
                        fontSize: "0.88rem",
                        borderRadius: "8px",
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setConfirmDialog({
                          type: "staff",
                          id: s.staffId,
                          action: "delete",
                          name: s.fullName,
                        });
                      }}
                    >
                      {t.delete || "Delete"}
                    </button>
                  </div>
                </article>
              ))}

              {staffList.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No staff members found matching the selected criteria.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: USER MANAGEMENT (ADMIN ONLY)                           */}
        {/* ------------------------------------------------------------- */}
        {view === "User Management" && isAdmin && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.userManagement || "User Management"}</h2>
                <p>{t.userManagementSubtitle || "System-wide user identity accounts, RBAC role permissions, and password controls."}</p>
              </div>
            </div>

            <div className="card admin-filter-card">
              <div className="admin-filter-grid-user">
                <label className="admin-filter-label">
                  Search Users
                  <input
                    type="text"
                    placeholder="Search email, user ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Role
                  <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="PATIENT">PATIENT</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <label className="admin-filter-label">
                  Status
                  <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DEACTIVATED">DEACTIVATED</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "User Management")}>
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="admin-cards-grid">
              {usersList.map((u) => (
                <article className="card admin-data-card" key={u.userId} style={{ borderLeft: u.status === "ACTIVE" ? "4px solid #A67C52" : "4px solid #9CA3AF" }}>
                  <div>
                    <div className="admin-card-header">
                      <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#3D3228", wordBreak: "break-all" }}>{u.fullName || u.email}</h3>
                      <span className={`admin-card-badge ${u.status === "ACTIVE" ? "active" : "inactive"}`}>
                        {u.status}
                      </span>
                    </div>

                    <div className="admin-card-details-grid">
                      <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}>
                        <span className="admin-detail-label">User ID</span>
                        <span className="admin-detail-value" style={{ fontFamily: "monospace" }}>{u.userId}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Created Date</span>
                        <span className="admin-detail-value">{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Roles</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                          {u.roles.map((r) => (
                            <span key={r} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card-footer">
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => {
                        setTargetUserId(u.userId);
                        setResetPwdModalOpen(true);
                      }}
                    >
                      Reset Password
                    </button>
                    {u.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className="destructive-action"
                        style={{ height: "38px", padding: "0 16px", fontSize: "0.88rem", borderRadius: "8px" }}
                        onClick={() => {
                          setConfirmDialog({
                            type: "user",
                            id: u.userId,
                            action: "deactivate",
                            name: u.email
                          });
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-primary-btn"
                        style={{ minHeight: "38px", height: "38px", padding: "0 16px", fontSize: "0.88rem" }}
                        onClick={() => toggleUserStatus(u.userId, true)}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {usersList.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No user accounts found matching the search criteria.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: EMERGENCY MANAGEMENT                                   */}
        {/* ------------------------------------------------------------- */}
        {view === "Emergency" && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.emergencyTitle || "Emergency Management"}</h2>
                <p>{t.emergencySubtitle || "Monitor and manage emergency cases, triage, beds and patient flow."}</p>
              </div>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientSearchQuery("");
                  setEmModalOpen(true);
                }}
              >
                + {t.openEmergencyCase || "Open Emergency Case"}
              </button>
            </div>

            {/* REAL STATS CARDS */}
            <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.waitingPatients ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Waiting Patients</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #DC2626" }}>
                <strong style={{ fontSize: "1.8rem", color: "#DC2626", display: "block" }}>{emergencyStats?.criticalCases ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 700 }}>Critical Cases</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.inAssessment ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>In Assessment</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.inTreatment ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>In Treatment</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.availableBeds ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Available Beds</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.occupiedBeds ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Occupied Beds</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{emergencyStats?.admittedToday ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Admitted Today</span>
              </article>
            </div>

            {/* FILTERS */}
            <div className="card admin-filter-card">
              <div className="admin-filter-grid-doc">
                <label className="admin-filter-label">
                  Search Cases
                  <input
                    type="text"
                    placeholder="Search complaint, patient name..."
                    value={emSearch}
                    onChange={(e) => setEmSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Acuity Level
                  <select value={emAcuityFilter} onChange={(e) => setEmAcuityFilter(e.target.value)}>
                    <option value="">All Acuities</option>
                    <option value="1">1 · Resuscitation (Red)</option>
                    <option value="2">2 · Emergent (Orange)</option>
                    <option value="3">3 · Urgent (Yellow)</option>
                    <option value="4">4 · Less Urgent (Green)</option>
                    <option value="5">5 · Non-Urgent (Blue)</option>
                  </select>
                </label>
                <label className="admin-filter-label">
                  Case Status
                  <select value={emStatusFilter} onChange={(e) => setEmStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="OPEN">OPEN (Waiting)</option>
                    <option value="ASSESSED">ASSESSED</option>
                    <option value="IN_TREATMENT">IN_TREATMENT</option>
                    <option value="ADMITTED">ADMITTED</option>
                    <option value="DISCHARGED">DISCHARGED</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "Emergency")}>
                  Apply Filters
                </button>
              </div>
            </div>

            {/* EMERGENCY QUEUE GRID */}
            <div className="admin-cards-grid">
              {emergencyCases.map((c) => {
                const isCritical = c.acuity <= 2;
                return (
                  <article className="card admin-data-card" key={c.emergency_case_id} style={{ borderLeft: isCritical ? "4px solid #DC2626" : "4px solid #A67C52" }}>
                    <div>
                      <div className="admin-card-header">
                        <div>
                          <span className="eyebrow" style={{ fontSize: "0.75rem", marginBottom: "2px", display: "block" }}>
                            CASE #{c.emergency_case_id.substring(0, 8).toUpperCase()}
                          </span>
                          <h3 style={{ margin: "2px 0 4px", fontSize: "1.15rem", color: "#3D3228" }}>
                            {c.patient_name || "Unidentified Patient"}
                          </h3>
                          <span style={{ display: "inline-block", background: isCritical ? "#FEE2E2" : "#F7F1E8", color: isCritical ? "#DC2626" : "#A67C52", fontWeight: 700, fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", border: "1px solid #E7DED2" }}>
                            Acuity {c.acuity} · {c.acuity === 1 ? "Resuscitation" : c.acuity === 2 ? "Emergent" : c.acuity === 3 ? "Urgent" : c.acuity === 4 ? "Less Urgent" : "Non-Urgent"}
                          </span>
                        </div>
                        <span className={`admin-card-badge ${c.status === "OPEN" ? "inactive" : "active"}`}>
                          {c.status}
                        </span>
                      </div>

                      <div className="admin-card-details-grid">
                        <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}>
                          <span className="admin-detail-label">Presenting Complaint</span>
                          <span className="admin-detail-value" style={{ fontWeight: 700 }}>{c.presenting_complaint}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Arrival Mode</span>
                          <span className="admin-detail-value">{c.arrival_mode || "WALK_IN"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Arrival Time</span>
                          <span className="admin-detail-value">{new Date(c.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Department / Bed</span>
                          <span className="admin-detail-value">{c.department_name || "ED"} {c.bed_number ? `· Bed #${c.bed_number}` : ""}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Assigned Doctor</span>
                          <span className="admin-detail-value">{c.doctor_name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card-footer" style={{ flexWrap: "wrap", gap: "6px" }}>
                      <button type="button" className="admin-secondary-btn" onClick={() => setEmDetailCase(c)}>
                        View Case Details
                      </button>
                      {c.status === "OPEN" && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "0.82rem" }} onClick={() => updateEmergencyStatus(c.emergency_case_id, "ASSESSED")}>
                          Start Assessment
                        </button>
                      )}
                      {c.status === "ASSESSED" && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "0.82rem" }} onClick={() => updateEmergencyStatus(c.emergency_case_id, "IN_TREATMENT")}>
                          Start Treatment
                        </button>
                      )}
                      {(c.status === "ASSESSED" || c.status === "IN_TREATMENT") && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "0.82rem", background: "#8E6842" }} onClick={() => updateEmergencyStatus(c.emergency_case_id, "ADMITTED")}>
                          Admit Patient
                        </button>
                      )}
                      {(c.status === "IN_TREATMENT" || c.status === "ASSESSED") && (
                        <button type="button" className="admin-secondary-btn" style={{ padding: "0 12px", fontSize: "0.82rem" }} onClick={() => updateEmergencyStatus(c.emergency_case_id, "DISCHARGED")}>
                          Discharge
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {emergencyCases.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No active emergency cases found.</p>
                </div>
              )}
            </div>

            {/* BED CAPACITY SNAPSHOT SECTION */}
            <div style={{ marginTop: "36px" }}>
              <h3 style={{ fontSize: "1.3rem", color: "#3D3228", marginBottom: "16px" }}>Hospital Bed Capacity & Department Snapshots</h3>
              <div className="portal-grid">
                <form className="card form" onSubmit={createCapacity} style={{ background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                  <h2>Capture Capacity Snapshot</h2>
                  <label>
                    Department *
                    <select name="departmentId" required>
                      <option value="" disabled>Select Department</option>
                      {departments.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-grid">
                    <label>
                      Staffed Beds *
                      <input name="staffedBeds" type="number" min="0" required defaultValue={20} />
                    </label>
                    <label>
                      Occupied Beds *
                      <input name="occupiedBeds" type="number" min="0" required defaultValue={8} />
                    </label>
                  </div>
                  <label>
                    Waiting Patients *
                    <input name="waitingPatients" type="number" min="0" required defaultValue={2} />
                  </label>
                  <button type="submit" className="admin-primary-btn" style={{ width: "100%", marginTop: "8px" }}>Save Snapshot</button>
                </form>

                <div className="card" style={{ background: "#FFFCF7", border: "1px solid #E7DED2", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px" }}>Department Live Capacity</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "320px", overflowY: "auto" }}>
                    {capacityList.map((cap, i) => (
                      <div key={i} style={{ padding: "12px", background: "#FAF8F4", borderRadius: "8px", border: "1px solid #E7DED2" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                          <span>{String(cap.department_name || "Department")}</span>
                          <span style={{ color: "#A67C52" }}>Available: {String(cap.available_beds)}</span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#76685B", marginTop: "4px" }}>
                          Staffed: {String(cap.staffed_beds)} · Occupied: {String(cap.occupied_beds)} · Waiting: {String(cap.waiting_patients)}
                        </div>
                      </div>
                    ))}
                    {capacityList.length === 0 && <p className="muted">No capacity snapshots captured yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: LABORATORY MANAGEMENT                                  */}
        {/* ------------------------------------------------------------- */}
        {view === "Laboratory" && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.labTitle || "Laboratory Management"}</h2>
                <p>{t.labSubtitle || "Manage laboratory orders, samples, results and reports."}</p>
              </div>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientSearchQuery("");
                  setLabModalOpen(true);
                }}
              >
                + {t.newLabOrder || "New Lab Order"}
              </button>
            </div>

            {/* REAL LAB STATS */}
            <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{labStats?.pendingOrders ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Pending Orders</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{labStats?.samplesCollected ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Samples Collected</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{labStats?.processing ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Processing</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{labStats?.completed ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Completed</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #DC2626" }}>
                <strong style={{ fontSize: "1.8rem", color: "#DC2626", display: "block" }}>{labStats?.criticalResults ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 700 }}>Critical Results</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{labStats?.todaysTests ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Today's Tests</span>
              </article>
            </div>

            {/* FILTERS */}
            <div className="card admin-filter-card">
              <div className="admin-filter-grid-staff">
                <label className="admin-filter-label">
                  Search Test / Patient
                  <input
                    type="text"
                    placeholder="Search test name, code, patient..."
                    value={labSearch}
                    onChange={(e) => setLabSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Category
                  <select value={labCategoryFilter} onChange={(e) => setLabCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {LAB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-label">
                  Priority
                  <select value={labPriorityFilter} onChange={(e) => setLabPriorityFilter(e.target.value)}>
                    <option value="">All Priorities</option>
                    <option value="STAT">STAT (Emergency)</option>
                    <option value="URGENT">URGENT</option>
                    <option value="ROUTINE">ROUTINE</option>
                  </select>
                </label>
                <label className="admin-filter-label">
                  Status
                  <select value={labStatusFilter} onChange={(e) => setLabStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="COLLECTED">COLLECTED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "Laboratory")}>
                  Apply Filters
                </button>
              </div>
            </div>

            {/* LAB ORDERS GRID */}
            <div className="admin-cards-grid">
              {labOrders.map((l) => {
                const isCritical = l.result_flag === "CRITICAL";
                return (
                  <article className="card admin-data-card" key={l.lab_order_id} style={{ borderLeft: isCritical ? "4px solid #DC2626" : "4px solid #A67C52" }}>
                    <div>
                      <div className="admin-card-header">
                        <div>
                          <span className="eyebrow" style={{ fontSize: "0.75rem", marginBottom: "2px", display: "block" }}>
                            ORDER #{l.lab_order_id.substring(0, 8).toUpperCase()}
                          </span>
                          <h3 style={{ margin: "2px 0 4px", fontSize: "1.15rem", color: "#3D3228" }}>
                            {l.test_name || l.test_code}
                          </h3>
                          <span style={{ display: "inline-block", background: "#F7F1E8", color: "#A67C52", fontWeight: 700, fontSize: "0.8rem", padding: "2px 8px", borderRadius: "6px", border: "1px solid #E7DED2" }}>
                            {l.category || "General"} · Priority: {l.priority || "ROUTINE"}
                          </span>
                        </div>
                        <span className={`admin-card-badge ${l.status === "COMPLETED" ? "active" : "inactive"}`}>
                          {l.status}
                        </span>
                      </div>

                      <div className="admin-card-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Patient Name</span>
                          <span className="admin-detail-value">{l.patient_name || "Patient Record"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Ordered By</span>
                          <span className="admin-detail-value">{l.ordered_by_email || "Medical Staff"}</span>
                        </div>
                        <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}>
                          <span className="admin-detail-label">Result Summary & Status</span>
                          <span className="admin-detail-value" style={{ color: isCritical ? "#DC2626" : "#3D3228", fontWeight: isCritical ? 800 : 600 }}>
                            {l.result_summary ? `${l.result_summary} (${l.result_flag || "NORMAL"})` : "Awaiting result entry"}
                          </span>
                        </div>
                        {l.technician_name && (
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Technician</span>
                            <span className="admin-detail-value">{l.technician_name}</span>
                          </div>
                        )}
                        {l.completed_at && (
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Completed At</span>
                            <span className="admin-detail-value">{new Date(l.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-card-footer" style={{ flexWrap: "wrap", gap: "6px" }}>
                      {l.status === "ORDERED" && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "0.82rem" }} onClick={() => updateLabStatus(l.lab_order_id, "COLLECTED")}>
                          Collect Sample
                        </button>
                      )}
                      {l.status === "COLLECTED" && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "0.82rem" }} onClick={() => updateLabStatus(l.lab_order_id, "PROCESSING")}>
                          Start Processing
                        </button>
                      )}
                      {(l.status === "PROCESSING" || l.status === "COLLECTED" || l.status === "ORDERED") && (
                        <button type="button" className="admin-secondary-btn" style={{ padding: "0 12px", fontSize: "0.82rem" }} onClick={() => {
                          setTargetLabForResult(l);
                          setLabResultModalOpen(true);
                        }}>
                          Enter Result
                        </button>
                      )}
                      {l.status === "COMPLETED" && (
                        <button type="button" className="admin-secondary-btn" style={{ padding: "0 12px", fontSize: "0.82rem" }} onClick={() => setTargetLabForReport(l)}>
                          View Lab Report
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {labOrders.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No laboratory orders found.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: BILLING MANAGEMENT                                     */}
        {/* ------------------------------------------------------------- */}
        {view === "Billing" && (
          <section className="admin-management-section">
            <div className="admin-page-header">
              <div>
                <h2>{t.billingTitle || "Billing & Payments"}</h2>
                <p>{t.billingSubtitle || "Manage invoices, charges, payments and receipts."}</p>
              </div>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientSearchQuery("");
                  setInvoiceModalOpen(true);
                }}
              >
                + {t.createInvoice || "Create Invoice"}
              </button>
            </div>

            {/* REAL BILLING STATS */}
            <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>₹{(billingStats?.todaysRevenueMinor ?? 0) / 100}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Today's Revenue</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{billingStats?.pendingPaymentsCount ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Pending Payments</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{billingStats?.paidInvoicesCount ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Paid Invoices</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{billingStats?.partiallyPaidCount ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Partially Paid</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{billingStats?.refundsCount ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Refunds</span>
              </article>
              <article className="card metric" style={{ textAlign: "center", padding: "16px", background: "#FFFCF7", border: "1px solid #E7DED2" }}>
                <strong style={{ fontSize: "1.8rem", color: "#A67C52", display: "block" }}>{billingStats?.todaysTransactionsCount ?? 0}</strong>
                <span style={{ fontSize: "0.82rem", color: "#76685B", fontWeight: 700 }}>Today's Txns</span>
              </article>
            </div>

            {/* FILTERS */}
            <div className="card admin-filter-card">
              <div className="admin-filter-grid-doc">
                <label className="admin-filter-label">
                  Search Invoices
                  <input
                    type="text"
                    placeholder="Search invoice ID, patient name..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                  />
                </label>
                <label className="admin-filter-label">
                  Payment Status
                  <select value={invoiceStatusFilter} onChange={(e) => setInvoiceStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="ISSUED">ISSUED (Pending)</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="VOID">VOID</option>
                  </select>
                </label>
                <button type="button" className="admin-apply-btn" onClick={() => load("", "Billing")}>
                  Apply Filters
                </button>
              </div>
            </div>

            {/* INVOICES GRID */}
            <div className="admin-cards-grid">
              {invoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                return (
                  <article className="card admin-data-card" key={inv.invoice_id} style={{ borderLeft: isPaid ? "4px solid #A67C52" : "4px solid #C4A484" }}>
                    <div>
                      <div className="admin-card-header">
                        <div>
                          <span className="eyebrow" style={{ fontSize: "0.75rem", marginBottom: "2px", display: "block" }}>
                            INVOICE #{inv.invoice_id.substring(0, 8).toUpperCase()}
                          </span>
                          <h3 style={{ margin: "2px 0 4px", fontSize: "1.3rem", color: "#3D3228" }}>
                            ₹{(inv.amount_minor || 0) / 100}
                          </h3>
                        </div>
                        <span className={`admin-card-badge ${isPaid ? "active" : "inactive"}`}>
                          {inv.status}
                        </span>
                      </div>

                      <div className="admin-card-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Patient Name</span>
                          <span className="admin-detail-value">{inv.patient_name || "Patient Record"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Invoice Date</span>
                          <span className="admin-detail-value">{new Date(inv.created_at).toLocaleDateString()}</span>
                        </div>
                        {inv.items && inv.items.length > 0 && (
                          <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}>
                            <span className="admin-detail-label">Billed Services & Items</span>
                            <div style={{ marginTop: "4px", fontSize: "0.82rem" }}>
                              {inv.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px dashed #E7DED2" }}>
                                  <span>{item.description} ({item.quantity}x)</span>
                                  <span style={{ fontWeight: 700 }}>₹{(item.totalPriceMinor || item.quantity * item.unitPriceMinor) / 100}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-card-footer" style={{ flexWrap: "wrap", gap: "6px" }}>
                      {!isPaid && inv.status !== "REFUNDED" && (
                        <button type="button" className="admin-primary-btn" style={{ minHeight: "38px", height: "38px", padding: "0 14px", fontSize: "0.85rem" }} onClick={() => handlePayInvoice(inv)}>
                          💳 Pay Now (₹{(inv.amount_minor || 0) / 100})
                        </button>
                      )}
                      {isPaid && (
                        <button type="button" className="admin-secondary-btn" style={{ padding: "0 14px", fontSize: "0.85rem" }} onClick={() => handleRefundPayment(inv)}>
                          Refund Payment
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {invoices.length === 0 && (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "36px", background: "#FFFCF7" }}>
                  <p className="muted">No invoices found matching criteria.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* EXISTING DASHBOARD & RAW RESULTS */}
        {view === "Dashboard" && (
          <div className="portal-grid">
            <div className="card" style={{ background: "#FFFCF7", border: "1px solid #E7DED2", padding: "24px" }}>
              <h2>Hospital System Summary</h2>
              <p className="muted">Welcome to CareFlow AI Admin Control. Select a tab above to manage Doctors, Staff, Users, Emergency cases, Laboratory orders, or Billing invoices.</p>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: OPEN EMERGENCY CASE                                    */}
      {/* ------------------------------------------------------------- */}
      {emModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form wide-form" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Open Emergency Triage Case</h2>
              <button type="button" onClick={() => setEmModalOpen(false)} style={{ background: "transparent", color: "#76685B", border: 0, fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateEmergencyCase} className="form">
              <h4 style={{ margin: "4px 0", color: "#A67C52" }}>Patient Selection</h4>
              <div style={{ position: "relative" }}>
                <label>
                  Search Existing Patient
                  <input
                    type="text"
                    placeholder="Type name, phone, or patient ID..."
                    value={patientSearchQuery}
                    onChange={(e) => searchPatients(e.target.value)}
                  />
                </label>
                {patientSearchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: "1px solid #E7DED2", borderRadius: "8px", maxHeight: "180px", overflowY: "auto", zIndex: 10, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>
                    {patientSearchResults.map((p) => (
                      <div
                        key={p.patient_id}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #FAF8F4" }}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchQuery(p.full_name);
                          setPatientSearchResults([]);
                        }}
                      >
                        <strong>{p.full_name}</strong> ({p.patient_number}) · Phone: {p.phone || "N/A"}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", background: "#F7F1E8", borderRadius: "6px", fontSize: "0.85rem" }}>
                    Selected Patient: <strong>{selectedPatient.full_name}</strong> (ID: {selectedPatient.patient_number})
                  </div>
                )}
              </div>

              <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Emergency Triage Information</h4>
              <div className="form-grid">
                <label>
                  Acuity Level *
                  <select name="acuity" required defaultValue="2">
                    <option value="1">1 · Resuscitation (Immediate Life Threat)</option>
                    <option value="2">2 · Emergent (High Risk / Severe Pain)</option>
                    <option value="3">3 · Urgent (Urgent Assessment Needed)</option>
                    <option value="4">4 · Less Urgent (Standard Care)</option>
                    <option value="5">5 · Non-Urgent (Minor Injury)</option>
                  </select>
                </label>
                <label>
                  Arrival Mode *
                  <select name="arrivalMode" defaultValue="WALK_IN">
                    <option value="WALK_IN">Walk-In</option>
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="REFERRAL">Hospital Referral</option>
                  </select>
                </label>
                <label>
                  Department
                  <select name="departmentId">
                    <option value="">Emergency Department (ED)</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Assigned Doctor
                  <select name="assignedDoctorId">
                    <option value="">Unassigned (Queue)</option>
                    {doctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>{d.fullName} ({d.specialization})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Bed / Bay Location
                  <input name="bedNumber" placeholder="e.g. Bay 04 / Bed A" />
                </label>
                <label>
                  Triage Vitals
                  <input name="triageVitals" placeholder="e.g. BP 120/80, HR 88, SpO2 98%" />
                </label>
              </div>

              <label style={{ marginTop: "12px" }}>
                Presenting Complaint *
                <textarea name="presentingComplaint" required placeholder="Describe symptoms, acute pain, or trauma..." />
              </label>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => setEmModalOpen(false)} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">Open Emergency Case</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NEW LAB ORDER                                          */}
      {/* ------------------------------------------------------------- */}
      {labModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form wide-form" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>New Laboratory Order</h2>
              <button type="button" onClick={() => setLabModalOpen(false)} style={{ background: "transparent", color: "#76685B", border: 0, fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateLabOrder} className="form">
              <h4 style={{ margin: "4px 0", color: "#A67C52" }}>Patient Selection</h4>
              <div style={{ position: "relative" }}>
                <label>
                  Search Existing Patient *
                  <input
                    type="text"
                    placeholder="Type name, phone, or patient ID..."
                    value={patientSearchQuery}
                    onChange={(e) => searchPatients(e.target.value)}
                  />
                </label>
                {patientSearchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: "1px solid #E7DED2", borderRadius: "8px", maxHeight: "180px", overflowY: "auto", zIndex: 10, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>
                    {patientSearchResults.map((p) => (
                      <div
                        key={p.patient_id}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #FAF8F4" }}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchQuery(p.full_name);
                          setPatientSearchResults([]);
                        }}
                      >
                        <strong>{p.full_name}</strong> ({p.patient_number}) · Phone: {p.phone || "N/A"}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", background: "#F7F1E8", borderRadius: "6px", fontSize: "0.85rem" }}>
                    Selected Patient: <strong>{selectedPatient.full_name}</strong> (ID: {selectedPatient.patient_number})
                  </div>
                )}
              </div>

              <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Lab Test Details</h4>
              <div className="form-grid">
                <label>
                  Test Code / Identifier *
                  <input name="testCode" required placeholder="e.g. CBC-01 / GLUCOSE-FASTING" />
                </label>
                <label>
                  Test Name
                  <input name="testName" placeholder="e.g. Complete Blood Count" />
                </label>
                <label>
                  Test Category *
                  <select name="category" defaultValue="General">
                    {LAB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority Level *
                  <select name="priority" defaultValue="ROUTINE">
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="URGENT">URGENT</option>
                    <option value="STAT">STAT (Emergency High Priority)</option>
                  </select>
                </label>
              </div>

              <label style={{ marginTop: "12px" }}>
                Clinical Notes / Instructions
                <textarea name="clinicalNotes" placeholder="Reason for test or special instructions for technician..." />
              </label>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => setLabModalOpen(false)} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">Create Lab Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ENTER LAB RESULT                                       */}
      {/* ------------------------------------------------------------- */}
      {labResultModalOpen && targetLabForResult && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form" style={{ maxWidth: "540px", width: "100%", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <h3>Record Laboratory Result</h3>
            <p className="muted">Order #{targetLabForResult.lab_order_id.substring(0, 8).toUpperCase()} · {targetLabForResult.test_name || targetLabForResult.test_code}</p>

            <form onSubmit={handleSaveLabResult} className="form">
              <label>
                Result Summary / Value *
                <textarea name="resultSummary" required placeholder="e.g. Hb: 14.2 g/dL, WBC: 7.5 x10^3/uL. Normal limits." />
              </label>
              <div className="form-grid">
                <label>
                  Result Flag / Classification *
                  <select name="resultFlag" defaultValue="NORMAL">
                    <option value="NORMAL">NORMAL</option>
                    <option value="ABNORMAL">ABNORMAL</option>
                    <option value="CRITICAL">CRITICAL (High Risk Alert)</option>
                  </select>
                </label>
                <label>
                  Technician Name
                  <input name="technicianName" defaultValue="Lab Technician" placeholder="Name of technician" />
                </label>
                <label>
                  Reference Range
                  <input name="referenceRange" placeholder="e.g. 12.0 - 16.0" />
                </label>
                <label>
                  Unit
                  <input name="unit" placeholder="e.g. g/dL" />
                </label>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => setLabResultModalOpen(false)} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">Complete & Record Result</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE INVOICE                                         */}
      {/* ------------------------------------------------------------- */}
      {invoiceModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form wide-form" style={{ maxWidth: "720px", width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Create Patient Invoice</h2>
              <button type="button" onClick={() => setInvoiceModalOpen(false)} style={{ background: "transparent", color: "#76685B", border: 0, fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="form">
              <h4 style={{ margin: "4px 0", color: "#A67C52" }}>Patient Selection</h4>
              <div style={{ position: "relative" }}>
                <label>
                  Search Existing Patient *
                  <input
                    type="text"
                    placeholder="Type name, phone, or patient ID..."
                    value={patientSearchQuery}
                    onChange={(e) => searchPatients(e.target.value)}
                  />
                </label>
                {patientSearchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: "1px solid #E7DED2", borderRadius: "8px", maxHeight: "180px", overflowY: "auto", zIndex: 10, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>
                    {patientSearchResults.map((p) => (
                      <div
                        key={p.patient_id}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #FAF8F4" }}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchQuery(p.full_name);
                          setPatientSearchResults([]);
                        }}
                      >
                        <strong>{p.full_name}</strong> ({p.patient_number}) · Phone: {p.phone || "N/A"}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", background: "#F7F1E8", borderRadius: "6px", fontSize: "0.85rem" }}>
                    Selected Patient: <strong>{selectedPatient.full_name}</strong> (ID: {selectedPatient.patient_number})
                  </div>
                )}
              </div>

              <h4 style={{ margin: "16px 0 8px", color: "#A67C52", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Line Items</span>
                <button type="button" onClick={addInvoiceLineItem} style={{ background: "#F7F1E8", color: "#A67C52", border: "1px solid #E7DED2", padding: "4px 10px", fontSize: "0.8rem", borderRadius: "6px" }}>
                  + Add Item
                </button>
              </h4>

              {invoiceLineItems.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 0.8fr 1fr auto", gap: "10px", alignItems: "end", background: "#FAF8F4", padding: "10px", borderRadius: "8px", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.78rem" }}>
                    Category
                    <select value={item.category} onChange={(e) => updateLineItem(idx, "category", e.target.value)}>
                      {INVOICE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: "0.78rem" }}>
                    Description
                    <input type="text" value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} placeholder="Item description" />
                  </label>
                  <label style={{ fontSize: "0.78rem" }}>
                    Qty
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))} />
                  </label>
                  <label style={{ fontSize: "0.78rem" }}>
                    Price (₹)
                    <input type="number" min="0" value={item.unitPriceMinor / 100} onChange={(e) => updateLineItem(idx, "unitPriceMinor", Number(e.target.value) * 100)} />
                  </label>
                  <button type="button" onClick={() => removeInvoiceLineItem(idx)} style={{ background: "transparent", color: "#DC2626", border: 0, padding: "8px", cursor: "pointer" }}>✕</button>
                </div>
              ))}

              <div className="form-grid" style={{ marginTop: "12px" }}>
                <label>
                  Discount (₹)
                  <input type="number" min="0" value={discountRupees} onChange={(e) => setDiscountRupees(Number(e.target.value))} />
                </label>
                <label>
                  Tax (₹)
                  <input type="number" min="0" value={taxRupees} onChange={(e) => setTaxRupees(Number(e.target.value))} />
                </label>
              </div>

              <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F7F1E8", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#76685B" }}>Calculated Grand Total:</span>
                <strong style={{ fontSize: "1.4rem", color: "#A67C52" }}>₹{invoiceGrandTotalMinor / 100}</strong>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => setInvoiceModalOpen(false)} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">Generate & Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW RECEIPT                                           */}
      {/* ------------------------------------------------------------- */}
      {receiptData && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ maxWidth: "480px", width: "100%", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ textAlign: "center", borderBottom: "1px solid #E7DED2", paddingBottom: "16px", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 4px", color: "#A67C52" }}>CareFlow Smart Hospital</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#76685B" }}>Official Transaction Receipt</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#76685B" }}>Receipt Number:</span>
                <strong>{String(receiptData.receiptNumber || "RCPT-OFFICIAL")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#76685B" }}>Amount Paid:</span>
                <strong style={{ fontSize: "1.2rem", color: "#A67C52" }}>₹{Number(receiptData.amountMinor || 0) / 100}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#76685B" }}>Payment Method:</span>
                <span>{String(receiptData.paymentMethod || "CARD")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#76685B" }}>Status:</span>
                <span style={{ fontWeight: 700, color: "#16A34A" }}>{String(receiptData.status || "PAID")}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button type="button" className="admin-primary-btn" onClick={() => setReceiptData(null)}>Close Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS: DOCTOR & STAFF REGISTRATION                           */}
      {/* ------------------------------------------------------------- */}
      {docModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form wide-form" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>{editingDoctor ? "Edit Doctor Profile" : "Register Doctor"}</h2>
              <button type="button" onClick={() => { setDocModalOpen(false); setError(""); }} style={{ background: "transparent", color: "#76685B", border: 0, fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            {error && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontSize: "0.9rem" }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="form">
              <h4 style={{ margin: "8px 0 4px", color: "#A67C52" }}>Personal Information</h4>
              <div className="form-grid">
                <label>
                  Full Name *
                  <input name="fullName" defaultValue={editingDoctor?.fullName || ""} required placeholder="Dr. First Last" />
                </label>
                <label>
                  Email Address *
                  <input name="email" type="email" defaultValue={editingDoctor?.email || ""} required disabled={Boolean(editingDoctor)} placeholder="doctor@careflow.com" />
                </label>
                <label>
                  Phone Number
                  <input name="phone" defaultValue={editingDoctor?.phone || ""} placeholder="+919750939561" />
                </label>
                <label>
                  Gender
                  <select name="gender" defaultValue={editingDoctor?.gender || ""}>
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>

              <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Professional Information</h4>
              <div className="form-grid">
                <label>
                  Department *
                  <select name="departmentId" defaultValue={editingDoctor?.departmentId || ""} required>
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Specialization *
                  <select name="specialization" defaultValue={editingDoctor?.specialization || ""} required>
                    <option value="" disabled>Select Specialization</option>
                    {SPECIALIZATIONS.map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Medical License Number *
                  <input name="licenseNumber" defaultValue={editingDoctor?.licenseNumber || ""} required placeholder="MED-LIC-12345" />
                </label>
                <label>
                  Years of Experience *
                  <input name="experienceYears" type="number" min="0" max="80" defaultValue={editingDoctor?.experienceYears ?? 5} required />
                </label>
              </div>

              {!editingDoctor && (
                <>
                  <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Account Information</h4>
                  <div className="form-grid">
                    <label>
                      Password *
                      <input name="password" type="password" required minLength={6} placeholder="Min 6 characters" />
                    </label>
                    <label>
                      Confirm Password *
                      <input name="confirmPassword" type="password" required minLength={6} />
                    </label>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => { setDocModalOpen(false); setError(""); }} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">{editingDoctor ? "Update Doctor" : "Register Doctor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: STAFF REGISTRATION & EDIT                              */}
      {/* ------------------------------------------------------------- */}
      {staffModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card form wide-form" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", background: "#FFF", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>{editingStaff ? "Edit Staff Member" : "Register Staff Member"}</h2>
              <button type="button" onClick={() => { setStaffModalOpen(false); setError(""); }} style={{ background: "transparent", color: "#76685B", border: 0, fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            {error && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontSize: "0.9rem" }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="form">
              <h4 style={{ margin: "8px 0 4px", color: "#A67C52" }}>Personal Information</h4>
              <div className="form-grid">
                <label>
                  Full Name *
                  <input name="fullName" defaultValue={editingStaff?.fullName || ""} required placeholder="Staff Full Name" />
                </label>
                <label>
                  Email Address *
                  <input name="email" type="email" defaultValue={editingStaff?.email || ""} required disabled={Boolean(editingStaff)} placeholder="staff@careflow.com" />
                </label>
                <label>
                  Phone Number
                  <input name="phone" defaultValue={editingStaff?.phone || ""} placeholder="+91 97509 39561" />
                </label>
                <label>
                  Gender
                  <select name="gender" defaultValue={editingStaff?.gender || ""}>
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>
                  Date of Birth
                  <input name="dateOfBirth" type="date" defaultValue={editingStaff?.dateOfBirth || ""} />
                </label>
              </div>

              <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Role & Department Information</h4>
              <div className="form-grid">
                <label>
                  Staff Type / Role *
                  <select name="staffType" defaultValue={editingStaff?.staffType || "NURSE"} required>
                    {STAFF_TYPES.map((st) => (
                      <option key={st} value={st}>{st.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Designation / Title *
                  <input name="designation" defaultValue={editingStaff?.designation || ""} required placeholder="e.g. Senior Nurse, Head Receptionist" />
                </label>
                <label>
                  Department
                  <select name="departmentId" defaultValue={editingStaff?.departmentId || ""}>
                    <option value="">General (No Department)</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                    ))}
                  </select>
                </label>
                {!editingStaff ? (
                  <label>
                    Employee ID (Optional)
                    <input name="employeeId" placeholder="Leave empty to auto-generate (STF-XXXX)" />
                  </label>
                ) : (
                  <label>
                    Employee ID
                    <input value={editingStaff.employeeId} disabled style={{ background: "#F7F1E8", cursor: "not-allowed" }} />
                  </label>
                )}
              </div>

              {!editingStaff && (
                <>
                  <h4 style={{ margin: "16px 0 4px", color: "#A67C52" }}>Account Credentials</h4>
                  <div className="form-grid">
                    <label>
                      Password *
                      <input name="password" type="password" required minLength={6} placeholder="Min 6 characters" />
                    </label>
                    <label>
                      Confirm Password *
                      <input name="confirmPassword" type="password" required minLength={6} placeholder="Re-enter password" />
                    </label>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" onClick={() => { setStaffModalOpen(false); setError(""); }} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
                <button type="submit" className="admin-primary-btn">{editingStaff ? "Update Staff" : "Register Staff"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(61, 50, 40, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ maxWidth: "460px", width: "100%", background: "#FFF", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "#DC2626", margin: "0 0 8px" }}>
              {confirmDialog.action === "delete" ? "Delete Confirmation" : "Deactivate Confirmation"}
            </h3>
            <p style={{ margin: "0 0 16px", color: "#3D3228", fontSize: "0.95rem" }}>
              {confirmDialog.action === "delete"
                ? `Are you sure you want to permanently delete ${confirmDialog.name}? This action cannot be undone.`
                : `Are you sure you want to deactivate ${confirmDialog.name}?`}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setConfirmDialog(null)} style={{ background: "#F7F1E8", color: "#3D3228", border: "1px solid #E7DED2" }}>Cancel</button>
              <button
                type="button"
                className="destructive-action"
                style={confirmDialog.action === "delete" ? { background: "#DC2626", color: "#FFF", border: "none" } : {}}
                onClick={async () => {
                  const { type, id, action } = confirmDialog;
                  setConfirmDialog(null);
                  if (action === "delete") {
                    if (type === "doctor") await handleDeleteDoctor(id);
                    else if (type === "staff") await handleDeleteStaff(id);
                  } else {
                    if (type === "doctor") await toggleDoctorStatus(id, action === "activate");
                    else if (type === "staff") await toggleStaffStatus(id, action === "activate");
                    else if (type === "user") await toggleUserStatus(id, action === "activate");
                  }
                }}
              >
                {confirmDialog.action === "delete" ? "Yes, Delete" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
