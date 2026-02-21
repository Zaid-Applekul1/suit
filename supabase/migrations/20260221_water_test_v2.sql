/*
  # Water Test Results Table — v2
  Exact parameters requested: pH, EC, TDS, CO3, HCO3, Cl, Na, Ca, Mg, SAR, RSC, Boron, NO3-N, SO4

  Run this in Supabase SQL Editor.
  If you already ran 20260221_water_test_results.sql, run the ALTER section only.
*/

-- ============================================================================
-- CREATE (fresh install)
-- ============================================================================
CREATE TABLE IF NOT EXISTS water_test_results (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_id       uuid        REFERENCES fields(id) ON DELETE CASCADE,

  test_date      date        NOT NULL,
  recorded_date  date        DEFAULT CURRENT_DATE,

  -- ── Exact parameters per specification ───────────────────────────────
  water_ph       numeric,          -- pH           (optimal 6.5 – 8.5)
  ec             numeric,          -- EC   dS/m    (< 0.75 excellent)
  tds            numeric,          -- TDS  mg/L    (< 500)
  co3            numeric,          -- CO₃  meq/L
  hco3           numeric,          -- HCO₃ meq/L
  cl             numeric,          -- Cl⁻  meq/L   (< 4 good)
  na             numeric,          -- Na⁺  meq/L   (< 3 good)
  ca             numeric,          -- Ca²⁺ meq/L
  mg             numeric,          -- Mg²⁺ meq/L
  sar            numeric,          -- Sodium Adsorption Ratio (< 10 safe)
  rsc            numeric,          -- Residual Sodium Carbonate meq/L (< 2.5 safe)
  boron          numeric,          -- B    mg/L    (< 0.7 safe for apples)
  no3n           numeric,          -- NO₃-N mg/L   (< 10 safe)
  so4            numeric,          -- SO₄²⁻ mg/L   (< 200)

  -- ── Meta ─────────────────────────────────────────────────────────────
  sample_source  text,             -- Tubewell / Canal / Rain / Pond / etc.
  water_class    text,             -- C1-S1 … C4-S4 or free text
  suitability    text,             -- Excellent / Good / Marginal / Unsuitable
  lab_name       text,
  recommendations text,
  notes          text,

  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================================
-- IF TABLE ALREADY EXISTS — add any missing columns
-- ============================================================================
DO $$
BEGIN
  -- columns present in v1 but renamed / replaced
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='co3')  THEN ALTER TABLE water_test_results ADD COLUMN co3  numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='cl')   THEN ALTER TABLE water_test_results ADD COLUMN cl   numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='na')   THEN ALTER TABLE water_test_results ADD COLUMN na   numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='ca')   THEN ALTER TABLE water_test_results ADD COLUMN ca   numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='mg')   THEN ALTER TABLE water_test_results ADD COLUMN mg   numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='hco3') THEN ALTER TABLE water_test_results ADD COLUMN hco3 numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='no3n') THEN ALTER TABLE water_test_results ADD COLUMN no3n numeric; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='water_test_results' AND column_name='so4')  THEN ALTER TABLE water_test_results ADD COLUMN so4  numeric; END IF;
  -- keep sar, rsc, boron, ec, tds, water_ph — they existed in v1 already
END;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE water_test_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='water_test_results' AND policyname='Users can manage own water test results'
  ) THEN
    CREATE POLICY "Users can manage own water test results"
      ON water_test_results FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- TRIGGER  (re-uses the existing helper function)
-- ============================================================================
DROP TRIGGER IF EXISTS update_water_test_results_updated_at ON water_test_results;
CREATE TRIGGER update_water_test_results_updated_at
  BEFORE UPDATE ON water_test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_water_test_results_user_id   ON water_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_water_test_results_field_id  ON water_test_results(field_id);
CREATE INDEX IF NOT EXISTS idx_water_test_results_test_date ON water_test_results(test_date DESC);
