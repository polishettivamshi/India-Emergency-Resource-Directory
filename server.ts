import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("Loaded env: SUPABASE_URL=", Boolean(process.env.SUPABASE_URL));
console.log("Loaded env: SUPABASE_ANON_KEY=", Boolean(process.env.SUPABASE_ANON_KEY));
console.log("Loaded env: SUPABASE_SERVICE_ROLE_KEY=", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));

import express from "express";
import { createServer as createViteServer } from "vite";

const db = await import("./server/db");
const {
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
} = db;

async function startServer() {
  const app = express();
  const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const PORT = Number.isFinite(DEFAULT_PORT) && DEFAULT_PORT > 0 ? DEFAULT_PORT : 3000;
  const HMR_PORT = process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : PORT + 10;

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
    let envUser = process.env.ADMIN_USERNAME;
    let envPass = process.env.ADMIN_PASSWORD;

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

  // SEO: Sitemap Generation
  app.get("/sitemap.xml", async (req, res) => {
    try {
      res.type("application/xml");
      const baseUrl = "https://india-emergency-resource-directory.onrender.com";
      
      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      try {
        const contactList = await getContactsFilter("", "", "", "");
        
        if (Array.isArray(contactList)) {
          contactList.forEach((contact: any) => {
            sitemapXml += `
  <url>
    <loc>${baseUrl}/?contact=${contact.id}</loc>
    <lastmod>${contact.lastVerified || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          });
        }
      } catch (err) {
        console.warn("Could not fetch contacts for sitemap:", err);
      }

      sitemapXml += `
</urlset>`;
      res.send(sitemapXml);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
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
      server: {
        middlewareMode: true,
        hmr: {
          port: HMR_PORT
        }
      },
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

  const maxPortAttempts = 5;
  let currentPort = PORT;

  const startListening = (port: number, attempt = 1) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`India Emergency Database is fully active. Direct requests logging to http://localhost:${port}`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE" && attempt < maxPortAttempts) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
        currentPort = nextPort;
        startListening(nextPort, attempt + 1);
      } else {
        console.error(`Failed to start server on port ${port}:`, err.message || err);
        process.exit(1);
      }
    });
  };

  startListening(currentPort);
}

startServer();
