"use client";

import { useEffect, useState } from "react";

export type Language = "en" | "ta" | "hi";

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
    goodHealthTag: "GOOD HEALTH, BRIGHTER TOMORROW",
    yourCare: "Your care,",
    organized: "organized.",
    welcomeUser: "Welcome back, {name}!",
    stayOnTopDesc: "Stay on top of your appointments, prescriptions, health records and payments — all in one secure place.",
    smallSteps: "Small Steps Healthier You ♡",
    healthDataSafeTitle: "Your health data is safe with us",
    healthDataSafeDesc: "We use industry-standard security to protect your personal information.",
    learnMore: "Learn more →",

    // Health Awareness & Special Days
    healthAwarenessSectionTitle: "Health Awareness & Special Days",
    worldHeartDayTitle: "World Heart Day",
    worldHeartDaySub: "A healthier heart leads to a brighter tomorrow.",
    worldHeartDayDesc: "Take care of your heart with regular checkups, a balanced diet, and an active lifestyle.",
    healthyHeartsBadge: "Healthy Hearts Happier Lives",

    worldDiabetesDayTitle: "World Diabetes Day",
    worldDiabetesDaySub: "Know your risk, protect your future.",
    worldDiabetesDayDesc: "Monitor your blood sugar levels regularly, maintain a healthy diet, and stay physically active.",
    beatDiabetesBadge: "Beat Diabetes Together",

    worldMentalHealthDayTitle: "World Mental Health Day",
    worldMentalHealthDaySub: "Mental health is a universal human right.",
    worldMentalHealthDayDesc: "Prioritize rest, connect with loved ones, practice mindfulness, and seek guidance when needed.",
    mindMattersBadge: "Mind Matters Every Day",

    worldHealthDayTitle: "World Health Day",
    worldHealthDaySub: "My health, my right.",
    worldHealthDayDesc: "Empower your life with preventative health checkups, proper hydration, and routine wellness tracking.",
    healthForAllBadge: "Health For All",

    // Quick Health Tips
    quickHealthTips: "Quick Health Tips",
    regularCheckups: "Regular Checkups",
    keepHeartHealthy: "Keep your heart healthy",
    balancedDiet: "Balanced Diet",
    chooseNutritious: "Choose nutritious foods",
    stayActive: "Stay Active",
    moveForHealth: "Move for a healthier you",
    bloodGlucoseTest: "Blood Glucose Test",
    regularScreening: "Regular screening",
    lowGlycemicMeals: "Low Glycemic Meals",
    nutritiousChoices: "Nutritious choices",
    dailyExercise: "Daily Exercise",
    movementMins: "30 mins of movement",
    mindfulnessPractice: "Mindfulness Practice",
    dailyMeditation: "Daily meditation",
    restfulSleep: "Restful Sleep",
    hoursNightly: "7-8 hours nightly",
    talkConnect: "Talk & Connect",
    supportNetwork: "Support network",
    annualScreening: "Annual Screening",
    comprehensiveCare: "Comprehensive care",
    hydrationFirst: "Hydration First",
    litersDaily: "2-3 Liters daily",
    wellnessTracking: "Wellness Tracking",
    monitorVitals: "Monitor vitals",

    // Care Journey Timeline
    careJourneyTitle: "Your Care Journey Timeline",
    stepProfileSetup: "Profile Setup",
    stepSlotSelection: "Slot Selection",
    stepDoctorConsultation: "Doctor Consultation",
    stepDigitalPrescription: "Digital Prescription",
    stepPaymentReceipt: "Payment & Receipt",
    statusCompleted: "Completed",
    statusConfirmed: "Confirmed",
    statusPending: "Pending",
    statusCancelled: "Cancelled",

    // Dashboard 3 Cards
    upcomingAppointments: "Upcoming Appointments",
    viewAll: "View all →",
    nextVisit: "Next Visit",
    noUpcomingVisits: "No upcoming visits scheduled",
    noUpcomingAppointmentsTitle: "No Scheduled Appointments",
    noUpcomingAppointmentsSub: "You currently have no scheduled doctor visits.",
    bookNewAppointmentBtn: "Book Appointment",
    noPrescriptionsYetShort: "No active prescriptions",
    noHealthRecordsYet: "No health records uploaded yet",
    addToCalendar: "+ Add to Calendar",
    activePrescriptionsHeading: "My Prescriptions",
    activePrescriptionsLabel: "Active prescriptions",
    lastUpdated: "Last updated",
    viewPrescriptionsBtn: "View Prescriptions →",
    healthRecordsHeading: "Health Records",
    digitalConsultationNotes: "Digital consultation notes",
    verifiedByHospital: "Verified by hospital staff",
    viewRecordsBtn: "View Records →",

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
    reason: "Reason:",

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

    // Admin Management
    adminSectionTitle: "ADMINISTRATION",
    doctorsManagement: "Doctors",
    staffManagement: "Staff",
    userManagement: "User Management",
    registerDoctor: "Register Doctor",
    registerStaff: "Register Staff",
    personalInformation: "Personal Information",
    professionalInformation: "Professional Information",
    employmentInformation: "Employment Information",
    accountInformation: "Account Information",
    staffType: "Staff Type",
    designation: "Designation",
    employeeId: "Employee ID",
    consultationFee: "Consultation Fee",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    activeStatus: "Active",
    deactivatedStatus: "Deactivated",
    actions: "Actions",
    resetPassword: "Reset Password",
    confirmDeactivatePrompt: "Are you sure you want to deactivate this account? Login and access will be disabled.",
    doctorsManagementSubtitle: "Register new medical doctors, view profiles, and control account status.",
    staffManagementSubtitle: "Register and manage nursing, administrative, and clinical operational staff.",
    userManagementSubtitle: "System-wide user identity accounts, RBAC role permissions, and password controls.",
    emergencyTitle: "Emergency Management",
    emergencySubtitle: "Monitor and manage emergency cases, triage, beds and patient flow.",
    openEmergencyCase: "Open Emergency Case",
    labTitle: "Laboratory Management",
    labSubtitle: "Manage laboratory orders, samples, results and reports.",
    newLabOrder: "New Lab Order",
    billingTitle: "Billing & Payments",
    billingSubtitle: "Manage invoices, charges, payments and receipts.",
    createInvoice: "Create Invoice",

    // Footer
    allRightsReserved: "© 2026 CareFlow AI. All rights reserved.",
    hipaaCompliant: "HIPAA Compliant",
    encryption: "256-bit Encryption",
    support247: "24/7 Support",
  },
  ta: {
    // Brand & Header
    brandTitle: "CareFlow AI",
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
    signInTitle: "உங்கள் கணக்கில் உள்நுழையவும்",
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
    goodHealthTag: "நல்ல ஆரோக்கியம், பிரகாசமான நாளை",
    yourCare: "உங்கள் பராமரிப்பு,",
    organized: "சீராக்கப்பட்டது.",
    welcomeUser: "மீண்டும் வருக, {name}!",
    stayOnTopDesc: "உங்கள் சந்திப்புகள், மருந்துச் சீட்டுகள், சுகாதாரப் பதிவுகள் மற்றும் கட்டணங்களை ஒரே பாதுகாப்பான இடத்தில் நிர்வகிக்கவும்.",
    smallSteps: "சிறிய படிகள் ஆரோக்கியமான நீங்கள் ♡",
    healthDataSafeTitle: "உங்கள் சுகாதாரத் தரவு எங்களுடன் பாதுகாப்பாக உள்ளது",
    healthDataSafeDesc: "உங்கள் தனிப்பட்ட தகவலைப் பாதுகாக்க தொழில்துறை தரநிலை பாதுகாப்பைப் பயன்படுத்துகிறோம்.",
    learnMore: "மேலும் அறிய →",

    // Health Awareness & Special Days
    healthAwarenessSectionTitle: "சுகாதார விழிப்புணர்வு & சிறப்பு நாட்கள்",
    worldHeartDayTitle: "உலக இதய தினம்",
    worldHeartDaySub: "ஆரோக்கியமான இதயம் பிரகாசமான நாளைக்கு வழிவகுக்கும்.",
    worldHeartDayDesc: "வழக்கமான சோதனைகள், சீரான உணவு மற்றும் சுறுசுறுப்பான வாழ்க்கை முறையுடன் உங்கள் இதயத்தைப் பராமரியுங்கள்.",
    healthyHeartsBadge: "ஆரோக்கியமான இதயம் மகிழ்ச்சியான வாழ்க்கை",

    worldDiabetesDayTitle: "உலக நீரிழிவு தினம்",
    worldDiabetesDaySub: "உங்கள் ஆபத்தை அறிந்து கொள்ளுங்கள், உங்கள் எதிர்காலத்தைப் பாதுகாக்கவும்.",
    worldDiabetesDayDesc: "உங்கள் இரத்த சர்க்கரை அளவைத் தவறாமல் கண்காணிக்கவும், ஆரோக்கியமான உணவைப் பராமரிக்கவும், சுறுசுறுப்பாக இருக்கவும்.",
    beatDiabetesBadge: "நீரிழிவை ஒன்றுபட்டு வெல்வோம்",

    worldMentalHealthDayTitle: "உலக மனநல தினம்",
    worldMentalHealthDaySub: "மனநலம் என்பது உலகளாவிய மனித உரிமை.",
    worldMentalHealthDayDesc: "ஓய்வுக்கு முன்னுரிமை கொடுங்கள், அன்பானவர்களுடன் இணையுங்கள், மன அமைதி பயிற்சி செய்யுங்கள்.",
    mindMattersBadge: "மனநலம் தினமும் முக்கியம்",

    worldHealthDayTitle: "உலக சுகாதார தினம்",
    worldHealthDaySub: "என் ஆரோக்கியம், என் உரிமை.",
    worldHealthDayDesc: "தடுப்பு சுகாதார சோதனைகள், சரியான நீரேற்றம் மற்றும் வழக்கமான ஆரோக்கிய கண்காணிப்புடன் உங்கள் வாழ்க்கையை மேம்படுத்துங்கள்.",
    healthForAllBadge: "அனைவருக்கும் ஆரோக்கியம்",

    // Quick Health Tips
    quickHealthTips: "விரைவான சுகாதார குறிப்புகள்",
    regularCheckups: "வழக்கமான பரிசோதனைகள்",
    keepHeartHealthy: "உங்கள் இதயத்தை ஆரோக்கியமாக வைத்திருங்கள்",
    balancedDiet: "சீரான உணவு",
    chooseNutritious: "சத்தான உணவுகளைத் தேர்ந்தெடுக்கவும்",
    stayActive: "சுறுசுறுப்பாக இருங்கள்",
    moveForHealth: "ஆரோக்கியமான வாழ்க்கைக்கு உடற்பயிற்சி செய்யுங்கள்",
    bloodGlucoseTest: "இரத்த குளுக்கோஸ் சோதனை",
    regularScreening: "வழக்கமான பரிசோதனை",
    lowGlycemicMeals: "குறைந்த சர்க்கரை உணவுகள்",
    nutritiousChoices: "சத்தான தேர்வுகள்",
    dailyExercise: "தினசரி உடற்பயிற்சி",
    movementMins: "30 நிமிட உடற்பயிற்சி",
    mindfulnessPractice: "மன அமைதி பயிற்சி",
    dailyMeditation: "தினசரி தியானம்",
    restfulSleep: "நிம்மதியான தூக்கம்",
    hoursNightly: "இரவில் 7-8 மணிநேரம்",
    talkConnect: "பேசி இணையுங்கள்",
    supportNetwork: "ஆதரவு பிணையம்",
    annualScreening: "ஆண்டுதோறும் பரிசோதனை",
    comprehensiveCare: "முழுமையான பராமரிப்பு",
    hydrationFirst: "சரியான நீரேற்றம்",
    litersDaily: "தினமும் 2-3 லிட்டர்",
    wellnessTracking: "ஆரோக்கிய கண்காணிப்பு",
    monitorVitals: "முக்கிய அளவீடுகளைக் கண்காணிக்கவும்",

    // Care Journey Timeline
    careJourneyTitle: "உங்கள் பராமரிப்பு பயணக் காலக்கோடு",
    stepProfileSetup: "சுயவிவர அமைவு",
    stepSlotSelection: "நேரத் தேர்வு",
    stepDoctorConsultation: "மருத்துவர் கலந்தாய்வு",
    stepDigitalPrescription: "டிஜிட்டல் மருந்துச்சீட்டு",
    stepPaymentReceipt: "கட்டணம் & ரசீது",
    statusCompleted: "நிறைவுற்றது",
    statusConfirmed: "உறுதிசெய்யப்பட்டது",
    statusPending: "நிலுவையில் உள்ளது",
    statusCancelled: "ரத்துசெய்யப்பட்டது",

    // Dashboard 3 Cards
    upcomingAppointments: "வரவிருக்கும் சந்திப்புகள்",
    viewAll: "அனைத்தையும் காண்க →",
    nextVisit: "அடுத்த வருகை",
    noUpcomingVisits: "வரவிருக்கும் சந்திப்புகள் எதுவும் திட்டமிடப்படவில்லை",
    noUpcomingAppointmentsTitle: "திட்டமிடப்பட்ட சந்திப்புகள் எதுவுமில்லை",
    noUpcomingAppointmentsSub: "தற்போது உங்களுக்கு திட்டமிடப்பட்ட மருத்துவர் சந்திப்புகள் எதுவுமில்லை.",
    bookNewAppointmentBtn: "சந்திப்பை முன்பதிவு செய்க",
    noPrescriptionsYetShort: "செயலில் உள்ள மருந்துச் சீட்டுகள் இல்லை",
    noHealthRecordsYet: "சுகாதாரப் பதிவுகள் எதுவும் இதுவரை பதிவேற்றப்படவில்லை",
    addToCalendar: "+ காலண்டரில் சேர்",
    activePrescriptionsHeading: "என் மருந்துச் சீட்டுகள்",
    activePrescriptionsLabel: "செயலில் உள்ள மருந்துச் சீட்டுகள்",
    lastUpdated: "கடைசியாக புதுப்பிக்கப்பட்டது",
    viewPrescriptionsBtn: "மருந்துச் சீட்டுகளைக் காண்க →",
    healthRecordsHeading: "சுகாதார பதிவுகள்",
    digitalConsultationNotes: "டிஜிட்டல் கலந்தாய்வு குறிப்புகள்",
    verifiedByHospital: "மருத்துவமனை ஊழியர்களால் சரிபார்க்கப்பட்டது",
    viewRecordsBtn: "பதிவுகளைக் காண்க →",

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
    reason: "காரணம்:",

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
    downloadDocument: "ஆவணத்தைப் பதிவிறக்கவும்",
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

    // Admin Management
    adminSectionTitle: "நிர்வாகம்",
    doctorsManagement: "மருத்துவர்கள்",
    staffManagement: "பணியாளர்கள்",
    userManagement: "பயனர் நிர்வாகம்",
    registerDoctor: "மருத்துவரை பதிவு செய்க",
    registerStaff: "பணியாளரை பதிவு செய்க",
    personalInformation: "தனிப்பட்ட தகவல்கள்",
    professionalInformation: "தொழில்முறை தகவல்கள்",
    employmentInformation: "வேலைவாய்ப்பு தகவல்கள்",
    accountInformation: "கணக்கு தகவல்கள்",
    staffType: "பணியாளர் வகை",
    designation: "பதவி",
    employeeId: "ஊழியர் ஐடி",
    consultationFee: "கலந்தாய்வு கட்டணம்",
    activate: "செயல்படுத்து",
    deactivate: "செயலிழக்கச் செய்",
    delete: "நீக்கு",
    activeStatus: "செயலில்",
    deactivatedStatus: "செயலிழக்கப்பட்டது",
    actions: "செயல்கள்",
    resetPassword: "கடவுச்சொல்லை மீட்டமை",
    confirmDeactivatePrompt: "இந்தக் கணக்கைச் செயலிழக்கச் செய்ய நிச்சயமாக விரும்புகிறீர்களா? உள்நுழைவு முடக்கப்படும்.",
    doctorsManagementSubtitle: "புதிய மருத்துவர்களைப் பதிவுசெய்து கணக்கு நிலைகளைக் கட்டுப்படுத்தவும்.",
    staffManagementSubtitle: "செவிலியர் மற்றும் மருத்துவ செயல்பாட்டு ஊழியர்களை நிர்வகிக்கவும்.",
    userManagementSubtitle: "கணினி அளவிலான பயனர் அடையாளக் கணக்குகள் மற்றும் கடவுச்சொல் கட்டுப்பாடுகள்.",
    emergencyTitle: "அவசர சிகிச்சை நிர்வாகம்",
    emergencySubtitle: "அவசர வழக்குகள், வகைப்பாடு, படுக்கைகள் மற்றும் நோயாளி ஓட்டத்தைக் கண்காணிக்கவும்.",
    openEmergencyCase: "அவசர வழக்கைத் திறக்கவும்",
    labTitle: "ஆய்வக நிர்வாகம்",
    labSubtitle: "ஆய்வக ஆர்டர்கள், மாதிரிகள், முடிவுகள் மற்றும் அறிக்கைகளை நிர்வகிக்கவும்.",
    newLabOrder: "புதிய ஆய்வக ஆர்டர்",
    billingTitle: "பில்லிங் மற்றும் கட்டணங்கள்",
    billingSubtitle: "இன்வாய்ஸ்கள், கட்டணங்கள் மற்றும் ரசீதுகளை நிர்வகிக்கவும்.",
    createInvoice: "இன்வாய்ஸ் உருவாக்கவும்",

    // Footer
    allRightsReserved: "© 2026 CareFlow AI. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    hipaaCompliant: "HIPAA இணக்கமானது",
    encryption: "256-பிட் குறியாக்கம்",
    support247: "24/7 ஆதரவு",
  },
  hi: {
    // Brand & Header
    brandTitle: "CareFlow AI",
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
    goodHealthTag: "अच्छा स्वास्थ्य, उज्ज्वल कल",
    yourCare: "आपकी देखभाल,",
    organized: "सुव्यवस्थित।",
    welcomeUser: "स्वागत है, {name}!",
    stayOnTopDesc: "अपने अपॉइंटमेंट, नुस्खे, स्वास्थ्य रिकॉर्ड और भुगतान को एक सुरक्षित स्थान पर प्रबंधित करें।",
    smallSteps: "छोटे कदम स्वस्थ आप ♡",
    healthDataSafeTitle: "आपका स्वास्थ्य डेटा हमारे पास सुरक्षित है",
    healthDataSafeDesc: "हम आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए उद्योग-मानक सुरक्षा का उपयोग करते हैं।",
    learnMore: "अधिक जानें →",

    // Health Awareness & Special Days
    healthAwarenessSectionTitle: "स्वास्थ्य जागरूकता और विशेष दिन",
    worldHeartDayTitle: "विश्व हृदय दिवस",
    worldHeartDaySub: "एक स्वस्थ दिल उज्जवल कल की ओर ले जाता है।",
    worldHeartDayDesc: "नियमित जांच, संतुलित आहार और सक्रिय जीवनशैली से अपने दिल का ख्याल रखें।",
    healthyHeartsBadge: "स्वस्थ दिल खुशहाल जीवन",

    worldDiabetesDayTitle: "विश्व मधुमेह दिवस",
    worldDiabetesDaySub: "अपने जोखिम को जानें, अपने भविष्य की रक्षा करें।",
    worldDiabetesDayDesc: "अपने रक्त शर्करा के स्तर की नियमित निगरानी करें, स्वस्थ आहार बनाए रखें और सक्रिय रहें।",
    beatDiabetesBadge: "मधुमेह को मिलकर हराएं",

    worldMentalHealthDayTitle: "विश्व मानसिक स्वास्थ्य दिवस",
    worldMentalHealthDaySub: "मानसिक स्वास्थ्य एक सार्वभौमिक मानव अधिकार है।",
    worldMentalHealthDayDesc: "आराम को प्राथमिकता दें, अपनों से जुड़ें, माइंडफुलनेस का अभ्यास करें।",
    mindMattersBadge: "मन हर दिन मायने रखता है",

    worldHealthDayTitle: "विश्व स्वास्थ्य दिवस",
    worldHealthDaySub: "मेरा स्वास्थ्य, मेरा अधिकार।",
    worldHealthDayDesc: "निवारक स्वास्थ्य जांच, उचित जलयोजन और नियमित कल्याण ट्रैकिंग के साथ अपने जीवन को सशक्त बनाएं।",
    healthForAllBadge: "सभी के लिए स्वास्थ्य",

    // Quick Health Tips
    quickHealthTips: "त्वरित स्वास्थ्य टिप्स",
    regularCheckups: "नियमित जांच",
    keepHeartHealthy: "अपने दिल को स्वस्थ रखें",
    balancedDiet: "संतुलित आहार",
    chooseNutritious: "पौष्टिक भोजन चुनें",
    stayActive: "सक्रिय रहें",
    moveForHealth: "स्वस्थ रहने के लिए व्यायाम करें",
    bloodGlucoseTest: "ब्लड ग्लूकोज टेस्ट",
    regularScreening: "नियमित जांच",
    lowGlycemicMeals: "कम ग्लाइसेमिक भोजन",
    nutritiousChoices: "पौष्टिक विकल्प",
    dailyExercise: "दैनिक व्यायाम",
    movementMins: "30 मिनट व्यायाम",
    mindfulnessPractice: "माइंडफुलनेस अभ्यास",
    dailyMeditation: "दैनिक ध्यान",
    restfulSleep: "आरामदायक नींद",
    hoursNightly: "रात में 7-8 घंटे",
    talkConnect: "बात करें और जुड़ें",
    supportNetwork: "सहायता नेटवर्क",
    annualScreening: "वार्षिक जांच",
    comprehensiveCare: "व्यापक देखभाल",
    hydrationFirst: "हाइड्रेशन सबसे पहले",
    litersDaily: "रोजाना 2-3 लीटर",
    wellnessTracking: "कल्याण ट्रैकिंग",
    monitorVitals: "महत्वपूर्ण संकेतों की निगरानी करें",

    // Care Journey Timeline
    careJourneyTitle: "आपकी देखभाल यात्रा की समयावधि",
    stepProfileSetup: "प्रोफ़ाइल सेटअप",
    stepSlotSelection: "स्लॉट चयन",
    stepDoctorConsultation: "डॉक्टर परामर्श",
    stepDigitalPrescription: "डिजिटल नुस्खा",
    stepPaymentReceipt: "भुगतान और रसीद",
    statusCompleted: "पूरा हुआ",
    statusConfirmed: "पुष्टि की गई",
    statusPending: "लंबित",
    statusCancelled: "रद्द किया गया",

    // Dashboard 3 Cards
    upcomingAppointments: "आगामी अपॉइंटमेंट",
    viewAll: "सभी देखें →",
    nextVisit: "अगली यात्रा",
    noUpcomingVisits: "कोई आगामी विज़िट निर्धारित नहीं है",
    noUpcomingAppointmentsTitle: "कोई निर्धारित अपॉइंटमेंट नहीं",
    noUpcomingAppointmentsSub: "वर्तमान में आपकी कोई डॉक्टर विज़िट निर्धारित नहीं है।",
    bookNewAppointmentBtn: "अपॉइंटमेंट बुक करें",
    noPrescriptionsYetShort: "कोई सक्रिय नुस्खा नहीं",
    noHealthRecordsYet: "अभी तक कोई स्वास्थ्य रिकॉर्ड अपलोड नहीं किया गया है",
    addToCalendar: "+ कैलेंडर में जोड़ें",
    activePrescriptionsHeading: "मेरे नुस्खे",
    activePrescriptionsLabel: "सक्रिय नुस्खे",
    lastUpdated: "अंतिम बार अद्यतन",
    viewPrescriptionsBtn: "नुस्खे देखें →",
    healthRecordsHeading: "स्वास्थ्य रिकॉर्ड",
    digitalConsultationNotes: "डिजिटल परामर्श नोट्स",
    verifiedByHospital: "अस्पताल कर्मचारियों द्वारा सत्यापित",
    viewRecordsBtn: "रिकॉर्ड देखें →",

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
    reason: "कारण:",

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
    downloadDocument: "दस्तावेज़ डाउनलोड करें",
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

    // Admin Management
    adminSectionTitle: "प्रशासन",
    doctorsManagement: "डॉक्टर",
    staffManagement: "कर्मचारी",
    userManagement: "उपयोगकर्ता प्रबंधन",
    registerDoctor: "डॉक्टर पंजीकृत करें",
    registerStaff: "कर्मचारी पंजीकृत करें",
    personalInformation: "व्यक्तिगत जानकारी",
    professionalInformation: "पेशेवर जानकारी",
    employmentInformation: "रोजगार की जानकारी",
    accountInformation: "खाता जानकारी",
    staffType: "कर्मचारी का प्रकार",
    designation: "पद",
    employeeId: "कर्मचारी आईडी",
    consultationFee: "परामर्श शुल्क",
    activate: "सक्रिय करें",
    deactivate: "निष्क्रिय करें",
    delete: "हटाएं",
    activeStatus: "सक्रिय",
    deactivatedStatus: "निष्क्रिय",
    actions: "कार्रवाइयां",
    resetPassword: "पासवर्ड रीसेट करें",
    confirmDeactivatePrompt: "क्या आप वाकई इस खाते को निष्क्रिय करना चाहते हैं? लॉगिन और पहुंच अक्षम कर दी जाएगी।",

    // Footer
    allRightsReserved: "© 2026 CareFlow AI। सर्वाधिकार सुरक्षित।",
    hipaaCompliant: "HIPAA अनुपालित",
    encryption: "256-बिट एन्क्रिप्शन",
    support247: "24/7 सहायता",
    doctorsManagementSubtitle: "नए डॉक्टरों को पंजीकृत करें और खातों को नियंत्रित करें।",
    staffManagementSubtitle: "नर्सिंग और नैदानिक कर्मचारियों का प्रबंधन करें।",
    userManagementSubtitle: "सिस्टम-व्यापी उपयोगकर्ता खातों और पासवर्ड का प्रबंधन करें।",
    emergencyTitle: "आपातकालीन प्रबंधन",
    emergencySubtitle: "आपातकालीन मामलों, ट्राइएज, बेड और मरीज के प्रवाह की निगरानी करें।",
    openEmergencyCase: "आपातकालीन मामला खोलें",
    labTitle: "प्रयोगशाला प्रबंधन",
    labSubtitle: "प्रयोगशाला के आदेश, नमूने, परिणाम और रिपोर्ट का प्रबंधन करें।",
    newLabOrder: "नया लैब ऑर्डर",
    billingTitle: "बिलिंग और भुगतान",
    billingSubtitle: "चालान, शुल्क, भुगतान और रसीदों का प्रबंधन करें।",
    createInvoice: "चालान बनाएं",
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

const NAME_TRANSLITERATIONS: Record<string, Record<Language, string>> = {
  mary: { en: "Mary", ta: "மேரி", hi: "मैरी" },
  "mary smith": { en: "Mary Smith", ta: "மேரி ஸ்மித்", hi: "मैरी स्मिथ" },
  john: { en: "John", ta: "ஜான்", hi: "जॉन" },
  "dr. anitha kumar": { en: "Dr. Anitha Kumar", ta: "டாக்டர் அனிதா குமார்", hi: "डॉक्टर अनिता कुमार" },
  "anitha kumar": { en: "Anitha Kumar", ta: "அனிதா குமார்", hi: "अनिता कुमार" },
  "dr. rajesh sharma": { en: "Dr. Rajesh Sharma", ta: "டாக்டர் ராஜேஷ் சர்மா", hi: "डॉक्टर राजेश शर्मा" },
  "rajesh sharma": { en: "Rajesh Sharma", ta: "ராஜேஷ் சர்மா", hi: "राजेश शर्मा" },
  "dr. priya patel": { en: "Dr. Priya Patel", ta: "டாக்டர் ப்ரியா படேல்", hi: "डॉक्टर प्रिया पटेल" },
  "priya patel": { en: "Priya Patel", ta: "ப்ரியா படேல்", hi: "प्रिया पटेल" },
  "dr. smith": { en: "Dr. Smith", ta: "டாக்டர் ஸ்மித்", hi: "डॉक्टर स्मिथ" },
  smith: { en: "Smith", ta: "ஸ்மித்", hi: "स्मिथ" },
  "patient account": { en: "Patient Account", ta: "நோயாளி கணக்கு", hi: "रोगी खाता" },
  "staff member": { en: "Staff Member", ta: "பணியாளர்", hi: "कर्मचारी" },
  "doctor user": { en: "Doctor User", ta: "மருத்துவர் பயனர்", hi: "डॉक्टर उपयोगकर्ता" },
  "operations control": { en: "Operations Control", ta: "செயல்பாட்டுக் கட்டுப்பாடு", hi: "संचालन नियंत्रण" },
  administrator: { en: "Administrator", ta: "நிர்வாகி", hi: "प्रशासक" },
  admin: { en: "Admin", ta: "நிர்வாகி", hi: "प्रशासक" },
};

export function getLocalizedDisplayName(name: string | undefined | null, lang: Language): string {
  if (!name || typeof name !== "string") return "";
  const cleanName = name.trim();
  if (!cleanName) return "";
  const key = cleanName.toLowerCase();

  if (NAME_TRANSLITERATIONS[key]?.[lang]) {
    return NAME_TRANSLITERATIONS[key][lang];
  }

  if (key.startsWith("dr.") || key.startsWith("dr ")) {
    const rawName = cleanName.replace(/^dr\.\s*/i, "").replace(/^dr\s*/i, "").trim();
    const subKey = rawName.toLowerCase();
    const translatedSubName = NAME_TRANSLITERATIONS[subKey]?.[lang] || getLocalizedDisplayName(rawName, lang);
    if (lang === "ta") return `டாக்டர் ${translatedSubName}`;
    if (lang === "hi") return `डॉक्टर ${translatedSubName}`;
    return `Dr. ${translatedSubName}`;
  }

  const words = cleanName.split(/\s+/);
  const translatedWords = words.map((w) => {
    const wKey = w.toLowerCase();
    return NAME_TRANSLITERATIONS[wKey]?.[lang] || w;
  });

  return translatedWords.join(" ");
}
