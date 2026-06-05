-- INDIA EMERGENCY RESOURCE DIRECTORY - SUPABASE POSTGRESQL SCHEMA
-- Paste this script into your Supabase SQL Editor (https://database.supabase.com) to instantly provision your tables.

-- 1. Create Category Enum Representation (Optionally standard TEXT for ease of client updates)
-- 2. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY DEFAULT 'contact-' || txid_current()::text,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    organization TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    verification_status TEXT NOT NULL DEFAULT 'Verified',
    last_verified_date TEXT NOT NULL,
    verification_evidence TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    report_count INTEGER NOT NULL DEFAULT 0,
    submitted_by TEXT DEFAULT 'user-admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index search vectors
CREATE INDEX IF NOT EXISTS contacts_search_idx ON contacts (state, district, category);

-- 3. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    organization TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    verification_evidence TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    submitted_by TEXT NOT NULL DEFAULT 'anonymous',
    submitter_email TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_notes TEXT
);

-- 4. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    reported_by TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, contact_id)
);

-- 7. SEARCHED CATEGORIES TRENDS (Optional Analytics)
CREATE TABLE IF NOT EXISTS searched_categories (
    category TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

-- 8. SEARCH KEYWORDS TRENDS (Optional Analytics)
CREATE TABLE IF NOT EXISTS search_keywords (
    keyword TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

-- Enable Realtime for emergency alerts (Optional)
alter publication supabase_realtime add table contacts;
