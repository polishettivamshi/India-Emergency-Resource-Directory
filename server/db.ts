import fs from "fs";
import path from "path";
import { 
  EmergencyCategory, 
  EmergencyContact, 
  ContactSubmission, 
  ContactReport, 
  AuditLog, 
  User, 
  AnalyticsSummary,
  VerificationStatus
} from "../src/types";

const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  users: User[];
  contacts: EmergencyContact[];
  submissions: ContactSubmission[];
  reports: ContactReport[];
  auditLogs: AuditLog[];
  bookmarks: { [userId: string]: string[] }; // userId -> contactIds[]
  searchedCategories: { [category: string]: number };
  searchKeywords: { [keyword: string]: number };
}

// Default Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: "user-admin",
    email: "admin@emergency.in",
    name: "System Admin (India Emergency Desk)",
    role: "Admin",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-registered",
    email: "user@emergency.in",
    name: "Aarav Sharma (Verified Contributor)",
    role: "Registered",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: "contact-112",
    serviceName: "National Emergency Response System (NERS)",
    category: EmergencyCategory.POLICE,
    phoneNumber: "112",
    state: "National Coverage",
    district: "All Districts",
    organization: "Ministry of Home Affairs, Government Of India",
    description: "Universal helpline for instant action spanning Police, Fire, and Health emergencies.",
    sourceUrl: "https://112.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-01",
    verificationEvidence: "Verified against the official Ministry of Home Affairs emergency portal.",
    viewCount: 145,
    reportCount: 0
  },
  {
    id: "contact-100",
    serviceName: "Police Main Emergency Line",
    category: EmergencyCategory.POLICE,
    phoneNumber: "100",
    state: "National Coverage",
    district: "All Districts",
    organization: "State Police Departments",
    description: "Standard primary emergency response line for reporting crimes and urgent law enforcement assistance.",
    sourceUrl: "https://mha.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-20",
    verificationEvidence: "Universal government telecom emergency numbers registry.",
    viewCount: 92,
    reportCount: 0
  },
  {
    id: "contact-101",
    serviceName: "National Fire Services Helpline",
    category: EmergencyCategory.FIRE,
    phoneNumber: "101",
    state: "National Coverage",
    district: "All Districts",
    organization: "Directorate General of Fire Services",
    description: "Emergency fire response and disaster rescue operations nationwide.",
    sourceUrl: "https://dgfsndrf-mha.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-15",
    verificationEvidence: "Official guidelines of Fire Service Departments.",
    viewCount: 74,
    reportCount: 0
  },
  {
    id: "contact-102",
    serviceName: "Emergency Medical & Ambulance Service",
    category: EmergencyCategory.AMBULANCE,
    phoneNumber: "102",
    state: "National Coverage",
    district: "All Districts",
    organization: "Ministry of Health & Family Welfare",
    description: "Dedicated national helpline for government emergency ambulance transport.",
    sourceUrl: "https://main.mohfw.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-18",
    verificationEvidence: "Health Ministry universal helplines publication.",
    viewCount: 120,
    reportCount: 0
  },
  {
    id: "contact-108",
    serviceName: "108 GVK EMRI State Ambulance Network",
    category: EmergencyCategory.AMBULANCE,
    phoneNumber: "108",
    state: "National Coverage",
    district: "All Districts",
    organization: "GVK Emergency Management and Research Institute",
    description: "Free medical emergency, accident rescue, and disaster responder operational across 15+ Indian states.",
    sourceUrl: "https://www.emri.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-01",
    verificationEvidence: "Official GVK Emergency Response partner portal.",
    viewCount: 205,
    reportCount: 0
  },
  {
    id: "contact-1091",
    serviceName: "National Women Helpline",
    category: EmergencyCategory.WOMEN_HELPLINE,
    phoneNumber: "1091",
    state: "National Coverage",
    district: "All Districts",
    organization: "National Commission for Women (NCW)",
    description: "24/7 Helpline dedicated to assisting women facing severe harassment, abuse, or safety threats.",
    sourceUrl: "https://ncw.nic.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-03",
    verificationEvidence: "Information published on the official NCW Government of India homepage.",
    viewCount: 132,
    reportCount: 0
  },
  {
    id: "contact-1098",
    serviceName: "Childline India Foundation Advisory",
    category: EmergencyCategory.CHILD_HELPLINE,
    phoneNumber: "1098",
    state: "National Coverage",
    district: "All Districts",
    organization: "Ministry of Women and Child Development",
    description: "India's first 24-hour, free emergency phone outreach service for children in need of aid and assistance.",
    sourceUrl: "https://www.childlineindia.org/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-28",
    verificationEvidence: "Ministry of Women & Child Development official child security publications.",
    viewCount: 88,
    reportCount: 0
  },
  {
    id: "contact-1078",
    serviceName: "National Disaster Response Force (NDRF)",
    category: EmergencyCategory.DISASTER_MANAGEMENT,
    phoneNumber: "1078",
    state: "National Coverage",
    district: "All Districts",
    organization: "National Disaster Management Authority (NDMA)",
    description: "Helpline for immediate response to floods, earthquakes, landslides, and major civic accidents.",
    sourceUrl: "https://ndma.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-02",
    verificationEvidence: "NDMA emergency directory portal.",
    viewCount: 61,
    reportCount: 0
  },
  {
    id: "contact-kiran",
    serviceName: "KIRAN National Mental Health Support",
    category: EmergencyCategory.MENTAL_HEALTH,
    phoneNumber: "1800-599-0019",
    state: "National Coverage",
    district: "All Districts",
    organization: "Ministry of Social Justice and Empowerment",
    description: "An free, anonymous, professional helpline offering psychological support, stress reduction, and counseling.",
    sourceUrl: "http://socialjustice.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-04",
    verificationEvidence: "Press Information Bureau Gov of India circular.",
    viewCount: 154,
    reportCount: 0
  },
  {
    id: "contact-highway",
    serviceName: "National Highways Emergency Helpline",
    category: EmergencyCategory.ROADSIDE_ASSISTANCE,
    phoneNumber: "1033",
    state: "National Coverage",
    district: "All Districts",
    organization: "National Highways Authority of India (NHAI)",
    description: "Reports road accidents, initiates highway ambulance rescue, and arranges towing services.",
    sourceUrl: "https://nhai.gov.in/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-22",
    verificationEvidence: "NHAI official 24x7 helpline portal.",
    viewCount: 47,
    reportCount: 0
  },
  {
    id: "contact-friendicoes",
    serviceName: "Friendicoes Animal Rescue & Clinic",
    category: EmergencyCategory.ANIMAL_RESCUE,
    phoneNumber: "9821077881",
    state: "Delhi NCR",
    district: "New Delhi",
    organization: "Friendicoes SECA NGO",
    description: "Emergency rescue ambulances for injured stray dogs, cats, cows, and medical avian shelter support.",
    sourceUrl: "https://friendicoes.org/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-06-04",
    verificationEvidence: "Verified via Friendicoes SECA NGO official contact page.",
    viewCount: 56,
    reportCount: 0
  },
  {
    id: "contact-blood-1",
    serviceName: "Indian Red Cross Society Blood Centre",
    category: EmergencyCategory.BLOOD_BANK,
    phoneNumber: "011-23359379",
    state: "Delhi NCR",
    district: "New Delhi",
    organization: "Indian Red Cross Society",
    description: "24-hour centralized blood bank services and donor coordination for rare and emergency grouping requests.",
    sourceUrl: "https://indianredcross.org/",
    verificationStatus: "Verified",
    lastVerifiedDate: "2026-05-30",
    verificationEvidence: "Red Cross Red Crescent headquarters directory citation.",
    viewCount: 84,
    reportCount: 0
  }
];

