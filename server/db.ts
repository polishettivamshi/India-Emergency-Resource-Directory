import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
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

// Ensure env is loaded before the Supabase client is created.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// --- CLIENT SETUP ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase env check:", {
  url: Boolean(SUPABASE_URL),
  anonKey: Boolean(SUPABASE_ANON_KEY),
  serviceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  serviceRoleLength: SUPABASE_SERVICE_ROLE_KEY?.length ?? 0
});

export const isSupabaseActive = !!(SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY));

export const supabase = isSupabaseActive 
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY!) 
  : null;

if (isSupabaseActive) {
  const mode = SUPABASE_SERVICE_ROLE_KEY ? "Service Role" : "Anon public";
  console.log(`⚡ Supabase integration active: Connected to PostgreSQL cloud server using ${mode} key.`);
} else {
  console.log("📦 Standard local persistence active: Storing emergency telemetry in database.json.");
}

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

// Default Seed Data: users list removed (empty users will be used by default)

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

// Read database from file (Sync - maintained for legacy fallback)
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb({
        users: [],
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
      users: [],
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

// Write database to file (Sync - maintained for legacy fallback)
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database file", error);
  }
}

// --- SNAKE CASE <--> CAMEL CASE CONVERTERS FOR POSTGRESQL TABLES ---
function mapContactFromDb(row: any): EmergencyContact {
  return {
    id: row.id,
    serviceName: row.service_name,
    category: row.category as EmergencyCategory,
    phoneNumber: row.phone_number,
    state: row.state,
    district: row.district,
    organization: row.organization,
    description: row.description,
    sourceUrl: row.source_url || "",
    verificationStatus: row.verification_status as VerificationStatus,
    lastVerifiedDate: row.last_verified_date,
    verificationEvidence: row.verification_evidence || "",
    viewCount: row.view_count || 0,
    reportCount: row.report_count || 0,
    submittedBy: row.submitted_by || ""
  };
}

function mapContactToDb(contact: EmergencyContact) {
  return {
    id: contact.id,
    service_name: contact.serviceName,
    category: contact.category,
    phone_number: contact.phoneNumber,
    state: contact.state,
    district: contact.district,
    organization: contact.organization,
    description: contact.description,
    source_url: contact.sourceUrl,
    verification_status: contact.verificationStatus,
    last_verified_date: contact.lastVerifiedDate,
    verification_evidence: contact.verificationEvidence,
    view_count: contact.viewCount,
    report_count: contact.reportCount,
    submitted_by: contact.submittedBy
  };
}

function mapSubmissionFromDb(row: any): ContactSubmission {
  return {
    id: row.id,
    serviceName: row.service_name,
    category: row.category as EmergencyCategory,
    phoneNumber: row.phone_number,
    state: row.state,
    district: row.district,
    organization: row.organization,
    description: row.description,
    sourceUrl: row.source_url || "",
    verificationEvidence: row.verification_evidence,
    status: row.status as "Pending" | "Approved" | "Rejected",
    submittedBy: row.submitted_by,
    submitterEmail: row.submitter_email,
    submitterName: row.submitter_name,
    createdAt: row.created_at,
    adminNotes: row.admin_notes || ""
  };
}

function mapSubmissionToDb(sub: ContactSubmission) {
  return {
    id: sub.id,
    service_name: sub.serviceName,
    category: sub.category,
    phone_number: sub.phoneNumber,
    state: sub.state,
    district: sub.district,
    organization: sub.organization,
    description: sub.description,
    source_url: sub.sourceUrl,
    verification_evidence: sub.verificationEvidence,
    status: sub.status,
    submitted_by: sub.submittedBy,
    submitter_email: sub.submitterEmail,
    submitter_name: sub.submitterName,
    created_at: sub.createdAt,
    admin_notes: sub.adminNotes
  };
}

function mapReportFromDb(row: any): ContactReport {
  return {
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    contactNumber: row.contact_number,
    reason: row.reason,
    description: row.description,
    status: row.status as "Pending" | "Reviewed" | "Resolved",
    reportedBy: row.reported_by,
    reporterEmail: row.reporter_email,
    createdAt: row.created_at
  };
}

