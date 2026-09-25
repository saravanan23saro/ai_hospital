"use client";

import { useEffect, useState } from "react";

export type Language = "en" | "ta" | "hi" | "es";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    brandTitle: "CareFlow AI",
    brandSubtitle: "Smart Hospital Management",
    searchPlaceholder: "Search appointments, doctors, invoices...",
    patientCare: "PATIENT CARE",
    patientPortal: "Patient Portal",
    home: "Home",
    profile: "Profile",
    bookAppointment: "Book appointment",
    appointments: "Appointments",
    paymentsInvoices: "Payments & Invoices",
    myPrescriptions: "My Prescriptions",
    settings: "Settings",
    signOut: "Sign out",
    needHelp: "Need help?",
    wereHereForYou: "We're here for you",
    contactSupport: "Contact Support",
    language: "Language",

    // Login & Register Pages
    signInTitle: "Sign in to your account",
    registerTitle: "Create your account",
    signInSub: "Access your dashboard and manage your healthcare services.",
    registerSub: "Fill in your details below to register your account.",
    patientRole: "Patient",
    doctorRole: "Doctor",
    staffRole: "Staff",
    adminRole: "Admin",
    emailOrPhoneLabel: "Email address or 10-digit phone number",
    passwordLabel: "Password",
    fullNameLabel: "Full Name",
    confirmPasswordLabel: "Confirm Password",
    signInBtn: "Sign In",
    registerBtn: "Register Account",
    needAccountPrompt: "Don't have an account?",
    haveAccountPrompt: "Already have an account?",
    registerLink: "Register as a Patient",
    signInLink: "Sign In",
    tagline: "Better Care | Smarter Operations | Healthier Tomorrow",
    heroHeading: "Welcome to CareFlow",
    heroSubTextDesc: "Your trusted partner in modern healthcare management. Streamlining appointments, consultations, and hospital operations for better patient outcomes.",

    // Hero Section
    yourCare: "Your care,",
    organized: "organized.",
    heroSubtext: "Welcome back, {name}! Manage your health, appointments, and payments all in one secure place.",
    personalHealth: "Personal Health",
    viewUpcomingVisits: "View upcoming visits",
    viewYourPrescriptions: "View your prescriptions",
    viewInvoicesPayments: "View invoices & payments",

    // Cards
    welcome: "Welcome",
    welcomeDesc: "Complete your profile, find an available doctor, confirm an appointment, and process consultation payments.",
    healthDataSafe: "Your health data is safe with us",
    healthDataSafeDesc: "We use industry-standard security to protect your personal information.",
    nextSteps: "Next steps",
    nextStepsDesc: "Take the next steps to manage your health journey efficiently.",
    completeProfile: "Complete profile",
    addPersonalDetails: "Add your personal details",
    findSlot: "Find a slot",
    bookAnAppointment: "Book an appointment",
    viewPayments: "View Payments",
    checkInvoicesHistory: "Check invoices & payment history",
    goToMainDashboard: "Go to Main Dashboard",
    mainDashboardDesc: "Access the main portal dashboard to manage all hospital operations.",

    // Settings
    accountPortalSettings: "Account & Portal Settings",
    manageSettingsDesc: "Manage your notification alerts, security credentials, and portal preferences.",
    notificationPreferences: "Notification Preferences",
    smsReminders: "SMS Appointment Reminders",
    smsRemindersDesc: "Receive instant SMS alerts 2 hours prior to scheduled doctor visits.",
    emailReceipts: "Email Billing & Receipts",
    emailReceiptsDesc: "Automatically send PDF transaction receipts and invoice summaries.",
    prescriptionAlerts: "Digital Prescription Issued Alerts",
    prescriptionAlertsDesc: "Get real-time notifications as soon as your treating doctor issues an Rx.",
    securityCredentials: "Security & Credentials",
    currentPassword: "Current Password",
    newPassword: "New Password (min 12 chars)",
    updatePassword: "Update Password",
    portalRegionalPreferences: "Portal Regional Preferences",
    preferredPortalLanguage: "Preferred Portal Language",
    portalDisplayTheme: "Portal Display Theme",
    lightTheme: "Light Healthcare Mode (Recommended)",
    darkTheme: "Dark Healthcare Mode",
    saveAllSettings: "Save All Settings",
    backToOverview: "Back to Overview",

    // Sub-views: Profile
    patientProfileTitle: "Patient Profile & Personal Information",
    dob: "Date of birth",
    phone: "Phone",
    gender: "Gender",
    selectGender: "Select gender",
    male: "Male",
    female: "Female",
    nonBinary: "Non-binary",
    preferNotToSay: "Prefer not to say",
    preferredLang: "Preferred language",
    emergencyContact: "Emergency contact",
    bloodGroup: "Blood group",
    selectBloodGroup: "Select blood group",
    doNotKnow: "Do not know",
    address: "Address",
    allergiesOptional: "Allergies (optional)",
    allergiesPlaceholder: "Medicines, foods, or other known allergies",
    medicalConditionsOptional: "Existing medical conditions (optional)",
    medicalConditionsPlaceholder: "For example: diabetes, asthma, or hypertension",
    saveProfile: "Save profile",

    // Sub-views: Book Appointment
    findAppointment: "Find an appointment",
    chooseDepartment: "Choose a department",
    date: "Date",
    searchSlots: "Search available slots",
    searching: "Searching…",
    availableTimes: "available times",
    selectTimeToReserve: "Select a time to reserve and confirm",
    chooseDeptAndDatePrompt: "Choose a department and date to see available slots.",
    noSlotsFound: "No available slots were found for this department and date. Try another date or choose a different department.",

    // Sub-views: Appointments
    myAppointments: "My Appointments",
    statusLabel: "Status:",
    paidBadge: "✓ PAID",
    viewReceipt: "View Receipt",
    payNow: "💳 Pay Now (₹1,000)",
    cancelAppointment: "Cancel appointment",
    noAppointmentsYet: "No appointments yet.",

    // Sub-views: Payments
    paymentsAndReceiptsTitle: "Payments & Receipts",
    noPaymentsFound: "No payment records found yet. Book an appointment and click \"Pay Now\".",
    amount: "Amount:",
    provider: "Provider:",
    paidAt: "Paid at:",

    // Sub-views: Prescriptions
    myPrescriptionsTitle: "My Medical Prescriptions",
    doctor: "Doctor:",
    diagnosis: "Diagnosis:",
    issuedOn: "Issued on:",
    prescribedMedicines: "Prescribed Medicines:",
    viewPrescriptionDetails: "View Prescription Details",
    downloadDocument: "📥 Download Document",
    noPrescriptionsYet: "No prescriptions issued yet. Completed doctor consultations will automatically generate digital prescriptions here.",

    // Staff & Operations
    staffWorkspace: "Staff Workspace",
    clinicalOperations: "CLINICAL OPERATIONS",
    staffWorkspaceTitle: "Staff workspace.",
    doctorApprovals: "Doctor approvals",
    refreshDoctorData: "Refresh doctor data",
    applyAsDoctor: "Apply as a doctor",
    specialization: "Specialization",
    selectSpecialization: "Select specialization",
    department: "Department",
    qualifications: "Qualifications",
    experienceYears: "Years of experience",
    medicalLicenseNumber: "Medical license number",
    submitApplication: "Submit Doctor Application",
    liveOperations: "LIVE OPERATIONS",
    operationalControl: "Operational control.",
    backToStaffPortal: "Back to Staff Portal",
    backHome: "Back Home",

    // Footer
    allRightsReserved: "© 2026 CareFlow AI. All rights reserved.",
    hipaaCompliant: "HIPAA Compliant",
    encryption: "256-bit Encryption",
    support247: "24/7 Support",
  },
  ta: {
    // Brand & Header
    brandTitle: "கேர்ஃப்ளோ AI",
    brandSubtitle: "ஸ்மார்ட் மருத்துவமனை நிர்வாகம்",
    searchPlaceholder: "சந்திப்புகள், மருத்துவர்கள், இன்வாய்ஸ்களைத் தேடுங்கள்...",
    patientCare: "நோயாளி பராமரிப்பு",
    patientPortal: "நோயாளி போர்டல்",
    home: "முகப்பு",
    profile: "சுயவிவரம்",
    bookAppointment: "சந்திப்பு பதிவு செய்ய",
    appointments: "என் சந்திப்புகள்",
    paymentsInvoices: "கட்டணங்கள் மற்றும் இன்வாய்ஸ்கள்",
    myPrescriptions: "என் மருத்துவச் சீட்டுகள்",
    settings: "அமைப்புகள்",
    signOut: "வெளியேறு",
    needHelp: "உதவி தேவையா?",
    wereHereForYou: "நாங்கள் உங்களுக்காக இருக்கிறோம்",
    contactSupport: "ஆதரவைத் தொடர்பு கொள்ளவும்",
    language: "மொழி",

    // Login & Register Pages
    signInTitle: "உங்கள் கணக்கில் புகுபதியவும்",
    registerTitle: "உங்கள் கணக்கை உருவாக்கவும்",
    signInSub: "உங்கள் டாஷ்போர்டை அணுகி சுகாதார சேவைகளை நிர்வகிக்கவும்.",
    registerSub: "உங்கள் கணக்கைப் பதிவு செய்ய கீழே உங்கள் விவரங்களை நிரப்பவும்.",
    patientRole: "நோயாளி",
    doctorRole: "மருத்துவர்",
    staffRole: "பணியாளர்",
    adminRole: "நிர்வாகி",
    emailOrPhoneLabel: "மின்னஞ்சல் முகவரி அல்லது 10 இலக்க தொலைபேசி எண்",
    passwordLabel: "கடவுச்சொல்",
    fullNameLabel: "முழு பெயர்",
    confirmPasswordLabel: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    signInBtn: "உள்நுழையவும்",
    registerBtn: "கணக்கைப் பதிவு செய்",
    needAccountPrompt: "கணக்கு இல்லையா?",
    haveAccountPrompt: "ஏற்கனவே கணக்கு உள்ளதா?",
    registerLink: "நோயாளியாகப் பதிவு செய்க",
    signInLink: "உள்நுழைக",
    tagline: "சிறந்த பராமரிப்பு | சிறந்த செயல்பாடுகள் | ஆரோக்கியமான நாளை",
    heroHeading: "கேர்ஃப்ளோவிற்கு வரவேற்கிறோம்",
    heroSubTextDesc: "நவீன சுகாதார நிர்வாகத்தில் உங்கள் நம்பிக்கைக்குரிய கூட்டாளி. நோயாளி விளைவுகளை மேம்படுத்த சந்திப்புகள் மற்றும் செயல்பாடுகளை எளிமையாக்குகிறது.",

    // Hero Section
    yourCare: "உங்கள் பராமரிப்பு,",
    organized: "சீராக்கப்பட்டது.",
    heroSubtext: "மீண்டும் வருக, {name}! உங்கள் ஆரோக்கியம், சந்திப்புகள் மற்றும் கட்டணங்களை ஒரே பாதுகாப்பான இடத்தில் நிர்வகிக்கவும்.",
    personalHealth: "தனிப்பட்ட ஆரோக்கியம்",
    viewUpcomingVisits: "வரவிருக்கும் வருகைகளைக் காண்க",
    viewYourPrescriptions: "உங்கள் மருந்துச் சீட்டுகளைக் காண்க",
    viewInvoicesPayments: "இன்வாய்ஸ்கள் & கட்டணங்களைக் காண்க",

    // Cards
    welcome: "வரவேற்கிறோம்",
    welcomeDesc: "உங்கள் சுயவிவரத்தைப் பூர்த்தி செய்து, கிடைக்கக்கூடிய மருத்துவரைத் தேர்ந்தெடுத்து சந்திப்பை உறுதிசெய்யவும்.",
    healthDataSafe: "உங்கள் சுகாதாரத் தரவு எங்களுடன் பாதுகாப்பாக உள்ளது",
    healthDataSafeDesc: "உங்கள் தனிப்பட்ட தகவலைப் பாதுகாக்க தொழில்துறை தரநிலை பாதுகாப்பைப் பயன்படுத்துகிறோம்.",
    nextSteps: "அடுத்த கட்டங்கள்",
    nextStepsDesc: "உங்கள் சுகாதாரப் பயணத்தை திறம்பட நிர்வகிக்க அடுத்த படிகளை எடுக்கவும்.",
    completeProfile: "சுயவிவரத்தைப் பூர்த்தி செய்",
    addPersonalDetails: "உங்கள் தனிப்பட்ட விவரங்களைச் சேர்க்கவும்",
    findSlot: "நேரத்தைத் தேர்ந்தெடு",
    bookAnAppointment: "மருத்துவர் சந்திப்பைப் பதிவு செய்",
    viewPayments: "கட்டணங்களைப் பார்",
    checkInvoicesHistory: "இன்வாய்ஸ்கள் & கட்டண வரலாற்றைச் சரிபார்",
    goToMainDashboard: "முதன்மை டாஷ்போர்டிற்குச் செல்",
    mainDashboardDesc: "அனைத்து மருத்துவமனை செயல்பாடுகளையும் நிர்வகிக்க முதன்மை போர்டல் டாஷ்போர்டை அணுகவும்.",

    // Settings
    accountPortalSettings: "கணக்கு & போர்டல் அமைப்புகள்",
    manageSettingsDesc: "உங்கள் அறிவிப்புகள், பாதுகாப்புச் சான்றுகள் மற்றும் போர்டல் விருப்பங்களை நிர்வகிக்கவும்.",
    notificationPreferences: "அறிவிப்பு விருப்பங்கள்",
    smsReminders: "எஸ்எம்எஸ் சந்திப்பு நினைவூட்டல்கள்",
    smsRemindersDesc: "திட்டமிடப்பட்ட வருகைக்கு 2 மணிநேரத்திற்கு முன் உடனடி எஸ்எம்எஸ் அறிவிப்புகளைப் பெறுங்கள்.",
    emailReceipts: "மின்னஞ்சல் பில்லிங் & ரசீதுகள்",
    emailReceiptsDesc: "பிடிஎஃப் பரிவர்த்தனை ரசீதுகளைத் தானாக மின்னஞ்சல் அனுப்பவும்.",
    prescriptionAlerts: "டிஜிட்டல் மருந்துச்சீட்டு அறிவிப்புகள்",
    prescriptionAlertsDesc: "உங்கள் மருத்துவர் மருந்துச்சீட்டை வெளியிட்டவுடன் அறிவிப்பைப் பெறுங்கள்.",
    securityCredentials: "பாதுகாப்பு & கடவுச்சொல்",
    currentPassword: "தற்போதைய கடவுச்சொல்",
    newPassword: "புதிய கடவுச்சொல் (குறைந்தது 12 எழுத்துகள்)",
    updatePassword: "கடவுச்சொல்லைப் புதுப்பிக்கவும்",
    portalRegionalPreferences: "போர்டல் பிராந்திய விருப்பங்கள்",
    preferredPortalLanguage: "விருப்பமான போர்டல் மொழி",
    portalDisplayTheme: "போர்டல் காட்சி தீம்",
    lightTheme: "லைட் ஹெல்த்கேர் பயன்முறை (பரிந்துரைக்கப்படுகிறது)",
    darkTheme: "டார்க் ஹெல்த்கேர் பயன்முறை",
    saveAllSettings: "அனைத்து அமைப்புகளையும் சேமிக்கவும்",
    backToOverview: "கண்ணோட்டத்திற்குத் திரும்பு",

    // Sub-views: Profile
    patientProfileTitle: "நோயாளி சுயவிவரம் & தனிப்பட்ட தகவல்கள்",
    dob: "பிறந்த தேதி",
    phone: "தொலைபேசி எண்",
    gender: "பாலினம்",
    selectGender: "பாலினத்தைத் தேர்ந்தெடுக்கவும்",
    male: "ஆண்",
    female: "பெண்",
    nonBinary: "நான்-பைனரி",
    preferNotToSay: "கூற விரும்பவில்லை",
    preferredLang: "விருப்பமான மொழி",
    emergencyContact: "அவசரத் தொடர்பு எண்",
    bloodGroup: "இரத்த வகை",
    selectBloodGroup: "இரத்த வகையைத் தேர்ந்தெடுக்கவும்",
    doNotKnow: "தெரியாது",
    address: "முகவரி",
    allergiesOptional: "ஒவ்வாமைகள் (விருப்பத்திற்குரியது)",
    allergiesPlaceholder: "மருந்துகள், உணவுகள் அல்லது பிற ஒவ்வாமைகள்",
    medicalConditionsOptional: "தற்போதுள்ள மருத்துவ நிலைகள் (விருப்பத்திற்குரியது)",
    medicalConditionsPlaceholder: "எடுத்துக்காட்டாக: நீரிழிவு, ஆஸ்துமா அல்லது உயர் இரத்த அழுத்தம்",
    saveProfile: "சுயவிவரத்தைச் சேமிக்கவும்",

    // Sub-views: Book Appointment
    findAppointment: "சந்திப்பைக் கண்டறியவும்",
    chooseDepartment: "துறையைத் தேர்ந்தெடுக்கவும்",
    date: "தேதி",
    searchSlots: "கிடைக்கக்கூடிய நேரங்களைத் தேடுங்கள்",
    searching: "தேடுகிறது...",
    availableTimes: "கிடைக்கக்கூடிய நேரங்கள்",
    selectTimeToReserve: "முன்பதிவு செய்ய நேரத்தைத் தேர்ந்தெடுக்கவும்",
    chooseDeptAndDatePrompt: "கிடைக்கக்கூடிய நேரங்களைப் பார்க்க ஒரு துறையையும் தேதியையும் தேர்ந்தெடுக்கவும்.",
    noSlotsFound: "இந்தத் துறை மற்றும் தேதிக்கு நேரங்கள் எதுவும் கிடைக்கவில்லை.",

    // Sub-views: Appointments
    myAppointments: "என் சந்திப்புகள்",
    statusLabel: "நிலை:",
    paidBadge: "✓ செலுத்தப்பட்டது",
    viewReceipt: "ரசீதைப் பார்",
    payNow: "💳 இப்போது செலுத்துங்கள் (₹1,000)",
    cancelAppointment: "சந்திப்பை ரத்து செய்",
    noAppointmentsYet: "இன்னும் சந்திப்புகள் எதுவும் இல்லை.",

    // Sub-views: Payments
    paymentsAndReceiptsTitle: "கட்டணங்கள் மற்றும் இன்வாய்ஸ்கள்",
    noPaymentsFound: "இன்னும் கட்டண பதிவுகள் எதுவும் இல்லை. ஒரு சந்திப்பைப் பதிவுசெய்து 'இப்போது செலுத்து' என்பதைக் கிளிக் செய்யவும்.",
    amount: "தொகை:",
    provider: "வழங்குபவர்:",
    paidAt: "செலுத்தப்பட்ட நேரம்:",

    // Sub-views: Prescriptions
    myPrescriptionsTitle: "என் மருத்துவ மருந்துச் சீட்டுகள்",
    doctor: "மருத்துவர்:",
    diagnosis: "நோயறிதல்:",
    issuedOn: "வழங்கப்பட்ட தேதி:",
    prescribedMedicines: "பரிந்துரைக்கப்பட்ட மருந்துகள்:",
    viewPrescriptionDetails: "மருந்துச் சீட்டு விவரங்களைப் பார்",
    downloadDocument: "📥 ஆவணத்தைப் பதிவிறக்கவும்",
    noPrescriptionsYet: "இன்னும் மருந்துச் சீட்டுகள் எதுவும் வழங்கப்படவில்லை.",

    // Staff & Operations
    staffWorkspace: "பணியாளர் பணிப்பகுதி",
    clinicalOperations: "மருத்துவ செயல்பாடுகள்",
    staffWorkspaceTitle: "பணியாளர் பணிப்பகுதி.",
    doctorApprovals: "மருத்துவர் ஒப்புதல்கள்",
    refreshDoctorData: "மருத்துவர் தரவைப் புதுப்பிக்கவும்",
    applyAsDoctor: "மருத்துவராக விண்ணப்பிக்கவும்",
    specialization: "சிறப்புத் துறை",
    selectSpecialization: "சிறப்புத் துறையைத் தேர்ந்தெடுக்கவும்",
    department: "துறை",
    qualifications: "தகுதிகள்",
    experienceYears: "அனுபவ ஆண்டுகள்",
    medicalLicenseNumber: "மருத்துவ உரிம எண்",
    submitApplication: "மருத்துவர் விண்ணப்பத்தைச் சமர்ப்பிக்கவும்",
    liveOperations: "நேரடி செயல்பாடுகள்",
    operationalControl: "செயல்பாட்டு கட்டுப்பாடு.",
    backToStaffPortal: "பணியாளர் போர்ட்டலுக்குத் திரும்பு",
    backHome: "முகப்பிற்குத் திரும்பு",

    // Footer
    allRightsReserved: "© 2026 கேர்ஃப்ளோ AI. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    hipaaCompliant: "HIPAA இணக்கமானது",
    encryption: "256-பிட் குறியாக்கம்",
    support247: "24/7 ஆதரவு",
  },
  hi: {
    // Brand & Header
    brandTitle: "केयरफ्लो AI",
    brandSubtitle: "स्मार्ट अस्पताल प्रबंधन",
    searchPlaceholder: "अपॉइंटमेंट, डॉक्टर, चालान खोजें...",
    patientCare: "रोगी देखभाल",
    patientPortal: "रोगी पोर्टल",
    home: "होम",
    profile: "प्रोफ़ाइल",
    bookAppointment: "अपॉइंटमेंट बुक करें",
    appointments: "मेरे अपॉइंटमेंट",
    paymentsInvoices: "भुगतान और चालान",
    myPrescriptions: "मेरे नुस्खे",
    settings: "सेटिंग्स",
    signOut: "साइन आउट",
    needHelp: "क्या आपको मदद चाहिए?",
    wereHereForYou: "हम आपके लिए यहां हैं",
    contactSupport: "सपोर्ट से संपर्क करें",
    language: "भाषा",

    // Login & Register Pages
    signInTitle: "अपने खाते में साइन इन करें",
    registerTitle: "अपना खाता बनाएं",
    signInSub: "अपने डैशबोर्ड तक पहुंचें और अपनी स्वास्थ्य सेवाओं को प्रबंधित करें।",
    registerSub: "अपना खाता पंजीकृत करने के लिए नीचे अपना विवरण भरें।",
    patientRole: "रोगी",
    doctorRole: "डॉक्टर",
    staffRole: "कर्मचारी",
    adminRole: "एडमिन",
    emailOrPhoneLabel: "ईमेल पता या 10 अंकों का फोन नंबर",
    passwordLabel: "पासवर्ड",
    fullNameLabel: "पूरा नाम",
    confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    signInBtn: "साइन इन करें",
    registerBtn: "खाता पंजीकृत करें",
    needAccountPrompt: "क्या आपका खाता नहीं है?",
    haveAccountPrompt: "क्या आपके पास पहले से खाता है?",
    registerLink: "रोगी के रूप में पंजीकरण करें",
    signInLink: "साइन इन करें",
    tagline: "बेहतर देखभाल | बेहतर संचालन | स्वस्थ कल",
    heroHeading: "केयरफ्लो में आपका स्वागत है",
    heroSubTextDesc: "आधुनिक स्वास्थ्य प्रबंधन में आपका विश्वसनीय भागीदार।",

    // Hero Section
    yourCare: "आपकी देखभाल,",
    organized: "सुव्यवस्थित।",
    heroSubtext: "स्वागत है, {name}! अपने स्वास्थ्य, अपॉइंटमेंट और भुगतान को एक सुरक्षित स्थान पर प्रबंधित करें।",
    personalHealth: "व्यक्तिगत स्वास्थ्य",
    viewUpcomingVisits: "आगामी यात्राएं देखें",
    viewYourPrescriptions: "अपने नुस्खे देखें",
    viewInvoicesPayments: "चालान और भुगतान देखें",

    // Cards
    welcome: "स्वागत है",
    welcomeDesc: "अपनी प्रोफ़ाइल पूरी करें, उपलब्ध डॉक्टर खोजें और अपॉइंटमेंट की पुष्टि करें।",
    healthDataSafe: "आपका स्वास्थ्य डेटा हमारे पास सुरक्षित है",
    healthDataSafeDesc: "हम आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए उद्योग-मानक सुरक्षा का उपयोग करते हैं।",
    nextSteps: "अगले कदम",
    nextStepsDesc: "अपनी स्वास्थ्य यात्रा को कुशलतापूर्वक प्रबंधित करने के लिए अगले कदम उठाएं।",
    completeProfile: "प्रोफ़ाइल पूरी करें",
    addPersonalDetails: "अपनी व्यक्तिगत जानकारी जोड़ें",
    findSlot: "समय स्लॉट खोजें",
    bookAnAppointment: "अपॉइंटमेंट बुक करें",
    viewPayments: "भुगतान देखें",
    checkInvoicesHistory: "चालान और भुगतान इतिहास जांचें",
    goToMainDashboard: "मुख्य डैशबोर्ड पर जाएं",
    mainDashboardDesc: "अस्पताल के सभी कार्यों को प्रबंधित करने के लिए मुख्य पोर्टल तक पहुंचें।",

    // Settings
    accountPortalSettings: "खाता और पोर्टल सेटिंग्स",
    manageSettingsDesc: "अपनी सूचनाएं, सुरक्षा साख और पोर्टल प्राथमिकताओं को प्रबंधित करें।",
    notificationPreferences: "सूचना प्राथमिकताएं",
    smsReminders: "एसएमएस अपॉइंटमेंट रिमाइंडर",
    smsRemindersDesc: "निर्धारित विज़िट से 2 घंटे पहले तुरंत एसएमएस अलर्ट प्राप्त करें।",
    emailReceipts: "ईमेल बिलिंग और रसीदें",
    emailReceiptsDesc: "पीडीएफ रसीदें स्वचालित रूप से ईमेल करें।",
    prescriptionAlerts: "डिजिटल नुस्खा अलर्ट",
    prescriptionAlertsDesc: "डॉक्टर द्वारा नुस्खा जारी करते ही सूचना प्राप्त करें।",
    securityCredentials: "सुरक्षा और क्रेडेंशियल",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड (न्यूनतम 12 अक्षर)",
    updatePassword: "पासवर्ड अपडेट करें",
    portalRegionalPreferences: "पोर्टल क्षेत्रीय प्राथमिकताएं",
    preferredPortalLanguage: "पसंदीदा पोर्टल भाषा",
    portalDisplayTheme: "पोर्टल डिस्प्ले थीम",
    lightTheme: "लाइट हेल्थकेयर मोड (अनुशंसित)",
    darkTheme: "डार्क हेल्थकेयर मोड",
    saveAllSettings: "सभी सेटिंग्स सहेजें",
    backToOverview: "वापस जाएँ",

    // Sub-views: Profile
    patientProfileTitle: "रोगी प्रोफ़ाइल और व्यक्तिगत जानकारी",
    dob: "जन्म तिथि",
    phone: "फोन",
    gender: "लिंग",
    selectGender: "लिंग चुनें",
    male: "पुरुष",
    female: "महिला",
    nonBinary: "नॉन-बाइनरी",
    preferNotToSay: "बताना नहीं चाहते",
    preferredLang: "पसंदीदा भाषा",
    emergencyContact: "आपतकालीन संपर्क",
    bloodGroup: "रक्त समूह",
    selectBloodGroup: "रक्त समूह चुनें",
    doNotKnow: "मालूम नहीं",
    address: "पता",
    allergiesOptional: "एलर्जी (वैकल्पिक)",
    allergiesPlaceholder: "दवाएं, भोजन या अन्य एलर्जी",
    medicalConditionsOptional: "मौजूदा चिकित्सीय स्थितियां (वैकल्पिक)",
    medicalConditionsPlaceholder: "उदाहरण के लिए: मधुमेह, अस्थमा, या उच्च रक्तचाप",
    saveProfile: "प्रोफ़ाइल सहेजें",

    // Sub-views: Book Appointment
    findAppointment: "अपॉइंटमेंट खोजें",
    chooseDepartment: "विभाग चुनें",
    date: "तिथि",
    searchSlots: "उपलब्ध स्लॉट खोजें",
    searching: "खोज रहा है...",
    availableTimes: "उपलब्ध समय",
    selectTimeToReserve: "आरक्षित और पुष्टि करने के लिए समय चुनें",
    chooseDeptAndDatePrompt: "उपलब्ध स्लॉट देखने के लिए एक विभाग और तिथि चुनें।",
    noSlotsFound: "इस विभाग और तिथि के लिए कोई उपलब्ध स्लॉट नहीं मिला।",

    // Sub-views: Appointments
    myAppointments: "मेरे अपॉइंटमेंट",
    statusLabel: "स्थिति:",
    paidBadge: "✓ भुगतान किया गया",
    viewReceipt: "रसीद देखें",
    payNow: "💳 अभी भुगतान करें (₹1,000)",
    cancelAppointment: "अपॉइंटमेंट रद्द करें",
    noAppointmentsYet: "अभी तक कोई अपॉइंटमेंट नहीं है।",

    // Sub-views: Payments
    paymentsAndReceiptsTitle: "भुगतान और चालान",
    noPaymentsFound: "अभी तक कोई भुगतान रिकॉर्ड नहीं मिला। एक अपॉइंटमेंट बुक करें और \"अभी भुगतान करें\" पर क्लिक करें।",
    amount: "राशि:",
    provider: "प्रदाता:",
    paidAt: "भुगतान का समय:",

    // Sub-views: Prescriptions
    myPrescriptionsTitle: "मेरे मेडिकल नुस्खे",
    doctor: "डॉक्टर:",
    diagnosis: "निदान:",
    issuedOn: "जारी करने की तिथि:",
    prescribedMedicines: "निर्धारित दवाएं:",
    viewPrescriptionDetails: "नुस्खे का विवरण देखें",
    downloadDocument: "📥 दस्तावेज़ डाउनलोड करें",
    noPrescriptionsYet: "अभी तक कोई नुस्खा जारी नहीं किया गया है।",

    // Staff & Operations
    staffWorkspace: "कर्मचारी कार्यक्षेत्र",
    clinicalOperations: "नेदानिक संचालन",
    staffWorkspaceTitle: "कर्मचारी कार्यक्षेत्र।",
    doctorApprovals: "डॉक्टर अनुमोदन",
    refreshDoctorData: "डॉक्टर डेटा ताज़ा करें",
    applyAsDoctor: "डॉक्टर के रूप में आवेदन करें",
    specialization: "विशेषज्ञता",
    selectSpecialization: "विशेषज्ञता चुनें",
    department: "विभाग",
    qualifications: "योग्यता",
    experienceYears: "अनुभव के वर्ष",
    medicalLicenseNumber: "मेडिकल लाइसेंस नंबर",
    submitApplication: "डॉक्टर आवेदन जमा करें",
    liveOperations: "लाइव संचालन",
    operationalControl: "परिचालन नियंत्रण।",
    backToStaffPortal: "कर्मचारी पोर्टल पर वापस जाएँ",
    backHome: "होम पर वापस जाएँ",

    // Footer
    allRightsReserved: "© 2026 केयरफ्लो AI। सर्वाधिकार सुरक्षित।",
    hipaaCompliant: "HIPAA अनुपालित",
    encryption: "256-बिट एन्क्रिप्शन",
    support247: "24/7 सहायता",
  },
  es: {
    // Brand & Header
    brandTitle: "CareFlow AI",
    brandSubtitle: "Gestión Hospitalaria Inteligente",
    searchPlaceholder: "Buscar citas, médicos, facturas...",
    patientCare: "ATENCIÓN AL PACIENTE",
    patientPortal: "Portal del Paciente",
    home: "Inicio",
    profile: "Perfil",
    bookAppointment: "Reservar cita",
    appointments: "Mis Citas",
    paymentsInvoices: "Pagos y Facturas",
    myPrescriptions: "Mis Recetas",
    settings: "Configuración",
    signOut: "Cerrar sesión",
    needHelp: "¿Necesita ayuda?",
    wereHereForYou: "Estamos aquí para usted",
    contactSupport: "Contactar Soporte",
    language: "Idioma",

    // Login & Register Pages
    signInTitle: "Inicie sesión en su cuenta",
    registerTitle: "Cree su cuenta",
    signInSub: "Acceda a su panel y gestione sus servicios de salud.",
    registerSub: "Rellene sus datos a continuación para registrar su cuenta.",
    patientRole: "Paciente",
    doctorRole: "Doctor",
    staffRole: "Personal",
    adminRole: "Admin",
    emailOrPhoneLabel: "Correo electrónico o número de teléfono de 10 dígitos",
    passwordLabel: "Contraseña",
    fullNameLabel: "Nombre completo",
    confirmPasswordLabel: "Confirmar contraseña",
    signInBtn: "Iniciar sesión",
    registerBtn: "Registrar cuenta",
    needAccountPrompt: "¿No tiene una cuenta?",
    haveAccountPrompt: "¿Ya tiene una cuenta?",
    registerLink: "Registrarse como Paciente",
    signInLink: "Iniciar sesión",
    tagline: "Mejor Atención | Operaciones Más Inteligentes | Mañana Más Saludable",
    heroHeading: "Bienvenido a CareFlow",
    heroSubTextDesc: "Su socio de confianza en la gestión sanitaria moderna.",

    // Hero Section
    yourCare: "Su atención,",
    organized: "organizada.",
    heroSubtext: "¡Bienvenido de nuevo, {name}! Gestione su salud, citas y pagos en un solo lugar seguro.",
    personalHealth: "Salud Personal",
    viewUpcomingVisits: "Ver próximas visitas",
    viewYourPrescriptions: "Ver sus recetas",
    viewInvoicesPayments: "Ver facturas y pagos",

    // Cards
    welcome: "Bienvenido",
    welcomeDesc: "Complete su perfil, busque un médico disponible y confirme su cita.",
    healthDataSafe: "Sus datos de salud están seguros con nosotros",
    healthDataSafeDesc: "Utilizamos seguridad estándar de la industria para proteger su información personal.",
    nextSteps: "Próximos pasos",
    nextStepsDesc: "Tome los siguientes pasos para gestionar su salud de manera eficiente.",
    completeProfile: "Completar perfil",
    addPersonalDetails: "Añada sus datos personales",
    findSlot: "Buscar horario",
    bookAnAppointment: "Reservar una cita",
    viewPayments: "Ver Pagos",
    checkInvoicesHistory: "Consultar facturas e historial de pagos",
    goToMainDashboard: "Ir al Panel Principal",
    mainDashboardDesc: "Acceda al panel principal para gestionar todas las operaciones hospitalarias.",

    // Settings
    accountPortalSettings: "Configuración de Cuenta y Portal",
    manageSettingsDesc: "Gestione sus alertas, credenciales de seguridad y preferencias.",
    notificationPreferences: "Preferencias de Notificación",
    smsReminders: "Recordatorios de Citas por SMS",
    smsRemindersDesc: "Reciba alertas por SMS 2 horas antes de sus citas médicas.",
    emailReceipts: "Facturación y Recibos por Correo",
    emailReceiptsDesc: "Envíe automáticamente recibos de pago en PDF por correo electrónico.",
    prescriptionAlerts: "Alertas de Recetas Emitidas",
    prescriptionAlertsDesc: "Reciba notificaciones en tiempo real cuando su médico emita una receta.",
    securityCredentials: "Seguridad y Credenciales",
    currentPassword: "Contraseña Actual",
    newPassword: "Nueva Contraseña (mínimo 12 caracteres)",
    updatePassword: "Actualizar Contraseña",
    portalRegionalPreferences: "Preferencias Regionales del Portal",
    preferredPortalLanguage: "Idioma Preferido del Portal",
    portalDisplayTheme: "Tema de Pantalla del Portal",
    lightTheme: "Modo Médico Claro (Recomendado)",
    darkTheme: "Modo Médico Oscuro",
    saveAllSettings: "Guardar Toda la Configuración",
    backToOverview: "Volver a la vista general",

    // Sub-views: Profile
    patientProfileTitle: "Perfil del Paciente e Información Personal",
    dob: "Fecha de nacimiento",
    phone: "Teléfono",
    gender: "Género",
    selectGender: "Seleccionar género",
    male: "Masculino",
    female: "Femenino",
    nonBinary: "No binario",
    preferNotToSay: "Prefiero no decirlo",
    preferredLang: "Idioma preferido",
    emergencyContact: "Contacto de emergencia",
    bloodGroup: "Grupo sanguíneo",
    selectBloodGroup: "Seleccionar grupo sanguíneo",
    doNotKnow: "No lo sé",
    address: "Dirección",
    allergiesOptional: "Alergias (opcional)",
    allergiesPlaceholder: "Medicamentos, alimentos u otras alergias conocidas",
    medicalConditionsOptional: "Condiciones médicas existentes (opcional)",
    medicalConditionsPlaceholder: "Por ejemplo: diabetes, asma o hipertensión",
    saveProfile: "Guardar perfil",

    // Sub-views: Book Appointment
    findAppointment: "Buscar una cita",
    chooseDepartment: "Elegir un departamento",
    date: "Fecha",
    searchSlots: "Buscar horarios disponibles",
    searching: "Buscando...",
    availableTimes: "horarios disponibles",
    selectTimeToReserve: "Seleccione una hora para reservar y confirmar",
    chooseDeptAndDatePrompt: "Elija un departamento y una fecha para ver los horarios disponibles.",
    noSlotsFound: "No se encontraron horarios disponibles para este departamento y fecha.",

    // Sub-views: Appointments
    myAppointments: "Mis Citas",
    statusLabel: "Estado:",
    paidBadge: "✓ PAGADO",
    viewReceipt: "Ver Recibo",
    payNow: "💳 Pagar Ahora (₹1,000)",
    cancelAppointment: "Cancelar cita",
    noAppointmentsYet: "No hay citas aún.",

    // Sub-views: Payments
    paymentsAndReceiptsTitle: "Pagos y Facturas",
    noPaymentsFound: "No se encontraron registros de pago aún. Reserve una cita y haga clic en \"Pagar ahora\".",
    amount: "Monto:",
    provider: "Proveedor:",
    paidAt: "Pagado el:",

    // Sub-views: Prescriptions
    myPrescriptionsTitle: "Mis Recetas Médicas",
    doctor: "Doctor:",
    diagnosis: "Diagnóstico:",
    issuedOn: "Emitido el:",
    prescribedMedicines: "Medicamentos recetados:",
    viewPrescriptionDetails: "Ver Detalles de la Receta",
    downloadDocument: "📥 Descargar Documento",
    noPrescriptionsYet: "No hay recetas emitidas aún.",

    // Staff & Operations
    staffWorkspace: "Espacio del Personal",
    clinicalOperations: "OPERACIONES CLÍNICAS",
    staffWorkspaceTitle: "Espacio del personal.",
    doctorApprovals: "Aprobaciones de médicos",
    refreshDoctorData: "Actualizar datos médicos",
    applyAsDoctor: "Solicitar ser médico",
    specialization: "Especialización",
    selectSpecialization: "Seleccionar especialización",
    department: "Departamento",
    qualifications: "Calificaciones",
    experienceYears: "Años de experiencia",
    medicalLicenseNumber: "Número de licencia médica",
    submitApplication: "Enviar solicitud de médico",
    liveOperations: "OPERACIONES EN VIVO",
    operationalControl: "Control operacional.",
    backToStaffPortal: "Volver al Portal del Personal",
    backHome: "Volver al Inicio",

    // Footer
    allRightsReserved: "© 2026 CareFlow AI. Todos los derechos reservados.",
    hipaaCompliant: "Compatible con HIPAA",
    encryption: "Cifrado de 256 bits",
    support247: "Soporte 24/7",
  },
};

export function setGlobalLanguage(newLang: Language) {
  try {
    localStorage.setItem("careflow_lang", newLang);
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("careflow_lang_change", { detail: newLang }));
  }
}

export function getGlobalLanguage(): Language {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("careflow_lang") as Language;
      if (saved && translations[saved]) return saved;
    } catch {}
  }
  return "en";
}

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    setLangState(getGlobalLanguage());

    function handleLangChange(e: any) {
      const l = e?.detail || getGlobalLanguage();
      if (translations[l as Language]) setLangState(l as Language);
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === "careflow_lang" && e.newValue && translations[e.newValue as Language]) {
        setLangState(e.newValue as Language);
      }
    }

    window.addEventListener("careflow_lang_change", handleLangChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("careflow_lang_change", handleLangChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    lang,
    setLang: setGlobalLanguage,
    t: translations[lang] || translations.en,
  };
}
