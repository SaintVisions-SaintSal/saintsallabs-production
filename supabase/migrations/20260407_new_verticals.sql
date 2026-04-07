-- ============================================================
-- NEW VERTICALS MIGRATION — April 7, 2026
-- Builder project persistence + Real Estate + CookinCards
-- Run in: https://supabase.com/dashboard/project/euxrlpuegeiggedqbkiv/sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. BUILDER: Projects table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL DEFAULT 'Untitled Project',
  description   text,
  framework     text NOT NULL DEFAULT 'nextjs'
                  CHECK (framework IN ('nextjs', 'react', 'html')),
  files         jsonb NOT NULL DEFAULT '[]',
  is_deployed   boolean NOT NULL DEFAULT false,
  deploy_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON public.projects (created_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS projects_select_own ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS projects_insert_own ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS projects_update_own ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS projects_delete_own ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 2. REAL ESTATE: Saved analyses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.realestate_analyses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address         text,
  property_type   text,
  asking_price    numeric(15,2),
  units           integer,
  gross_income    numeric(12,2),
  expenses        numeric(12,2),
  noi             numeric(12,2),
  cap_rate        numeric(5,2),
  cash_on_cash    numeric(5,2),
  grm             numeric(8,2),
  deal_rating     text CHECK (deal_rating IN ('A','B','C','D','F')),
  analysis_json   jsonb,
  rent_estimate   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realestate_user_id
  ON public.realestate_analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_realestate_created_at
  ON public.realestate_analyses (created_at DESC);

ALTER TABLE public.realestate_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS realestate_select_own ON public.realestate_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS realestate_insert_own ON public.realestate_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS realestate_delete_own ON public.realestate_analyses
  FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 3. COOKINCARDS: Portfolio table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cards_portfolio (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id         text,
  card_name       text NOT NULL,
  card_set        text,
  card_number     text,
  card_image_url  text,
  card_type       text DEFAULT 'pokemon'
                    CHECK (card_type IN ('pokemon','sports','other')),
  rarity          text,
  purchase_price  numeric(10,2),
  current_price   numeric(10,2),
  quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition       text NOT NULL DEFAULT 'NM'
                    CHECK (condition IN ('Poor','Fair','Good','VG','EX','NM','NM-MT','MT')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_portfolio_user_id
  ON public.cards_portfolio (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_portfolio_card_id
  ON public.cards_portfolio (card_id);

ALTER TABLE public.cards_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS cards_select_own ON public.cards_portfolio
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_insert_own ON public.cards_portfolio
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_update_own ON public.cards_portfolio
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS cards_delete_own ON public.cards_portfolio
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS cards_portfolio_updated_at ON public.cards_portfolio;
CREATE TRIGGER cards_portfolio_updated_at
  BEFORE UPDATE ON public.cards_portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 4. VERIFICATION
-- ─────────────────────────────────────────────────────────────
SELECT table_name, (SELECT count(*) FROM pg_policies WHERE tablename = t.table_name) AS policy_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('projects','realestate_analyses','cards_portfolio')
ORDER BY table_name;
