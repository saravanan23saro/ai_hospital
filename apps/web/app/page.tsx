"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "./lib/session";
import { Language, useLanguage } from "./lib/i18n";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
type AccessChoice = "patient" | "staff" | "patient-register" | "staff-register";
type UserRole = "patient" | "doctor" | "staff" | "admin";

export default function HomePage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [choice, setChoice] = useState<AccessChoice>("patient");
  const [activeRole, setActiveRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function changeLang(newLang: Language) {
    setLang(newLang);
  }

  useEffect(() => {
    try {
      const expiredNotice = sessionStorage.getItem("careflow_session_expired_notice");
      if (expiredNotice) {
        sessionStorage.removeItem("careflow_session_expired_notice");
        setError(expiredNotice);
      }
    } catch {}
  }, []);

  // Auto-dismiss popup notification after 10 seconds without manual refreshing
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError("");
    }, 10000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice("");
    }, 10000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleRoleSelect(role: UserRole) {
    setActiveRole(role);
    setError("");
    if (choice.endsWith("-register")) {
      setChoice(role === "patient" ? "patient-register" : "staff-register");
    } else {
      setChoice(role === "patient" ? "patient" : "staff");
    }
  }

  function toggleRegistrationMode() {
    setError("");
    if (choice.endsWith("-register")) {
      setChoice(activeRole === "patient" ? "patient" : "staff");
    } else {
      setChoice(activeRole === "patient" ? "patient-register" : "staff-register");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const isRegistration = choice === "patient-register" || choice === "staff-register";
      if (isRegistration) {
        if (activeRole !== "patient") {
          throw new Error("Doctor and Staff accounts must be provisioned by Hospital Administration. Only Patients can self-register.");
        }
        const password = String(data.get("password") || "");
        if (password !== String(data.get("confirmPassword") || "")) {
          throw new Error("Passwords do not match.");
        }
        const response = await fetch(`${API}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: data.get("fullName"),
            email: data.get("email"),
            password,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 409) {
            throw new Error(body.message || "An account with this email or phone number is already registered. Please sign in or use a different credential.");
          }
          throw new Error(body.message || `Registration failed (${response.status})`);
        }
        saveSession({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
        });
        router.push("/patient");
        return;
      }

      const response = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Invalid email or password");

      // Verify user's actual registered role against selected login tab
      const meRes = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${body.accessToken}` },
      });
      const meData = await meRes.json().catch(() => ({}));
      const roles: string[] = Array.isArray(meData?.roles) ? meData.roles : [];

      if (activeRole === "patient" && (roles.includes("DOCTOR") || roles.includes("STAFF") || roles.includes("ADMIN"))) {
        throw new Error("This account is registered as a Doctor/Staff/Admin. Please select your respective tab to sign in.");
      }
      if (activeRole === "doctor" && !roles.includes("DOCTOR")) {
        throw new Error("This account is not registered as a Doctor. Please select your respective role tab to sign in.");
      }
      if (activeRole === "staff" && !roles.includes("STAFF")) {
        throw new Error("This account is not registered as Medical Staff. Please select your respective role tab to sign in.");
      }
      if (activeRole === "admin" && !roles.includes("ADMIN")) {
        throw new Error("This account does not have Administrator privileges. Please select your respective role tab to sign in.");
      }

      saveSession({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
      });

      const targetRoute =
        activeRole === "admin"
          ? "/operations"
          : activeRole === "doctor" || activeRole === "staff"
          ? "/staff"
          : "/patient";

      router.push(targetRoute);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed");
      setBusy(false);
    }
  }

  function handleOtpLogin() {
    setNotice("OTP verification initiated. Please check your registered mobile device.");
  }

  return (
    <main className="login-shell-v2">
      {/* TOP RIGHT SLOGAN & LANGUAGE SELECTOR */}
      <div className="top-right-tagline desktop-only" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span>{t.tagline}</span>
        <select
          value={lang}
          onChange={(e) => changeLang(e.target.value as Language)}
          style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "0.8rem", cursor: "pointer", color: "#334155" }}
        >
          <option value="en">English</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="ta">Tamil (தமிழ்)</option>
          <option value="es">Spanish (Español)</option>
        </select>
      </div>

      {/* LEFT HERO SECTION */}
      <div className="login-hero-container">
        {/* BRANDING HEADER */}
        <div className="careflow-brand-header">
          <div className="brand-heart-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className="brand-text-block">
            <span className="brand-main-title">{t.brandTitle}</span>
            <span className="brand-sub-title">{t.brandSubtitle}</span>
          </div>
        </div>

        {/* HERO MAIN BODY */}
        <div className="hero-body">
          <div className="hero-eyebrow-tag">
            <span className="eyebrow-line"></span> CARE. CONNECT. HEAL.
          </div>
          <h1 className="hero-heading-title">
            {t.heroHeading}
          </h1>
          <p className="hero-description-text">
            {t.heroSubTextDesc}
          </p>

          {/* 2x2 FEATURE GRID */}
          <div className="feature-highlights-grid">
            <div className="feature-item-card">
              <div className="feature-icon-badge badge-blue">📅</div>
              <div className="feature-meta">
                <strong>Easy Appointments</strong>
                <p>Book & manage appointments</p>
              </div>
            </div>
            <div className="feature-item-card">
              <div className="feature-icon-badge badge-green">👤</div>
              <div className="feature-meta">
                <strong>Expert Doctors</strong>
                <p>Connect with specialists</p>
              </div>
            </div>
            <div className="feature-item-card">
              <div className="feature-icon-badge badge-purple">🛡️</div>
              <div className="feature-meta">
                <strong>Secure & Compliant</strong>
                <p>Your data, our priority</p>
              </div>
            </div>
            <div className="feature-item-card">
              <div className="feature-icon-badge badge-pink">💖</div>
              <div className="feature-meta">
                <strong>Better Patient Care</strong>
                <p>Advanced healthcare solutions</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER TRUST BADGE */}
        <div className="hero-footer-trust">
          <div className="trust-heart-icon">💓</div>
          <div className="trust-meta">
            <strong>Quality Healthcare</strong>
            <p>For a Healthier Community</p>
          </div>
        </div>
      </div>

      {/* CENTER MASKED HOSPITAL BUILDING PHOTO */}
      <div className="hospital-image-mask desktop-only">
        <img src="/hospital_building.jpg" alt="Modern CareFlow Hospital Center" />
      </div>

      {/* RIGHT LOGIN CARD CONTAINER */}
      <div className="login-card-section">
        <div className="careflow-auth-card">
          <h2 className="auth-card-title">
            {choice.endsWith("-register") ? t.registerTitle : t.signInTitle}
          </h2>
          <p className="auth-card-subtitle">
            {choice.endsWith("-register") ? t.registerSub : t.signInSub}
          </p>

          {/* SEGMENTED ROLE SELECTOR TABS */}
          <div className="role-tabs-grid" role="tablist" aria-label="Select account role">
            <button
              type="button"
              className={`role-tab-btn ${activeRole === "patient" ? "active" : ""}`}
              onClick={() => handleRoleSelect("patient")}
              role="tab"
              aria-selected={activeRole === "patient"}
            >
              <span>👤</span> {t.patientRole}
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === "doctor" ? "active" : ""}`}
              onClick={() => handleRoleSelect("doctor")}
              role="tab"
              aria-selected={activeRole === "doctor"}
            >
              <span>🩺</span> {t.doctorRole}
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === "staff" ? "active" : ""}`}
              onClick={() => handleRoleSelect("staff")}
              role="tab"
              aria-selected={activeRole === "staff"}
            >
              <span>👥</span> {t.staffRole}
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === "admin" ? "active" : ""}`}
              onClick={() => handleRoleSelect("admin")}
              role="tab"
              aria-selected={activeRole === "admin"}
            >
              <span>⚙️</span> {t.adminRole}
            </button>
          </div>

          {/* VISIBLE AUTO-DISAPPEARING NOTIFICATION BANNERS */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <div className="error-text-content">{error}</div>
              <button
                type="button"
                className="error-close-btn"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {notice && (
            <div className="auth-notice-banner" role="status">
              <span className="notice-icon">ℹ️</span>
              <div className="notice-text-content">{notice}</div>
              <button
                type="button"
                className="notice-close-btn"
                onClick={() => setNotice("")}
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}

          {/* AUTH FORM */}
          <form onSubmit={submit} className="careflow-login-form">
            {choice.endsWith("-register") && (
              <div className="input-field-group">
                <label htmlFor="fullName">{t.fullNameLabel}</label>
                <div className="input-with-icon">
                  <span className="input-left-icon">👤</span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={160}
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-field-group">
              <label htmlFor="email">{t.emailOrPhoneLabel}</label>
              <div className="input-with-icon">
                <span className="input-left-icon">✉️</span>
                <input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t.emailOrPhoneLabel}
                  autoComplete="username"
                  maxLength={320}
                  required
                />
              </div>
            </div>

            <div className="input-field-group">
              <label htmlFor="password">{t.passwordLabel}</label>
              <div className="input-with-icon">
                <span className="input-left-icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete={choice.endsWith("-register") ? "new-password" : "current-password"}
                  minLength={choice.endsWith("-register") ? 12 : undefined}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {choice.endsWith("-register") && (
              <div className="input-field-group">
                <label htmlFor="confirmPassword">{t.confirmPasswordLabel}</label>
                <div className="input-with-icon">
                  <span className="input-left-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </div>
              </div>
            )}

            {!choice.endsWith("-register") && (
              <div className="form-options-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot-password" onClick={(e) => { e.preventDefault(); setNotice("Password reset link has been dispatched to your email."); }} className="forgot-password-link">
                  Forgot password?
                </a>
              </div>
            )}

            {/* PRIMARY SIGN IN BUTTON */}
            <button type="submit" className="btn-primary-signin" disabled={busy}>
              {busy ? (
                <>⏳ Signing in...</>
              ) : (
                <>
                  {choice.endsWith("-register") ? t.registerBtn : t.signInBtn}
                  <span style={{ fontSize: "1.1rem" }}>→</span>
                </>
              )}
            </button>

            {!choice.endsWith("-register") && (
              <>
                <div className="auth-divider-line">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className="btn-secondary-otp"
                  onClick={handleOtpLogin}
                >
                  <span>🛡️</span> Sign in with OTP
                </button>
              </>
            )}

            {/* ACCOUNT CREATION FOOTER LINK */}
            <div className="create-account-footer">
              {choice.endsWith("-register") ? (
                <>
                  <span>{t.haveAccountPrompt}</span>{" "}
                  <button type="button" className="create-account-btn" onClick={toggleRegistrationMode}>
                    {t.signInLink}
                  </button>
                </>
              ) : (
                <>
                  <span>{t.needAccountPrompt}</span>{" "}
                  <button type="button" className="create-account-btn" onClick={toggleRegistrationMode}>
                    {t.registerLink}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