function mapReportToDb(rep: ContactReport) {
  return {
    id: rep.id,
    contact_id: rep.contactId,
    contact_name: rep.contactName,
    contact_number: rep.contactNumber,
    reason: rep.reason,
    description: rep.description,
    status: rep.status,
    reported_by: rep.reportedBy,
    reporter_email: rep.reporterEmail,
    created_at: rep.createdAt
  };
}

function mapLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp
  };
}

function mapLogToDb(log: AuditLog) {
  return {
    id: log.id,
    user_id: log.userId,
    user_email: log.userEmail,
    action: log.action,
    details: log.details,
    timestamp: log.timestamp
  };
}


// --- AUTO SEED SUPABASE ---
// Safely inserts national default dataset to Supabase when first connected
async function autoSeedSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from("contacts").select("id").limit(1);
    if (error) {
      console.warn("⚠️ Supabase: Table checks completed with codes. Make sure to run schema.sql first inside Supabase SQL editor to create the required tables.");
      return;
    }
    if (data && data.length === 0) {
      console.log("🌱 Supabase is blank. Seeding first-time National Emergency directory dataset...");
      const dDb = readDb();
      
      const contactsToInsert = (dDb.contacts.length > 0 ? dDb.contacts : DEFAULT_CONTACTS).map(mapContactToDb);
      const { error: insErr } = await supabase.from("contacts").insert(contactsToInsert);
      if (insErr) {
        console.error("❌ Seeding failure on Supabase:", insErr);
        if (insErr.code === "42501") {
          console.error("🔐 Supabase row-level security is blocking writes. Add SUPABASE_SERVICE_ROLE_KEY to .env or configure RLS policies for the anon role.");
        }
      } else {
        console.log("📬 Successfully populated initial national emergency numbers directly inside your Supabase Postgres tables.");
      }

      // See Categories
      const categoriesSeed = Object.keys(dDb.searchedCategories).map(cat => ({
        category: cat,
        count: dDb.searchedCategories[cat]
      }));
      await supabase.from("searched_categories").insert(categoriesSeed);

      // See Keywords
      const keywordsSeed = Object.keys(dDb.searchKeywords).map(kw => ({
        keyword: kw,
        count: dDb.searchKeywords[kw]
      }));
      await supabase.from("search_keywords").insert(keywordsSeed);
    }
  } catch (err) {
    console.error("Failed to seed Supabase database automatically:", err);
  }
}

// Initiate Background Seeding
if (isSupabaseActive) {
  autoSeedSupabase();
}


// --- DYNAMIC ASYNC DATABASE CONTROLLER INTERFACE ---

export async function addAuditLog(userId: string, userEmail: string, action: string, details: string): Promise<void> {
  const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const logObj: AuditLog = {
    id: logId,
    userId,
    userEmail,
    action,
    details,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from("audit_logs").insert([mapLogToDb(logObj)]);
    if (!error) return;
    console.error("Supabase auditting failure, logging locally...", error);
  }

  // Local fallback
  const db = readDb();
  db.auditLogs.unshift(logObj);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  writeDb(db);
}

