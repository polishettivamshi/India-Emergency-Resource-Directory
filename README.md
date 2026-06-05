# 🚨 India Emergency Resource Directory

A highly polished, reliable, full-stack digital registry for national, state, and district crisis networks across India. This application is built with React 19, TypeScript, Tailwind CSS v4, and a robust Express backend server to store, audit, and safely deploy active verified public helplines, rescue centers, and medical grids.

---

## 🛡️ Core Features

### 🔍 Rapid Location and Utility Search
- **State & District Hierarchical Filter:** Fast database scoping down to your specific region in India.
- **Dynamic Category Navigation:** Easily segment listings across Medical & Ambulances, Disaster Management, Police & Women Helpline, Fire & Search Rescue, and Child Support.
- **Instant Search:** Fuzzy search helplines instantly by service name, phone, or tags.

### 📝 Citizen Proposal Pipeline
- **Citizen Suggested Helplines:** Individuals can submit missing or localized support lines directly.
- **Evidence-Based Auditing:** Submissions require a verification URL reference or official media evidence to pass review criteria.
- **Centerpiece Success Modal:** Submitting a recommendation displays a beautiful confirmation center-modal informing the user that their suggestion is in the pipeline.

### 💼 Restricted-Access Administration Control Desk
- **Environment Secured Control Center:** Administrators can log in securely using specific variables configured in `.env`.
- **Suggestions Review Queue:** Review, approve, or reject pending citizen submissions in real time with custom administrative resolution memos.
- **Direct Database Management:** Authorized desk officers can directly insert new verified contacts, update active details, and respond to incoming discrepancy reports.

### ⚠️ Verified Fact-Check Protocols
- **Audit Verification Tags:** Each record features historical fact-checked indicator metrics detailing when the record was last verified and what official documentation backs the contact entry.
- **Report Misinformation:** Double-layered feedback loops allow citizens to instantly report dead contacts, wrong numbers, or suspicious entries, which are queued for review.

---

## ⚙️ App Architecture & Stack

- **Client:** React 19 (Hooks/Functional architecture), Tailwind CSS v4 (with PostCSS compilation), and Lucide React icons.
- **Server:** Express API gateway with automatic payload security, running as an ES module in developmental environments and compiled into a single clean CommonJS build for deployment.
- **Database:** Low-overhead structured `database.json` store with real-time persistent read-write routines.

---

## 📋 System Setup & Environment Configuration

Create a `.env` file at the root of the project to initialize credentials:

```env
# ADMINISTRATOR DESK CREDENTIALS
ADMIN_USERNAME="xxxxxxxxxxxxxxx"
ADMIN_PASSWORD="xxxxxxxxxxxxxxxxxxxxxxxx"
```

> **Security Note:** In order to keep administrative channels fully air-gapped, standard contributor registration is restricted. Only logins matching the exact credentials defined within the server-side environment variables will successfully authenticate.

---

## 🚀 Running the Project

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
*Your application and endpoints will be running locally at `http://localhost:3000`.*

### 3. Build & Compile for Production Deployment
```bash
npm run build
```
This script will:
1. Run Vite build to package optimized static client assets inside `dist/`.
2. Run `esbuild` to compile, bundle, and generate source maps for `server.ts` into a self-contained CommonJS target file at `dist/server.cjs`.

### 4. Run the Production Build
```bash
npm start
```