// Read database from file
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb({
        users: DEFAULT_USERS,
        contacts: DEFAULT_CONTACTS,
        submissions: [],
        reports: [],
        auditLogs: [
          {
            id: "log-init",
            userId: "system",
            userEmail: "system@emergency.in",
            action: "Database Initialized",
            details: "Pre-populated standard national and state level emergency directories.",
            timestamp: new Date().toISOString()
          }
        ],
        bookmarks: {},
        searchedCategories: {
          [EmergencyCategory.POLICE]: 24,
          [EmergencyCategory.AMBULANCE]: 38,
          [EmergencyCategory.WOMEN_HELPLINE]: 15,
          [EmergencyCategory.MENTAL_HEALTH]: 41
        },
        searchKeywords: {
          "112 helpline": 12,
          "covid response": 3,
          "highway crash support": 8,
          "blood donor standard": 5
        }
      });
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read database file, returning default structure", error);
    return {
      users: DEFAULT_USERS,
      contacts: DEFAULT_CONTACTS,
      submissions: [],
      reports: [],
      auditLogs: [],
      bookmarks: {},
      searchedCategories: {},
      searchKeywords: {}
    };
  }
}

// Write database to file
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database file", error);
  }
}

// Helper: Add audit log
export function addAuditLog(userId: string, userEmail: string, action: string, details: string) {
  const db = readDb();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userEmail,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200); // Caps logs size
  }
  writeDb(db);
}

// Fetch analysis summaries
export function getAnalyticsSummary(): AnalyticsSummary {
  const db = readDb();
  
  // Dynamic categories distribution
  const categoryMap: { [key: string]: number } = {};
  Object.values(EmergencyCategory).forEach(cat => {
    categoryMap[cat] = 0;
  });
  db.contacts.forEach(c => {
    if (c.verificationStatus === "Verified") {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    }
  });
  
  const categoryDistribution = Object.keys(categoryMap).map(key => ({
    category: key,
    count: categoryMap[key]
  }));

  // Track most searched categories
  const sortedSearchedCategories = Object.keys(db.searchedCategories).map(key => ({
    category: key,
    count: db.searchedCategories[key]
  })).sort((a, b) => b.count - a.count);

  // Track popular search keywords
  const sortedKeywords = Object.keys(db.searchKeywords).map(key => ({
    keyword: key,
    count: db.searchKeywords[key]
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  // Most viewed contacts
  const mostViewedContacts = [...db.contacts]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  // Most reported contacts
  const mostReportedContacts = [...db.contacts]
    .filter(c => c.reportCount > 0)
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  const pendingCount = db.submissions.filter(s => s.status === "Pending").length;
  const reportsCount = db.reports.filter(r => r.status === "Pending").length;

  return {
    totalContacts: db.contacts.length,
    verifiedContacts: db.contacts.filter(c => c.verificationStatus === "Verified").length,
    pendingReviews: pendingCount,
    rejectedContacts: db.contacts.filter(c => c.verificationStatus === "Rejected").length,
    reportsSubmitted: db.reports.length,
    categoryDistribution,
    searchTrends: sortedKeywords,
    mostSearchedCategories: sortedSearchedCategories,
    mostViewedContacts,
    mostReportedContacts
  };
}
