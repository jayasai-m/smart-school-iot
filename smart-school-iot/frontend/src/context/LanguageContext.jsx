import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    // Nav items
    dashboard: 'Dashboard',
    digitalTwin: 'Digital Twin',
    waterQuality: 'Water Quality & Tank',
    mealKitchen: 'Meal & Kitchen Hygiene',
    multiSchool: 'Multi-School Hub',
    inspectors: 'Inspectors & Progress',
    schoolApprovals: 'School Approvals',
    alerts: 'Incident & Alerts',
    reports: 'Reports',
    profile: 'Profile',
    schools: 'Schools',
    mySchools: 'My Schools',
    water: 'Water',
    meals: 'Meals',

    // Header
    systemOnline: 'System Online',
    deptLabel: 'Department of School Education',
    systemSubtitle: 'Mid-Day Meal & Water Quality Monitoring System',
    fieldTelemetry: 'Field Telemetry & Mid-Day Meal Node',
    registeredInstitution: 'Registered Institution',
    nodeActive: 'Node Active',
    centralAdminPortal: 'Central Admin Portal',
    schoolFieldNode: 'School Field Node',
    inspectorPortal: 'Inspector Portal',
    systemOverview: 'System Overview Dashboard',
    systemOverviewSubtitle: 'Real-time telemetry and mid-day meal verification status across monitored institutions',
    refreshData: 'Refresh Data',
    totalApprovedSchools: 'Total Approved Schools',
    hardwareConnections: 'Hardware Connections',
    pendingApprovals: 'Pending Approvals',

    // Login
    portalTitle: 'SmartSchoolIoT Portal',
    portalSubtitle: 'Government School Water & Mid-Day Meal Monitoring System',
    emailLabel: 'Authorized Email Address',
    passwordLabel: 'Password',
    signIn: 'Sign In to Dashboard',
    needToRegister: 'Need to register your government school?',
    submitRegistration: 'Submit Registration',
    signingIn: 'Signing in…',

    // Dashboard cards
    waterLevel: 'Water Level',
    turbidity: 'Turbidity',
    humidity: 'Humidity',
    hardwareStatus: 'Hardware Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    activeAlerts: 'Active Alerts',
    todayMeal: "Today's Meal",
    mealSubmitted: 'Submitted',
    noMealToday: 'Not Submitted',
    lastUpdated: 'Last Updated',
    noData: 'No Data',
    sensorOffline: 'Sensor Offline',
    uploadPhoto: '+ Staff Upload',
    refresh: 'Refresh',
    logout: 'Logout',
    systemAdministrator: 'System Administrator',
    schoolOperator: 'School Operator',
    inspectorRole: 'Inspector',

    // Alerts
    noAlerts: 'No active alerts',
    alertCritical: 'Critical',
    alertWarning: 'Warning',
    alertInfo: 'Info',
    resolved: 'Resolved',
    pending: 'Pending',

    // Status
    approved: 'Approved',
    pendingApproval: 'Pending Approval',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',

    // General
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    close: 'Close',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    district: 'District',
    state: 'State',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    actions: 'Actions',
    notes: 'Notes',
    noRecords: 'No records found',
  },

  te: {
    // Nav items
    dashboard: 'డాష్‌బోర్డ్',
    digitalTwin: 'డిజిటల్ ట్విన్',
    waterQuality: 'నీటి నాణ్యత & ట్యాంకు',
    mealKitchen: 'భోజనం & వంటగది పరిశుభ్రత',
    multiSchool: 'బహు-పాఠశాల కేంద్రం',
    inspectors: 'పరిశీలకులు & పురోగతి',
    schoolApprovals: 'పాఠశాల అనుమతులు',
    alerts: 'సంఘటన & హెచ్చరికలు',
    reports: 'నివేదికలు',
    profile: 'ప్రొఫైల్',
    schools: 'పాఠశాలలు',
    mySchools: 'నా పాఠశాలలు',
    water: 'నీరు',
    meals: 'భోజనం',

    // Header
    systemOnline: 'సిస్టమ్ ఆన్‌లైన్',
    deptLabel: 'పాఠశాల విద్య విభాగం',
    systemSubtitle: 'మధ్యాహ్న భోజనం & నీటి నాణ్యత పర్యవేక్షణ వ్యవస్థ',
    fieldTelemetry: 'క్షేత్ర టెలిమెట్రీ & మధ్యాహ్న భోజనం నోడ్',
    registeredInstitution: 'నమోదిత సంస్థ',
    nodeActive: 'నోడ్ క్రియాశీలంగా ఉంది',
    centralAdminPortal: 'కేంద్ర నిర్వాహక పోర్టల్',
    schoolFieldNode: 'పాఠశాల క్షేత్ర నోడ్',
    inspectorPortal: 'పరిశీలకుడి పోర్టల్',
    systemOverview: 'సిస్టమ్ అవలోకనం డాష్‌బోర్డ్',
    systemOverviewSubtitle: 'పర్యవేక్షించబడుతున్న సంస్థలలో నిజ సమయ టెలిమెట్రీ మరియు మధ్యాహ్న భోజన ధృవీకరణ స్థితి',
    refreshData: 'డేటా రిఫ్రెష్',
    totalApprovedSchools: 'మొత్తం ఆమోదించబడిన పాఠశాలలు',
    hardwareConnections: 'హార్డ్‌వేర్ అనుసంధానాలు',
    pendingApprovals: 'పెండింగ్ ఆమోదాలు',

    // Login
    portalTitle: 'స్మార్ట్‌స్కూల్‌IoT పోర్టల్',
    portalSubtitle: 'ప్రభుత్వ పాఠశాల నీరు & మధ్యాహ్న భోజనం పర్యవేక్షణ వ్యవస్థ',
    emailLabel: 'అధికృత ఈమెయిల్ చిరునామా',
    passwordLabel: 'పాస్‌వర్డ్',
    signIn: 'డాష్‌బోర్డ్‌లోకి సైన్ ఇన్ చేయండి',
    needToRegister: 'మీ ప్రభుత్వ పాఠశాలను నమోదు చేయాలా?',
    submitRegistration: 'నమోదు సమర్పించండి',
    signingIn: 'సైన్ ఇన్ అవుతోంది…',

    // Dashboard cards
    waterLevel: 'నీటి మట్టం',
    turbidity: 'నీటి మేఘావరణ',
    humidity: 'తేమ',
    hardwareStatus: 'హార్డ్‌వేర్ స్థితి',
    connected: 'అనుసంధానించబడింది',
    disconnected: 'అనుసంధానం తెగిపోయింది',
    activeAlerts: 'క్రియాశీల హెచ్చరికలు',
    todayMeal: 'ఈరోజు భోజనం',
    mealSubmitted: 'సమర్పించబడింది',
    noMealToday: 'సమర్పించబడలేదు',
    lastUpdated: 'చివరిగా నవీకరించబడింది',
    noData: 'డేటా లేదు',
    sensorOffline: 'సెన్సార్ ఆఫ్‌లైన్',
    uploadPhoto: '+ సిబ్బంది అప్‌లోడ్',
    refresh: 'రిఫ్రెష్',
    logout: 'లాగ్అవుట్',
    systemAdministrator: 'సిస్టమ్ నిర్వాహకుడు',
    schoolOperator: 'పాఠశాల ఆపరేటర్',
    inspectorRole: 'పరిశీలకుడు',

    // Alerts
    noAlerts: 'క్రియాశీల హెచ్చరికలు లేవు',
    alertCritical: 'క్రిటికల్',
    alertWarning: 'హెచ్చరిక',
    alertInfo: 'సమాచారం',
    resolved: 'పరిష్కరించబడింది',
    pending: 'పెండింగ్‌లో ఉంది',

    // Status
    approved: 'ఆమోదించబడింది',
    pendingApproval: 'ఆమోదం పెండింగ్‌లో',
    rejected: 'తిరస్కరించబడింది',
    active: 'క్రియాశీలం',
    inactive: 'నిష్క్రియాత్మకం',

    // General
    loading: 'లోడ్ అవుతోంది…',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    submit: 'సమర్పించండి',
    close: 'మూసివేయండి',
    view: 'చూడండి',
    edit: 'సవరించండి',
    delete: 'తొలగించండి',
    confirm: 'నిర్ధారించండి',
    search: 'వెతకండి',
    filter: 'వడపోత',
    all: 'అన్నీ',
    yes: 'అవును',
    no: 'కాదు',
    name: 'పేరు',
    email: 'ఈమెయిల్',
    phone: 'ఫోన్',
    address: 'చిరునామా',
    district: 'జిల్లా',
    state: 'రాష్ట్రం',
    date: 'తేదీ',
    time: 'సమయం',
    status: 'స్థితి',
    actions: 'చర్యలు',
    notes: 'గమనికలు',
    noRecords: 'రికార్డులు కనుగొనబడలేదు',
  },

  ta: {
    // Nav items
    dashboard: 'டாஷ்போர்டு',
    digitalTwin: 'டிஜிட்டல் இரட்டை',
    waterQuality: 'நீர் தரம் & தொட்டி',
    mealKitchen: 'உணவு & சமையலறை சுகாதாரம்',
    multiSchool: 'பல-பள்ளி மையம்',
    inspectors: 'ஆய்வாளர்கள் & முன்னேற்றம்',
    schoolApprovals: 'பள்ளி அனுமதிகள்',
    alerts: 'சம்பவம் & எச்சரிக்கைகள்',
    reports: 'அறிக்கைகள்',
    profile: 'சுயவிவரம்',
    schools: 'பள்ளிகள்',
    mySchools: 'என் பள்ளிகள்',
    water: 'நீர்',
    meals: 'உணவு',

    // Header
    systemOnline: 'கணினி ஆன்லைன்',
    deptLabel: 'பள்ளிக் கல்வித் துறை',
    systemSubtitle: 'மதிய உணவு & நீர் தர கண்காணிப்பு அமைப்பு',
    fieldTelemetry: 'களத் தொலைமானி & மதிய உணவு முனை',
    registeredInstitution: 'பதிவு செய்யப்பட்ட நிறுவனம்',
    nodeActive: 'முனை செயல்பாட்டில் உள்ளது',
    centralAdminPortal: 'மத்திய நிர்வாக போர்டல்',
    schoolFieldNode: 'பள்ளி களம் முனை',
    inspectorPortal: 'ஆய்வாளர் போர்டல்',
    systemOverview: 'கணினி கண்ணோட்டம் டாஷ்போர்டு',
    systemOverviewSubtitle: 'கண்காணிக்கப்படும் நிறுவனங்களில் நிகழ்நேர தொலை அளவீடு மற்றும் மதிய உணவு சரிபார்ப்பு நிலை',
    refreshData: 'தரவை புதுப்பி',
    totalApprovedSchools: 'மொத்த அங்கீகரிக்கப்பட்ட பள்ளிகள்',
    hardwareConnections: 'வன்பொருள் இணைப்புகள்',
    pendingApprovals: 'நிலுவையில் உள்ள ஒப்புதல்கள்',

    // Login
    portalTitle: 'SmartSchoolIoT போர்டல்',
    portalSubtitle: 'அரசு பள்ளி நீர் & மதிய உணவு கண்காணிப்பு அமைப்பு',
    emailLabel: 'அங்கீகரிக்கப்பட்ட மின்னஞ்சல் முகவரி',
    passwordLabel: 'கடவுச்சொல்',
    signIn: 'டாஷ்போர்டிற்கு உள்நுழைக',
    needToRegister: 'உங்கள் அரசு பள்ளியை பதிவு செய்ய வேண்டுமா?',
    submitRegistration: 'பதிவை சமர்ப்பிக்கவும்',
    signingIn: 'உள்நுழைகிறது…',

    // Dashboard cards
    waterLevel: 'நீர் மட்டம்',
    turbidity: 'நீர் கலக்கம்',
    humidity: 'ஈரப்பதம்',
    hardwareStatus: 'வன்பொருள் நிலை',
    connected: 'இணைக்கப்பட்டது',
    disconnected: 'இணைப்பு துண்டிக்கப்பட்டது',
    activeAlerts: 'செயலில் உள்ள எச்சரிக்கைகள்',
    todayMeal: 'இன்றைய உணவு',
    mealSubmitted: 'சமர்ப்பிக்கப்பட்டது',
    noMealToday: 'சமர்ப்பிக்கப்படவில்லை',
    lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
    noData: 'தரவு இல்லை',
    sensorOffline: 'சென்சார் ஆஃப்லைன்',
    uploadPhoto: '+ பணியாளர் பதிவேற்றம்',
    refresh: 'புதுப்பி',
    logout: 'வெளியேறு',
    systemAdministrator: 'கணினி நிர்வாகி',
    schoolOperator: 'பள்ளி இயக்குநர்',
    inspectorRole: 'ஆய்வாளர்',

    // Alerts
    noAlerts: 'செயலில் உள்ள எச்சரிக்கைகள் இல்லை',
    alertCritical: 'முக்கியமானது',
    alertWarning: 'எச்சரிக்கை',
    alertInfo: 'தகவல்',
    resolved: 'தீர்க்கப்பட்டது',
    pending: 'நிலுவையில் உள்ளது',

    // Status
    approved: 'அங்கீகரிக்கப்பட்டது',
    pendingApproval: 'அனுமதி நிலுவையில்',
    rejected: 'நிராகரிக்கப்பட்டது',
    active: 'செயல்பாட்டில்',
    inactive: 'செயலற்றது',

    // General
    loading: 'ஏற்றுகிறது…',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    submit: 'சமர்ப்பி',
    close: 'மூடு',
    view: 'பார்',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    confirm: 'உறுதிப்படுத்து',
    search: 'தேடு',
    filter: 'வடிகட்டு',
    all: 'அனைத்தும்',
    yes: 'ஆம்',
    no: 'இல்லை',
    name: 'பெயர்',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
    address: 'முகவரி',
    district: 'மாவட்டம்',
    state: 'மாநிலம்',
    date: 'தேதி',
    time: 'நேரம்',
    status: 'நிலை',
    actions: 'செயல்கள்',
    notes: 'குறிப்புகள்',
    noRecords: 'பதிவுகள் எதுவும் இல்லை',
  },
};

export const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳', nativeLabel: 'தமிழ்' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const setLanguage = (code) => {
    setLang(code);
    localStorage.setItem('lang', code);
  };

  const t = (key) => translations[lang]?.[key] ?? translations['en']?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
