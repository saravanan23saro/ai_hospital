"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, sessionFetch } from "../lib/session";
import { getLocalizedDisplayName, Language, useLanguage } from "../lib/i18n";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Calendar,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Globe,
  Shield,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

type UserIdentity = {
  userId?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  role?: string;
  doctorNumber?: string;
  patientNumber?: string;
  specialization?: string;
  departmentName?: string;
};

type NotificationItem = {
  notificationId: string;
  subject: string;
  body: string;
  status: string;
  createdAt?: string;
};

export default function AppHeader({
  user,
  onProfileClick,
  onNavigateView,
}: {
  currentPath?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
  user?: UserIdentity | null;
  lang?: Language;
  onProfileClick?: () => void;
  onNavigateView?: (view: "home" | "profile" | "book" | "appointments" | "payments" | "prescriptions" | "settings") => void;
}) {
  const router = useRouter();
  const { lang: currentLang, setLang, t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userKey = user ? `${user.userId || ""}-${user.email || ""}-${(user.roles || []).join(",")}` : "";
  const isPatientOnly = Boolean(
    user?.roles?.includes("PATIENT") &&
    !user?.roles?.includes("ADMIN") &&
    !user?.roles?.includes("STAFF") &&
    !user?.roles?.includes("DOCTOR")
  );

  // Fetch in-app notifications
  useEffect(() => {
    if (userKey) {
      fetchNotifications();
    }
  }, [userKey]);

  async function fetchNotifications() {
    try {
      // 1. Fetch real in-app notifications from the backend NotificationController
      const res = await sessionFetch(API, "/api/v1/notifications").catch(() => null);
      if (res && res.ok) {
        const notifs = await res.json().catch(() => []);
        if (Array.isArray(notifs) && notifs.length > 0) {
          const mapped: NotificationItem[] = notifs.map((n: any) => ({
            notificationId: n.notificationId,
            subject: n.subject || "Notification",
            body: n.body || "",
            status: n.status || "SENT",
            createdAt: n.createdAt,
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.filter((n) => n.status !== "READ").length);
          return;
        }
      }

      // 2. Fallback to appointments ONLY for patient users who have no notifications
      if (isPatientOnly) {
        const apptRes = await sessionFetch(API, "/api/v1/patients/me/appointments").catch(() => null);
        if (apptRes && apptRes.ok) {
          const appts = await apptRes.json().catch(() => []);
          if (Array.isArray(appts) && appts.length > 0) {
            const mapped: NotificationItem[] = appts.slice(0, 5).map((a: any) => ({
              notificationId: a.appointmentId,
              subject: `Appointment ${a.appointmentNumber}`,
              body: `Status: ${a.status} on ${new Date(a.startsAt).toLocaleString()}`,
              status: a.status === "COMPLETED" ? "READ" : "SENT",
              createdAt: a.startsAt,
            }));
            setNotifications(mapped);
            setUnreadCount(mapped.filter((n) => n.status !== "READ").length);
            return;
          }
        }
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Ignore background notification fetch errors
    }
  }

  function handleLogout() {
    clearStoredSession();
    router.replace("/");
  }

  const roleName =
    user?.roles?.includes("DOCTOR")
      ? t.doctorRole || "Doctor"
      : user?.roles?.includes("ADMIN")
      ? t.adminRole || "Admin"
      : user?.roles?.includes("STAFF")
      ? t.staffRole || "Staff"
      : t.patientRole || "Patient";

  const rawName =
    user?.fullName && user.fullName !== "Patient Account" && user.fullName !== "Staff Member"
      ? user.fullName
      : user?.email
      ? user.email.split("@")[0]
      : user?.roles?.includes("DOCTOR")
      ? "Doctor User"
      : "Mary";

  const displayName = getLocalizedDisplayName(rawName, currentLang);

  const firstLetter = displayName.trim().charAt(0).toUpperCase() || "M";

  return (
    <header className="saas-header">
      {/* LEFT LOGO BRAND */}
      <div className="header-brand-section">
        <Link href="/" className="careflow-brand-link">
          <div className="medical-cross-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 10.5H13.5V5C13.5 4.17157 12.8284 3.5 12 3.5C11.1716 3.5 10.5 4.17157 10.5 5V10.5H5C4.17157 10.5 3.5 11.1716 3.5 12C3.5 12.8284 4.17157 13.5 5 13.5H10.5V19C10.5 19.8284 11.1716 20.5 12 20.5C12.8284 20.5 13.5 19.8284 13.5 19V13.5H19C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5Z" fill="white"/>
            </svg>
          </div>
          <div className="brand-text-container">
            <span className="brand-title">{t.brandTitle}</span>
            <span className="brand-subtitle">{t.brandSubtitle}</span>
          </div>
        </Link>
      </div>

      {/* CENTER SEARCH BAR */}
      <div className="header-search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="header-search-input"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="search-kbd-badge">Ctrl + K</kbd>
        </div>
      </div>

      {/* RIGHT ACTION ITEMS */}
      <div className="header-actions">
        {/* GLOBAL LANGUAGE SELECTOR DROPDOWN */}
        <div className="header-lang-selector" style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FAF8F4", padding: "4px 8px", borderRadius: "8px", border: "1px solid #E7DED2" }}>
          <Globe size={16} style={{ color: "#A67C52" }} />
          <select
            value={currentLang}
            onChange={(e) => setLang(e.target.value as Language)}
            style={{ background: "transparent", border: "none", fontSize: "0.825rem", fontWeight: 600, color: "#3D3228", cursor: "pointer", outline: "none" }}
            aria-label="Select portal language"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>
        {/* NOTIFICATIONS */}
        <div className="popover-container" ref={notifRef}>
          <button
            type="button"
            className="icon-circle-btn bell-btn"
            aria-label="View notifications"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
          >
            <Bell size={20} className="bell-icon" />
            {unreadCount > 0 && <span className="notif-red-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="popover-dropdown notif-popover" role="dialog">
              <div className="popover-header">
                <h3>Notifications</h3>
                <span className="badge-chip">{unreadCount} unread</span>
              </div>
              <div className="notif-list">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.notificationId} className="notif-item">
                      <strong>{n.subject}</strong>
                      <p>{n.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-notif">
                    <div className="notif-item">
                      <strong>Appointment Reminder</strong>
                      <p>Your upcoming consultation is scheduled for tomorrow at 10:00 AM.</p>
                    </div>
                    <div className="notif-item">
                      <strong>Prescription Issued</strong>
                      <p>Dr. Smith has issued a new prescription for your recent visit.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE AVATAR & DROPDOWN */}
        <div className="popover-container" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger-btn"
            aria-label="User menu"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
          >
            <div className="profile-avatar-circle">{firstLetter}</div>
            <div className="profile-user-info desktop-only">
              <span className="user-name-text">{displayName}</span>
              <span className="user-role-text">{roleName}</span>
            </div>
            <ChevronDown size={16} className="user-caret-icon" />
          </button>

          {profileOpen && (
            <div className="popover-dropdown profile-popover" role="dialog">
              <div className="profile-popover-header">
                <div className="popover-avatar-lg">{firstLetter}</div>
                <div>
                  <h4 className="popover-name">{displayName}</h4>
                  <p className="popover-email">{user?.email || "patient@careflow.com"}</p>
                  <span className="popover-role-chip">{roleName}</span>
                </div>
              </div>
              <div className="popover-menu-items">
                {user?.roles?.includes("ADMIN") && (
                  <button
                    type="button"
                    style={{ background: "#F7F1E8", color: "#3D3228", fontWeight: 700 }}
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/operations");
                    }}
                  >
                    <Shield size={16} style={{ color: "#A67C52" }} /> Admin & Operations
                  </button>
                )}
                {user?.roles?.includes("DOCTOR") && (
                  <button
                    type="button"
                    style={{ background: "#F7F1E8", color: "#3D3228", fontWeight: 700 }}
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/doctor");
                    }}
                  >
                    <User size={16} style={{ color: "#A67C52" }} /> Doctor Portal
                  </button>
                )}
                {user?.roles?.includes("STAFF") && !user?.roles?.includes("ADMIN") && !user?.roles?.includes("DOCTOR") && (
                  <button
                    type="button"
                    style={{ background: "#F7F1E8", color: "#3D3228", fontWeight: 700 }}
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/staff");
                    }}
                  >
                    <User size={16} style={{ color: "#A67C52" }} /> Staff Portal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("profile");
                    else if (onProfileClick) onProfileClick();
                    else if (user?.roles?.includes("DOCTOR")) router.push("/doctor");
                    else if (user?.roles?.includes("STAFF")) router.push("/staff");
                    else if (user?.roles?.includes("ADMIN")) router.push("/operations");
                    else router.push("/patient?view=profile");
                  }}
                >
                  <User size={16} /> {t.profile}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("appointments");
                    else if (user?.roles?.includes("DOCTOR")) router.push("/doctor");
                    else if (user?.roles?.includes("STAFF")) router.push("/staff");
                    else router.push("/patient?view=appointments");
                  }}
                >
                  <Calendar size={16} /> {t.appointments}
                </button>
                {(!user?.roles || user.roles.includes("PATIENT")) && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      if (onNavigateView) onNavigateView("prescriptions");
                      else router.push("/patient?view=prescriptions");
                    }}
                  >
                    <FileText size={16} /> {t.myPrescriptions}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("payments");
                    else if (user?.roles?.includes("ADMIN")) router.push("/operations");
                    else if (user?.roles?.includes("STAFF")) router.push("/staff");
                    else router.push("/patient?view=payments");
                  }}
                >
                  <CreditCard size={16} /> {t.paymentsInvoices}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("settings");
                    else router.push("/patient?view=settings");
                  }}
                >
                  <Settings size={16} /> {t.settings}
                </button>
                <div className="popover-divider" />
                <button type="button" className="signout-item" onClick={handleLogout}>
                  <LogOut size={16} /> {t.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

