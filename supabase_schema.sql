-- Supabase Schema: Rastreador Antigravity
-- Projeto: https://supabase.com/dashboard/project/piyzjodvmejqxvpwzohp

-- 1. Accounts Table (Contas, Links, Datas e Horários)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  link TEXT,
  target_date TIMESTAMPTZ NOT NULL,
  reminder_10_min_sent BOOLEAN DEFAULT FALSE,
  ready_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir coluna link caso a tabela já exista
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Config Table (chaves VAPID e configurações gerais)
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 3. Subscriptions Table (Alvos de Notificações Push)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de RLS (Row Level Security)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para a tabela accounts (permitindo leitura e escrita autenticada ou anon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Permitir acesso completo a accounts'
  ) THEN
    CREATE POLICY "Permitir acesso completo a accounts" ON accounts
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'config' AND policyname = 'Permitir acesso completo a config'
  ) THEN
    CREATE POLICY "Permitir acesso completo a config" ON config
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Permitir acesso completo a subscriptions'
  ) THEN
    CREATE POLICY "Permitir acesso completo a subscriptions" ON subscriptions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
