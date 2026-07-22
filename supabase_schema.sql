-- Supabase Schema: Rastreador Antigravity

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  target_date TIMESTAMPTZ NOT NULL,
  reminder_10_min_sent BOOLEAN DEFAULT FALSE,
  ready_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Config Table (for VAPID keys and other settings)
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 3. Subscriptions (Push Notifications Targets)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Settings
-- Note: As we are using Vercel API with Service Role Key, we can either
-- disable RLS or just enable it and leave it empty (disallow anon).
-- For internal API use, Service Role bypasses RLS anyway.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
