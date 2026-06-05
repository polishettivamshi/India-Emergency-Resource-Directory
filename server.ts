import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  readDb, 
  writeDb, 
  addAuditLog, 
  getAnalyticsSummary 
} from "./server/db";
import { 
  EmergencyContact, 
  EmergencyCategory, 
  ContactSubmission, 
  ContactReport, 
  User 
} from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increase for attachments
  app.use(express.json({ limit: '10mb' }));

  // Helper middleware for role verification
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers["x-user-role"] as string;
    if (userRole !== "Admin") {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    next();
  };

  const requireRegistered = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers["x-user-role"] as string;
    if (userRole !== "Admin" && userRole !== "Registered" && userRole !== "Guest") {
      return res.status(403).json({ error: "Access denied. Must be a registered contributor or guest." });
    }
    next();
  };

  // --- AUTHENTICATION ENDPOINTS ---
 
  // Real secure logins matching credentials
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check Admin credentials matching the environment variables (robustly stripping quotes)
    let envUser = (process.env.ADMIN_USERNAME || "admin@emergency.in").trim();
    let envPass = (process.env.ADMIN_PASSWORD || "EmergencyDirectorSecure2026!").trim();

    if (envUser.startsWith('"') && envUser.endsWith('"')) {
      envUser = envUser.slice(1, -1).trim();
    } else if (envUser.startsWith("'") && envUser.endsWith("'")) {
      envUser = envUser.slice(1, -1).trim();
    }

    if (envPass.startsWith('"') && envPass.endsWith('"')) {
      envPass = envPass.slice(1, -1).trim();
    } else if (envPass.startsWith("'") && envPass.endsWith("'")) {
      envPass = envPass.slice(1, -1).trim();
    }

    const ADMIN_USERNAME = envUser;
    const ADMIN_PASSWORD = envPass;

    if (trimmedEmail === ADMIN_USERNAME.toLowerCase()) {
      if (password === ADMIN_PASSWORD) {
        const adminUser = {
          id: "user-admin",
          email: ADMIN_USERNAME,
          name: "System Admin (India Emergency Desk)",
          role: "Admin" as const,
          createdAt: new Date().toISOString()
        };
        addAuditLog(adminUser.id, adminUser.email, "Admin Login", "Authenticated as Administrator using secure credentials");
        return res.json({ user: adminUser });
      } else {
        return res.status(401).json({ error: "Invalid password for Administrator." });
      }
    }

    // Default Error
    return res.status(401).json({ error: "No account found with this email. Only Authorized Administrators can login." });
  });

  // Authentication registration is retired by request. Remaining is admin exclusive desk.
  app.post("/api/auth/register", (req, res) => {
    return res.status(400).json({ error: "Registration is disabled. Only the System Administrator can sign in." });
  });

  // Public Configuration Endpoint
  app.get("/api/config", (req, res) => {
    res.json({
      adminUsername: process.env.ADMIN_USERNAME,
      whatsappNumber: process.env.WHATSAPP_NUMBER
    });
  });

  // --- CONTACTS API (SEARCH & FILTERING) ---

  // Fetch filtered contacts
  app.get("/api/contacts", (req, res) => {
    const { category, state, district, search } = req.query;
    const db = readDb();
    
    let list = db.contacts.filter(c => c.verificationStatus === "Verified");

    if (category && category !== "All") {
      list = list.filter(c => c.category === category);
      // Log search trends dynamically
      db.searchedCategories[category as string] = (db.searchedCategories[category as string] || 0) + 1;
    }

    if (state && state !== "All" && state !== "National Coverage") {
      list = list.filter(c => c.state === state || c.state === "National Coverage");
    }

    if (district && district !== "All" && district !== "All Districts") {
      list = list.filter(c => c.district === district || c.state === "National Coverage" || c.district === "All Districts");
    }

    if (search && typeof search === "string" && search.trim() !== "") {
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

    writeDb(db); // Save category/keyword counts
    res.json({ contacts: list });
  });

  // Get contact by ID (returns single detail context and tracks views)
  app.get("/api/contacts/:id", (req, res) => {
    const db = readDb();
    const contact = db.contacts.find(c => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Emergency contact record not found." });
    }

    // Increment views safely
    contact.viewCount++;
    writeDb(db);

    res.json({ contact });
  });

  // Bookmark toggles
  app.post("/api/contacts/:id/bookmark", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized operation." });
    }

    const db = readDb();
    if (!db.bookmarks[userId]) {
      db.bookmarks[userId] = [];
    }

    const index = db.bookmarks[userId].indexOf(req.params.id);
    let bookmarked = false;
    if (index === -1) {
      db.bookmarks[userId].push(req.params.id);
      bookmarked = true;
    } else {
      db.bookmarks[userId].splice(index, 1);
    }

    writeDb(db);
    res.json({ bookmarked, bookmarks: db.bookmarks[userId] });
  });

  // Fetch bookmarked contacts
  app.get("/api/bookmarks", (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const db = readDb();
    const bookmarkedIds = db.bookmarks[userId] || [];
    const list = db.contacts.filter(c => bookmarkedIds.includes(c.id));
    res.json({ contacts: list });
  });

  // --- SUBMISSION LOGIC ---

  // Public Resource Directory Suggestions
  app.post("/api/contacts/submit", (req, res) => {
    const { 
      serviceName, 
      category, 
      phoneNumber, 
      state, 
      district, 
      organization, 
      description, 
      sourceUrl,
      verificationEvidence,
      submittedBy,
      submitterEmail,
      submitterName
    } = req.body;

    if (!serviceName || !category || !phoneNumber || !state || !district || !organization || !description || !sourceUrl) {
      return res.status(400).json({ error: "All contact fields are required." });
    }

    const db = readDb();
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const actualSubmittedBy = submittedBy || "guest-session";
    const actualSubEmail = submitterEmail || "resident@emergency.in";
    const actualSubName = submitterName || "Anonymous Resident";

    const newSubmission: ContactSubmission = {
      id: submissionId,
      serviceName,
      category: category as EmergencyCategory,
      phoneNumber,
      state,
      district,
      organization,
      description,
      sourceUrl,
      verificationEvidence: verificationEvidence || "Provided via public citizen registry suggestion.",
      status: "Pending",
      submittedBy: actualSubmittedBy,
      submitterEmail: actualSubEmail,
      submitterName: actualSubName,
      createdAt: new Date().toISOString()
    };

    db.submissions.unshift(newSubmission);
    writeDb(db);

    addAuditLog(actualSubmittedBy, actualSubEmail, "Contact Submitted", `Suggested entry draft: ${serviceName} (${phoneNumber})`);
    res.json({ success: true, submission: newSubmission });
  });

  // Registered User reports an incorrect contact
  app.post("/api/contacts/:id/report", (req, res) => {
    const { reason, description, reportedBy, reporterEmail } = req.body;
    if (!reason || !description || !reporterEmail) {
      return res.status(400).json({ error: "Reason, details, and verification contact email are required." });
    }

    const db = readDb();
    const contact = db.contacts.find(c => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Reference contact not found." });
    }

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newReport: ContactReport = {
      id: reportId,
      contactId: contact.id,
      contactName: contact.serviceName,
      contactNumber: contact.phoneNumber,
      reason,
      description,
      status: "Pending",
      reportedBy: reportedBy || "Guest",
      reporterEmail,
      createdAt: new Date().toISOString()
    };

    db.reports.unshift(newReport);
    contact.reportCount++;
    writeDb(db);

    addAuditLog(reportedBy || "guest-id", reporterEmail, "Report Submitted", `Filed report on contact ${contact.serviceName}: ${reason}`);
    res.json({ success: true, report: newReport });
  });

  // --- ADMIN ACTIONS (SECURED) ---

  // Admin: Create continuous emergency helpline contact directly
  app.post("/api/admin/contacts", requireAdmin, (req, res) => {
    const { 
      serviceName, 
      category, 
      phoneNumber, 
      state, 
      district, 
      organization, 
      description, 
      sourceUrl,
      verificationEvidence,
      adminId,
      adminEmail
    } = req.body;

    if (!serviceName || !category || !phoneNumber || !state || !district || !organization || !description) {
      return res.status(400).json({ error: "Required directory contact fields are missing." });
    }

    const db = readDb();
    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      serviceName: serviceName.trim(),
      category: category as EmergencyCategory,
      phoneNumber: phoneNumber.trim(),
      state: state.trim(),
      district: district.trim(),
      organization: organization.trim(),
      description: description.trim(),
      sourceUrl: (sourceUrl || "").trim(),
      verificationStatus: "Verified",
      lastVerifiedDate: new Date().toISOString().split("T")[0],
      verificationEvidence: (verificationEvidence || "Verified directly by System Administrator.").trim(),
      viewCount: 0,
      reportCount: 0,
      submittedBy: adminId || "user-admin"
    };

    db.contacts.push(newContact);
    writeDb(db);
    addAuditLog(adminId || "user-admin", adminEmail || "admin@emergency.in", "Contact Created Directly", `Admin created contact: ${newContact.serviceName} (${newContact.phoneNumber})`);
    res.json({ success: true, contact: newContact });
  });

  // Admin: View pending/approved submissions
  app.get("/api/admin/submissions", requireAdmin, (req, res) => {
    const db = readDb();
    res.json({ submissions: db.submissions });
  });

  // Admin approves/rejects draft contact
  app.post("/api/admin/submissions/:id/resolve", requireAdmin, (req, res) => {
    const { action, adminNotes, adminId, adminEmail } = req.body; // action: 'Approve' or 'Reject'
    if (!action || !["Approve", "Reject"].includes(action)) {
      return res.status(400).json({ error: "Resolving submissions requires 'Approve' or 'Reject' action." });
    }

    const db = readDb();
    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Draft submission not found." });
    }

    submission.status = action === "Approve" ? "Approved" : "Rejected";
    submission.adminNotes = adminNotes || "";

    if (action === "Approve") {
      // Elevate to live contacts
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
    addAuditLog(adminId, adminEmail, `Submission ${action}d`, `User submission entry approved: ${submission.serviceName}`);
    res.json({ success: true, submission });
  });

  // Admin: View submitted reports
  app.get("/api/admin/reports", requireAdmin, (req, res) => {
    const db = readDb();
    res.json({ reports: db.reports });
  });

  // Admin: Resolve/Discards contact reports & modifies target fields
  app.post("/api/admin/reports/:id/resolve", requireAdmin, (req, res) => {
    const { action, updateContact, editedContact, adminId, adminEmail } = req.body; // action: 'Resolved' | 'Reviewed'
    
    const db = readDb();
    const report = db.reports.find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report ticket not found." });
    }

    report.status = action || "Resolved";

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
    addAuditLog(adminId, adminEmail, `Report Resolved`, `Closed issue report ticket ${report.id} on ${report.contactName}`);
    res.json({ success: true, report });
  });

  // Admin: Edit specific contact directly
  app.post("/api/admin/contacts/:id/edit", requireAdmin, (req, res) => {
    const { updatedFields, adminId, adminEmail } = req.body;
    const db = readDb();
    const idx = db.contacts.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Requested contact not found." });
    }

    db.contacts[idx] = {
      ...db.contacts[idx],
      ...updatedFields,
      lastVerifiedDate: new Date().toISOString().split("T")[0]
    };
    writeDb(db);
    addAuditLog(adminId, adminEmail, "Contact Edited Directly", `Admin modified data for ${db.contacts[idx].serviceName}`);
    res.json({ success: true, contact: db.contacts[idx] });
  });

  // Admin: Delete specific contact record directly
  app.delete("/api/admin/contacts/:id", requireAdmin, (req, res) => {
    const { adminId, adminEmail } = req.body;
    const db = readDb();
    const contact = db.contacts.find(c => c.id === req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Requested contact not found." });
    }

    db.contacts = db.contacts.filter(c => c.id !== req.params.id);
    writeDb(db);
    addAuditLog(adminId, adminEmail, "Contact Deleted Directly", `Admin hard-deleted: ${contact.serviceName}`);
    res.json({ success: true });
  });

  // Admin: Fetch dynamic analytics dashboards datasets
  app.get("/api/admin/analytics", requireAdmin, (req, res) => {
    const summary = getAnalyticsSummary();
    res.json({ analytics: summary });
  });

  // Admin: Fetch audits pipeline stream
  app.get("/api/admin/audit-logs", requireAdmin, (req, res) => {
    const db = readDb();
    res.json({ logs: db.auditLogs });
  });

  // --- VITE DEV OR STATIC DIST STREAM INGRESS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`India Emergency Database is fully active. Direct requests logging to http://localhost:${PORT}`);
  });
}

startServer();