// Fetch directory contacts with active filters
export async function getContactsFilter(
  category?: string, 
  state?: string, 
  district?: string, 
  search?: string
): Promise<EmergencyContact[]> {

  if (supabase) {
    try {
      let query = supabase.from("contacts").select("*").eq("verification_status", "Verified");

      if (category && category !== "All") {
        query = query.eq("category", category);
        // Track searches asynchronously
        supabase.rpc("increment_category", { cat: category }).then(({ error }) => {
          if (error) {
            // Fallback count updates
            supabase.from("searched_categories").upsert({ category: category, count: 1 }, { onConflict: "category" })
              .then(() => {});
          }
        });
      }

      if (state && state !== "All" && state !== "National Coverage") {
        query = query.or(`state.eq.${state},state.eq.National Coverage`);
      }

      if (district && district !== "All" && district !== "All Districts") {
        query = query.or(`district.eq.${district},state.eq.National Coverage,district.eq.All Districts`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map(mapContactFromDb);

      if (search && search.trim() !== "") {
        const q = search.toLowerCase().trim();
        // Track keyword searches asynchronously
        supabase.from("search_keywords").select("count").eq("keyword", q).maybeSingle().then(({ data: kwData }) => {
          const currentCount = kwData ? kwData.count + 1 : 1;
          supabase.from("search_keywords").upsert({ keyword: q, count: currentCount }, { onConflict: "keyword" }).then(() => {});
        });

        // Search logic filtering
        list = list.filter(c => 
          c.serviceName.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.phoneNumber.includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }

      return list;
    } catch (err) {
      console.error("Supabase failed querying. Falling back to local state...", err);
    }
  }

  // --- Fallback Local Query ---
  const db = readDb();
  let list = db.contacts.filter(c => c.verificationStatus === "Verified");

  if (category && category !== "All") {
    list = list.filter(c => c.category === category);
    db.searchedCategories[category] = (db.searchedCategories[category] || 0) + 1;
  }

  if (state && state !== "All" && state !== "National Coverage") {
    list = list.filter(c => c.state === state || c.state === "National Coverage");
  }

  if (district && district !== "All" && district !== "All Districts") {
    list = list.filter(c => c.district === district || c.state === "National Coverage" || c.district === "All Districts");
  }

  if (search && search.trim() !== "") {
    const query = search.toLowerCase().trim();
    db.searchKeywords[query] = (db.searchKeywords[query] || 0) + 1;

    list = list.filter(c => 
      c.serviceName.toLowerCase().includes(query) ||
      c.organization.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.phoneNumber.includes(query) ||
      c.state.toLowerCase().includes(query) ||
      c.district.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  }

  writeDb(db);
  return list;
}

export async function getContactById(id: string): Promise<EmergencyContact | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        // Increment views in database
        const nextViews = (data.view_count || 0) + 1;
        await supabase.from("contacts").update({ view_count: nextViews }).eq("id", id);
        return mapContactFromDb({ ...data, view_count: nextViews });
      }
    } catch (err) {
      console.error("Supabase view count tracking failure, falling back...", err);
    }
  }

  const db = readDb();
  const contact = db.contacts.find(c => c.id === id);
  if (!contact) return null;
  contact.viewCount++;
  writeDb(db);
  return contact;
}

// User bookmarks logic
export async function toggleBookmark(userId: string, contactId: string): Promise<{ bookmarked: boolean, bookmarks: string[] }> {
  if (supabase) {
    try {
      const { data, error: chkErr } = await supabase.from("bookmarks").select("id").eq("user_id", userId).eq("contact_id", contactId).maybeSingle();
      let bookmarked = false;
      if (chkErr) throw chkErr;

      if (data) {
        // Delete Bookmarked
        await supabase.from("bookmarks").delete().eq("user_id", userId).eq("contact_id", contactId);
        bookmarked = false;
      } else {
        // Create Bookmark
        await supabase.from("bookmarks").insert([{ user_id: userId, contact_id: contactId }]);
        bookmarked = true;
      }

      // Fetch all Bookmarks for User
      const { data: allB, error: getErr } = await supabase.from("bookmarks").select("contact_id").eq("user_id", userId);
      const bookmarksArr = (allB || []).map(b => b.contact_id);

      return { bookmarked, bookmarks: bookmarksArr };
    } catch (err) {
      console.error("Supabase bookmarks failed, falling back to local storage...", err);
    }
  }

  const db = readDb();
  if (!db.bookmarks[userId]) {
    db.bookmarks[userId] = [];
  }

  const index = db.bookmarks[userId].indexOf(contactId);
  let bookmarked = false;
  if (index === -1) {
    db.bookmarks[userId].push(contactId);
    bookmarked = true;
  } else {
    db.bookmarks[userId].splice(index, 1);
  }

  writeDb(db);
  return { bookmarked, bookmarks: db.bookmarks[userId] };
}

export async function getBookmarks(userId: string): Promise<EmergencyContact[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("bookmarks").select("contact_id").eq("user_id", userId);
      if (error) throw error;

      if (!data || data.length === 0) return [];
      const ids = data.map(d => d.contact_id);

      const { data: listData, error: lErr } = await supabase.from("contacts").select("*").in("id", ids);
      if (lErr) throw lErr;

      return (listData || []).map(mapContactFromDb);
    } catch (err) {
      console.error("Supabase bookmarks pull failed:", err);
    }
  }

  const db = readDb();
  const bookmarkedIds = db.bookmarks[userId] || [];
  return db.contacts.filter(c => bookmarkedIds.includes(c.id));
}

