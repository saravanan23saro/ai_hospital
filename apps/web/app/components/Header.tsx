"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, sessionFetch } from "../lib/session";
import { Language, useLanguage } from "../lib/i18n";
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
  const [unreadCount, setUnreadCount] = useState(3);
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

  // Fetch in-app notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  async function fetchNotifications() {
    try {
      const res = await sessionFetch(API, "/api/v1/patients/me/appointments").catch(() => null);
      if (res && res.ok) {
        const appts = await res.json().catch(() => []);
        if (Array.isArray(appts) && appts.length > 0) {
          const notifs: NotificationItem[] = appts.slice(0, 5).map((a: any) => ({
            notificationId: a.appointmentId,
            subject: `Appointment ${a.appointmentNumber}`,
            body: `Status: ${a.status} on ${new Date(a.startsAt).toLocaleString()}`,
            status: a.status === "COMPLETED" ? "READ" : "SENT",
          }));
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => n.status !== "READ").length || 3);
        }
      }
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
      ? "Doctor"
      : user?.roles?.includes("ADMIN")
      ? "Administrator"
      : user?.roles?.includes("STAFF")
      ? "Medical Staff"
      : "Patient";

  const displayName =
    user?.fullName && user.fullName !== "Patient Account" && user.fullName !== "Staff Member"
      ? user.fullName
      : user?.email
      ? user.email.split("@")[0]
      : user?.roles?.includes("DOCTOR")
      ? "Doctor User"
      : "Mary";

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
        <div className="header-lang-selector" style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "4px 8px", borderRadius: "8px", border: "1px solid #dce7ef" }}>
          <Globe size={16} style={{ color: "#1689D8" }} />
          <select
            value={currentLang}
            onChange={(e) => setLang(e.target.value as Language)}
            style={{ background: "transparent", border: "none", fontSize: "0.825rem", fontWeight: 600, color: "#102a43", cursor: "pointer", outline: "none" }}
            aria-label="Select portal language"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="es">Español (Spanish)</option>
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
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("profile");
                    else if (onProfileClick) onProfileClick();
                  }}
                >
                  <User size={16} /> {t.profile}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("appointments");
                  }}
                >
                  <Calendar size={16} /> {t.appointments}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("prescriptions");
                  }}
                >
                  <FileText size={16} /> {t.myPrescriptions}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("payments");
                  }}
                >
                  <CreditCard size={16} /> {t.paymentsInvoices}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onNavigateView) onNavigateView("settings");
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
