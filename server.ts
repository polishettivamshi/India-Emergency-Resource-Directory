import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  addAuditLog,
  getContactsFilter,
  getContactById,
  toggleBookmark,
  getBookmarks,
  submitContact,
  fileReport,
  getAdminSubmissions,
  resolveSubmission,
  getAdminReports,
  resolveReport,
  createContactDirectly,
  editContactDirectly,
  deleteContactDirectly,
  getAuditLogs,
  getAnalyticsSummary
} from "./server/db";

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

  // --- AUTHENTICATION ENDPOINTS ---
 
  // Real secure logins matching credentials
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check Admin credentials matching the environment variables
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
        await addAuditLog(adminUser.id, adminUser.email, "Admin Login", "Authenticated as Administrator using secure credentials");
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
  app.get("/api/contacts", async (req, res) => {
    const { category, state, district, search } = req.query;
    try {
      const list = await getContactsFilter(
        category as string,
        state as string,
        district as string,
        search as string
      );
      res.json({ contacts: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query directory contacts." });
    }
  });

  // Get contact by ID (returns single detail context and tracks views)
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await getContactById(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Emergency contact record not found." });
      }
      res.json({ contact });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query contact detail." });
    }
  });

  // Bookmark toggles
  app.post("/api/contacts/:id/bookmark", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized operation." });
    }
    try {
      const result = await toggleBookmark(userId, req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to toggle item bookmark." });
    }
  });

  // Fetch bookmarked contacts
  app.get("/api/bookmarks", async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }
    try {
      const list = await getBookmarks(userId);
      res.json({ contacts: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query bookmarks." });
    }
  });

  // --- SUBMISSION LOGIC ---

  // Public Resource Directory Suggestions
  app.post("/api/contacts/submit", async (req, res) => {
    const { 
      serviceName, 
      category, 
      phoneNumber, 
      state, 
      district, 
      organization, 
      description, 
      sourceUrl
    } = req.body;

    if (!serviceName || !category || !phoneNumber || !state || !district || !organization || !description || !sourceUrl) {
      return res.status(400).json({ error: "All contact fields are required." });
    }

    try {
      const submission = await submitContact(req.body);
      res.json({ success: true, submission });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to file directory suggestion." });
    }
  });

  // Citizens report an incorrect contact discrepancy
  app.post("/api/contacts/:id/report", async (req, res) => {
    const { reason, description, reportedBy, reporterEmail } = req.body;
    if (!reason || !description || !reporterEmail) {
      return res.status(400).json({ error: "Reason, details, and verification contact email are required." });
    }

    try {
      const report = await fileReport(req.params.id, reportedBy, reporterEmail, reason, description);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to submit directory warning report." });
    }
  });

  // --- ADMIN ACTIONS (SECURED) ---

  // Admin: Create emergency helpline contact directly
  app.post("/api/admin/contacts", requireAdmin, async (req, res) => {
    const { 
      serviceName, 
      category, 
      phoneNumber, 
      state, 
      district, 
      organization, 
      description,
      adminId,
      adminEmail
    } = req.body;

    if (!serviceName || !category || !phoneNumber || !state || !district || !organization || !description) {
      return res.status(400).json({ error: "Required directory contact fields are missing." });
    }

    try {
      const contact = await createContactDirectly(req.body, adminId, adminEmail);
      res.json({ success: true, contact });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to append new official contact." });
    }
  });

  // Admin: View pending/approved submissions queue in verification desk
  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      const list = await getAdminSubmissions();
      res.json({ submissions: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query submission pipeline queues." });
    }
  });

  // Admin approves/rejects user proposed helpline
  app.post("/api/admin/submissions/:id/resolve", requireAdmin, async (req, res) => {
    const { action, adminNotes, adminId, adminEmail } = req.body;
    if (!action || !["Approve", "Reject"].includes(action)) {
      return res.status(400).json({ error: "Resolving submissions requires 'Approve' or 'Reject' action." });
    }

    try {
      const sub = await resolveSubmission(req.params.id, action, adminNotes, adminId, adminEmail);
      if (!sub) {
        return res.status(404).json({ error: "Submission verification ticket not found." });
      }
      res.json({ success: true, submission: sub });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to register administrative pipeline resolution." });
    }
  });

  // Admin: View submitted discrepancy warnings
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const list = await getAdminReports();
      res.json({ reports: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch reports." });
    }
  });

  // Admin: Resolves reports
  app.post("/api/admin/reports/:id/resolve", requireAdmin, async (req, res) => {
    const { action, updateContact, editedContact, adminId, adminEmail } = req.body;
    try {
      const report = await resolveReport(req.params.id, action, updateContact, editedContact, adminId, adminEmail);
      if (!report) {
        return res.status(404).json({ error: "Discrepancy report not found." });
      }
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to apply report resolution parameters." });
    }
  });

  // Admin: Edit specific contact directly
  app.post("/api/admin/contacts/:id/edit", requireAdmin, async (req, res) => {
    const { updatedFields, adminId, adminEmail } = req.body;
    try {
      const contact = await editContactDirectly(req.params.id, updatedFields, adminId, adminEmail);
      if (!contact) {
        return res.status(404).json({ error: "Emergency target contact to edit was not found." });
      }
      res.json({ success: true, contact });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to perform administrative modifications." });
    }
  });

  // Admin: Delete specific contact record directly
  app.delete("/api/admin/contacts/:id", requireAdmin, async (req, res) => {
    const { adminId, adminEmail } = req.body;
    try {
      const deleted = await deleteContactDirectly(req.params.id, adminId, adminEmail);
      if (!deleted) {
        return res.status(404).json({ error: "Emergency contact record to delete was not found." });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to execute deletion operation." });
    }
  });

  // Admin: Fetch analytics
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const summary = await getAnalyticsSummary();
      res.json({ analytics: summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to extract active analytics distributions." });
    }
  });

  // Admin: Fetch audits pipeline history log
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await getAuditLogs();
      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to download audit tracks." });
    }
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