// User Suggestions Submissions
export async function submitContact(data: Partial<ContactSubmission>): Promise<ContactSubmission> {
  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const actualSubmittedBy = data.submittedBy || "guest-session";
  const actualSubEmail = data.submitterEmail || "resident@emergency.in";
  const actualSubName = data.submitterName || "Anonymous Resident";

  const newSubmission: ContactSubmission = {
    id: submissionId,
    serviceName: data.serviceName!,
    category: data.category as EmergencyCategory,
    phoneNumber: data.phoneNumber!,
    state: data.state!,
    district: data.district!,
    organization: data.organization!,
    description: data.description!,
    sourceUrl: data.sourceUrl || "",
    verificationEvidence: data.verificationEvidence || "Provided via public citizen registry suggestion.",
    status: "Pending",
    submittedBy: actualSubmittedBy,
    submitterEmail: actualSubEmail,
    submitterName: actualSubName,
    createdAt: new Date().toISOString()
  };

  if (supabase) {
    try {
      const dbRow = mapSubmissionToDb(newSubmission);
      const { error } = await supabase.from("submissions").insert([dbRow]);
      if (!error) {
        await addAuditLog(actualSubmittedBy, actualSubEmail, "Contact Submitted", `Suggested entry draft: ${data.serviceName} (${data.phoneNumber})`);
        return newSubmission;
      }
      throw error;
    } catch (err) {
      console.error("Supabase submissions failure, utilizing fallback local databases ...", err);
    }
  }

  const db = readDb();
  db.submissions.unshift(newSubmission);
  writeDb(db);

  await addAuditLog(actualSubmittedBy, actualSubEmail, "Contact Submitted", `Suggested entry draft: ${data.serviceName} (${data.phoneNumber})`);
  return newSubmission;
}

// Report Discrepancy filing
export async function fileReport(contactId: string, reportedBy: string, reporterEmail: string, reason: string, description: string): Promise<ContactReport> {
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Need to get contact info
  let cName = "Unknown Helpline";
  let cNum = "N/A";

  if (supabase) {
    try {
      const { data: ct } = await supabase.from("contacts").select("service_name, phone_number").eq("id", contactId).maybeSingle();
      if (ct) {
        cName = ct.service_name;
        cNum = ct.phone_number;
      }
    } catch (e) {}
  } else {
    const db = readDb();
    const contact = db.contacts.find(c => c.id === contactId);
    if (contact) {
      cName = contact.serviceName;
      cNum = contact.phoneNumber;
    }
  }

  const newReport: ContactReport = {
    id: reportId,
    contactId,
    contactName: cName,
    contactNumber: cNum,
    reason: reason as any,
    description,
    status: "Pending",
    reportedBy: reportedBy || "Guest",
    reporterEmail,
    createdAt: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { error: repErr } = await supabase.from("reports").insert([mapReportToDb(newReport)]);
      if (!repErr) {
        // Increment report status
        const { data: ctData } = await supabase.from("contacts").select("report_count").eq("id", contactId).maybeSingle();
        const nextReportCount = ctData ? (ctData.report_count || 0) + 1 : 1;
        await supabase.from("contacts").update({ report_count: nextReportCount }).eq("id", contactId);

        await addAuditLog(reportedBy || "guest-id", reporterEmail, "Report Submitted", `Filed report on contact ${cName}: ${reason}`);
        return newReport;
      }
      throw repErr;
    } catch (err) {
      console.error("Supabase report database failure, falling back to local files...", err);
    }
  }

  const db = readDb();
  db.reports.unshift(newReport);
  const contact = db.contacts.find(c => c.id === contactId);
  if (contact) {
    contact.reportCount++;
  }
  writeDb(db);

  await addAuditLog(reportedBy || "guest-id", reporterEmail, "Report Submitted", `Filed report on contact ${cName}: ${reason}`);
  return newReport;
}


// --- SECURE ADMINISTRATIVE READS/MUTATIONS ---

export async function getAdminSubmissions(): Promise<ContactSubmission[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map(mapSubmissionFromDb);
      }
    } catch (e) {
      console.error("Supabase submissions read error, falling back:", e);
    }
  }

  const db = readDb();
  return db.submissions;
}

export async function resolveSubmission(
  id: string, 
  action: "Approve" | "Reject", 
  adminNotes: string, 
  adminId: string, 
  adminEmail: string
): Promise<ContactSubmission | null> {

  if (supabase) {
    try {
      const { data: subData, error: sErr } = await supabase.from("submissions").select("*").eq("id", id).maybeSingle();
      if (sErr) throw sErr;

      if (subData) {
        const updatedStatus = action === "Approve" ? "Approved" : "Rejected";
        const { error: updErr } = await supabase.from("submissions")
          .update({ status: updatedStatus, admin_notes: adminNotes })
          .eq("id", id);
        if (updErr) throw updErr;

        if (action === "Approve") {
          // Push to verified contacts
          const newContact: EmergencyContact = {
            id: `contact-${Date.now()}`,
            serviceName: subData.service_name,
            category: subData.category as EmergencyCategory,
            phoneNumber: subData.phone_number,
            state: subData.state,
            district: subData.district,
            organization: subData.organization,
            description: subData.description,
            sourceUrl: subData.source_url,
            verificationStatus: "Verified",
            lastVerifiedDate: new Date().toISOString().split("T")[0],
            verificationEvidence: subData.verification_evidence || "Approved after thorough manual review of credentials.",
            viewCount: 0,
            reportCount: 0,
            submittedBy: subData.submitted_by
          };
          await supabase.from("contacts").insert([mapContactToDb(newContact)]);
        }

        const refreshedSub = { ...subData, status: updatedStatus, admin_notes: adminNotes };
        await addAuditLog(adminId, adminEmail, `Submission ${action}d`, `User submission entry approved: ${subData.service_name}`);
        return mapSubmissionFromDb(refreshedSub);
      }
    } catch (err) {
      console.error("Supabase resolver failed, falling back...", err);
    }
  }

  const db = readDb();
  const submission = db.submissions.find(s => s.id === id);
  if (!submission) return null;

  submission.status = action === "Approve" ? "Approved" : "Rejected";
  submission.adminNotes = adminNotes || "";

  if (action === "Approve") {
    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      serviceName: submission.serviceName,
      category: submission.category,
      phoneNumber: submission.phoneNumber,
      state: submission.state,
      district: submission.district,
      organization: submission.organization,
      description: submission.description,
      sourceUrl: submission.sourceUrl,
      verificationStatus: "Verified",
      lastVerifiedDate: new Date().toISOString().split("T")[0],
      verificationEvidence: submission.verificationEvidence || "Approved after thorough manual review of credentials.",
      viewCount: 0,
      reportCount: 0,
      submittedBy: submission.submittedBy
    };
    db.contacts.push(newContact);
  }

  writeDb(db);
  await addAuditLog(adminId, adminEmail, `Submission ${action}d`, `User submission entry approved: ${submission.serviceName}`);
  return submission;
}

export async function getAdminReports(): Promise<ContactReport[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data.map(mapReportFromDb);
      }
    } catch (e) {
      console.error("Supabase reports query error, falling back:", e);
    }
  }

  const db = readDb();
  return db.reports;
}

export async function resolveReport(
  id: string, 
  action: string, 
  updateContact: boolean, 
  editedContact: any, 
  adminId: string, 
  adminEmail: string
): Promise<ContactReport | null> {

  if (supabase) {
    try {
      const { data: repData, error: rErr } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (rErr) throw rErr;

      if (repData) {
        const updatedStatus = action === "DeleteContact" ? "Resolved" : (action || "Resolved");
        await supabase.from("reports").update({ status: updatedStatus }).eq("id", id);

        if (updateContact && editedContact) {
          const dbMappedContact = mapContactToDb({
            ...editedContact,
            lastVerifiedDate: new Date().toISOString().split("T")[0]
          });
          await supabase.from("contacts").update(dbMappedContact).eq("id", repData.contact_id);
        } else if (action === "DeleteContact") {
          await supabase.from("contacts").delete().eq("id", repData.contact_id);
        }

        const refreshedRep = { ...repData, status: updatedStatus };
        await addAuditLog(adminId, adminEmail, `Report Resolved`, `Closed issue report ticket ${id} on ${repData.contact_name}`);
        return mapReportFromDb(refreshedRep);
      }
    } catch (err) {
      console.error("Supabase reports resolution failing, falling back...", err);
    }
  }

  const db = readDb();
  const report = db.reports.find(r => r.id === id);
  if (!report) return null;

  report.status = (action === "DeleteContact" ? "Resolved" : action || "Resolved") as any;

  if (updateContact && editedContact) {
    const idx = db.contacts.findIndex(c => c.id === report.contactId);
    if (idx !== -1) {
      db.contacts[idx] = {
        ...db.contacts[idx],
        ...editedContact,
        lastVerifiedDate: new Date().toISOString().split("T")[0]
      };
    }
  } else if (action === "DeleteContact") {
    db.contacts = db.contacts.filter(c => c.id !== report.contactId);
    report.status = "Resolved";
  }

  writeDb(db);
  await addAuditLog(adminId, adminEmail, `Report Resolved`, `Closed issue report ticket ${report.id} on ${report.contactName}`);
  return report;
}

export async function createContactDirectly(fields: any, adminId: string, adminEmail: string): Promise<EmergencyContact> {
  const newContact: EmergencyContact = {
    id: `contact-${Date.now()}`,
    serviceName: fields.serviceName.trim(),
    category: fields.category as EmergencyCategory,
    phoneNumber: fields.phoneNumber.trim(),
    state: fields.state.trim(),
    district: fields.district.trim(),
    organization: fields.organization.trim(),
    description: fields.description.trim(),
    sourceUrl: (fields.sourceUrl || "").trim(),
    verificationStatus: "Verified",
    lastVerifiedDate: new Date().toISOString().split("T")[0],
    verificationEvidence: (fields.verificationEvidence || "Verified directly by System Administrator.").trim(),
    viewCount: 0,
    reportCount: 0,
    submittedBy: adminId || "user-admin"
  };

  if (supabase) {
    try {
      const { error } = await supabase.from("contacts").insert([mapContactToDb(newContact)]);
      if (!error) {
        await addAuditLog(adminId || "user-admin", adminEmail || "admin@emergency.in", "Contact Created Directly", `Admin created contact: ${newContact.serviceName} (${newContact.phoneNumber})`);
        return newContact;
      }
      throw error;
    } catch (err) {
      console.error("Supabase direct creation failed:", err);
    }
  }

  const db = readDb();
  db.contacts.push(newContact);
  writeDb(db);
  await addAuditLog(adminId || "user-admin", adminEmail || "admin@emergency.in", "Contact Created Directly", `Admin created contact: ${newContact.serviceName} (${newContact.phoneNumber})`);
  return newContact;
}

export async function editContactDirectly(id: string, fields: any, adminId: string, adminEmail: string): Promise<EmergencyContact | null> {
  if (supabase) {
    try {
      const { data: ctData, error: getErr } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
      if (getErr) throw getErr;

      if (ctData) {
        const existingTransacted = mapContactFromDb(ctData);
        const updatedObj: EmergencyContact = {
          ...existingTransacted,
          ...fields,
          lastVerifiedDate: new Date().toISOString().split("T")[0]
        };
        const { error: updErr } = await supabase.from("contacts").update(mapContactToDb(updatedObj)).eq("id", id);
        if (updErr) throw updErr;

        await addAuditLog(adminId, adminEmail, "Contact Edited Directly", `Admin modified data for ${updatedObj.serviceName}`);
        return updatedObj;
      }
    } catch (err) {
      console.error("Supabase contact updates failed:", err);
    }
  }

  const db = readDb();
  const idx = db.contacts.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.contacts[idx] = {
    ...db.contacts[idx],
    ...fields,
    lastVerifiedDate: new Date().toISOString().split("T")[0]
  };
  writeDb(db);
  await addAuditLog(adminId, adminEmail, "Contact Edited Directly", `Admin modified data for ${db.contacts[idx].serviceName}`);
  return db.contacts[idx];
}

export async function deleteContactDirectly(id: string, adminId: string, adminEmail: string): Promise<boolean> {
  if (supabase) {
    try {
      const { data: ctData } = await supabase.from("contacts").select("service_name").eq("id", id).maybeSingle();
      const serviceName = ctData ? ctData.service_name : "Unknown Helpline";

      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (!error) {
        await addAuditLog(adminId, adminEmail, "Contact Deleted Directly", `Admin hard-deleted: ${serviceName}`);
        return true;
      }
      throw error;
    } catch (err) {
      console.error("Supabase contact deletion failed:", err);
    }
  }

  const db = readDb();
  const contact = db.contacts.find(c => c.id === id);
  if (!contact) return false;

  db.contacts = db.contacts.filter(c => c.id !== id);
  writeDb(db);
  await addAuditLog(adminId, adminEmail, "Contact Deleted Directly", `Admin hard-deleted: ${contact.serviceName}`);
  return true;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(200);
      if (!error && data) {
        return data.map(mapLogFromDb);
      }
    } catch (e) {
      console.error("Supabase audit log query failed:", e);
    }
  }

  const db = readDb();
  return db.auditLogs;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  let dbContacts: EmergencyContact[] = [];
  let dbSubmissions: any[] = [];
  let dbReports: any[] = [];
  let dbSearchedCategories: { [key: string]: number } = {};
  let dbSearchKeywords: { [key: string]: number } = {};

  if (supabase) {
    try {
      const [
        { data: contactsData },
        { data: subsData },
        { data: repsData },
        { data: catsData },
        { data: kwsData }
      ] = await Promise.all([
        supabase.from("contacts").select("*"),
        supabase.from("submissions").select("*"),
        supabase.from("reports").select("*"),
        supabase.from("searched_categories").select("*"),
        supabase.from("search_keywords").select("*")
      ]);

      if (contactsData) dbContacts = contactsData.map(mapContactFromDb);
      if (subsData) dbSubmissions = subsData.map(mapSubmissionFromDb);
      if (repsData) dbReports = repsData.map(mapReportFromDb);
      
      (catsData || []).forEach(row => {
        dbSearchedCategories[row.category] = row.count || 0;
      });

      (kwsData || []).forEach(row => {
        dbSearchKeywords[row.keyword] = row.count || 0;
      });

    } catch (err) {
      console.error("Supabase statistics compilation failed, falling back dynamically:", err);
      // Fallback
      return compileLocalSummary();
    }
  } else {
    return compileLocalSummary();
  }

  function compileLocalSummary() {
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
    
    const sortedSearchedCategories = Object.keys(db.searchedCategories).map(key => ({
      category: key,
      count: db.searchedCategories[key]
    })).sort((a, b) => b.count - a.count);
    
    const sortedKeywords = Object.keys(db.searchKeywords).map(key => ({
      keyword: key,
      count: db.searchKeywords[key]
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    
    const mostViewedContacts = [...db.contacts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
    
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

  // Compiler for Supabase
  const categoryMap: { [key: string]: number } = {};
  Object.values(EmergencyCategory).forEach(cat => {
    categoryMap[cat] = 0;
  });
  dbContacts.forEach(c => {
    if (c.verificationStatus === "Verified") {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    }
  });

  const categoryDistribution = Object.keys(categoryMap).map(key => ({
    category: key,
    count: categoryMap[key]
  }));

  const sortedSearchedCategories = Object.keys(dbSearchedCategories).map(key => ({
    category: key,
    count: dbSearchedCategories[key]
  })).sort((a, b) => b.count - a.count);

  const sortedKeywords = Object.keys(dbSearchKeywords).map(key => ({
    keyword: key,
    count: dbSearchKeywords[key]
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  const mostViewedContacts = [...dbContacts]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const mostReportedContacts = [...dbContacts]
    .filter(c => c.reportCount > 0)
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  const pendingCount = dbSubmissions.filter(s => s.status === "Pending").length;

  return {
    totalContacts: dbContacts.length,
    verifiedContacts: dbContacts.filter(c => c.verificationStatus === "Verified").length,
    pendingReviews: pendingCount,
    rejectedContacts: dbContacts.filter(c => c.verificationStatus === "Rejected").length,
    reportsSubmitted: dbReports.length,
    categoryDistribution,
    searchTrends: sortedKeywords,
    mostSearchedCategories: sortedSearchedCategories,
    mostViewedContacts,
    mostReportedContacts
  };
}
