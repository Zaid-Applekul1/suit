/*
  # Tree Scouting Module — Complete Database Migration
  AppleKul™ Suite | Precision IPM at Tree Level

  ## Overview
  This migration adds full tree-level scouting capability on top of the existing
  tree_tags table.  It does NOT create trees — it consumes them.

  ## Tables Added:
  1. tree_scouting_observations   — Core scouting record per tree per visit
  2. tree_scouting_photos         — Photo evidence linked to observations
  3. tree_health_snapshots        — Computed/cached health state per tree (updated by ETL)
  4. tree_etl_rules               — ETL thresholds per pest × variety × BBCH stage
  5. tree_scouting_alerts         — Tree-level and block-level alerts generated
  6. tree_spray_actions           — Precision spray actions linked to trees or blocks

  ## Security:
  - RLS enabled on all tables
  - User can manage their own scouting data
  - Alerts readable by the owning user
*/
-- Triggers (on tables)
DROP TRIGGER IF EXISTS update_tree_scouting_observations_updated_at ON tree_scouting_observations;
DROP TRIGGER IF EXISTS update_tree_health_snapshots_updated_at ON tree_health_snapshots;
DROP TRIGGER IF EXISTS update_tree_etl_rules_updated_at ON tree_etl_rules;
DROP TRIGGER IF EXISTS update_tree_scouting_alerts_updated_at ON tree_scouting_alerts;
DROP TRIGGER IF EXISTS update_tree_spray_actions_updated_at ON tree_spray_actions;

-- Functions (ETL and batch)
DROP FUNCTION IF EXISTS batch_sync_scouting(uuid, jsonb);
DROP FUNCTION IF EXISTS compute_tree_health(uuid, uuid);

-- Views
DROP VIEW IF EXISTS block_health_summary CASCADE;
DROP VIEW IF EXISTS tree_scouting_dashboard_view CASCADE;


-- Storage policies (must be removed explicitly)
DROP POLICY IF EXISTS "Users upload own scouting photos" ON storage.objects;
DROP POLICY IF EXISTS "Users read own scouting photos" ON storage.objects;

-- Tables (drop in order to avoid FK dependency issues)
DROP TABLE IF EXISTS tree_spray_actions CASCADE;
DROP TABLE IF EXISTS tree_scouting_alerts CASCADE;
DROP TABLE IF EXISTS tree_etl_rules CASCADE;
DROP TABLE IF EXISTS tree_health_snapshots CASCADE;
DROP TABLE IF EXISTS tree_scouting_photos CASCADE;
DROP TABLE IF EXISTS tree_scouting_observations CASCADE;

-- Types (enum)
DROP TYPE IF EXISTS etl_action;
DROP TYPE IF EXISTS plant_part;
DROP TYPE IF EXISTS alert_status;
DROP TYPE IF EXISTS alert_level;
DROP TYPE IF EXISTS scouting_sync_status;
DROP TYPE IF EXISTS tree_health_status;

-- Extension (optional; keeps if other code depends on it)
-- Note: only drop if you're sure no other objects use it
DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- EXTENSION (safe no-op if already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES  (created only if they do not exist)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE tree_health_status AS ENUM ('HEALTHY', 'STRESSED', 'INFECTED', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scouting_sync_status AS ENUM ('PENDING_SYNC', 'SYNCED', 'CONFLICT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_level AS ENUM ('TREE', 'BLOCK', 'ORCHARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plant_part AS ENUM ('LEAF', 'FRUIT', 'SHOOT', 'ROOT', 'TRUNK', 'WHOLE_TREE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE etl_action AS ENUM ('NO_ACTION', 'MONITOR', 'TREAT_TREE', 'TREAT_BLOCK', 'TREAT_ORCHARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 1. TREE SCOUTING OBSERVATIONS
--    Core scouting record — one per scout visit to a specific tree.
--    Works offline-first: UUID is generated on device, sync_status tracks upload state.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_scouting_observations (
  -- Identity & Offline-First
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uuid           uuid NOT NULL UNIQUE,          -- UUID generated on device; idempotent upsert key
  sync_status           scouting_sync_status NOT NULL DEFAULT 'PENDING_SYNC',
  synced_at             timestamptz,

  -- Ownership
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tree Reference (from Fields Module — NOT created here)
  tree_tag_id           uuid REFERENCES tree_tags(id) ON DELETE CASCADE NOT NULL,
  field_id              uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  orchard_id            uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,  -- same as field for now; alias for clarity

  -- Tree Context (denormalised for offline use; auto-filled from tree_tags on save)
  tree_variety          text,
  tree_row_number       integer,
  tree_lat              numeric,
  tree_lng              numeric,

  -- Scout & Timing
  scouted_by            text NOT NULL,                 -- scout name / user display name
  scouted_at            timestamptz NOT NULL DEFAULT now(),
  gps_lat               numeric,                       -- scout's GPS at time of observation
  gps_lng               numeric,
  gps_accuracy_m        numeric,                       -- GPS accuracy in metres

  -- Growth Stage (BBCH scale for apple, e.g. 51, 53, 65, 71, 75, 81, 87, 92)
  bbch_stage            integer CHECK (bbch_stage BETWEEN 0 AND 99),
  bbch_label            text,                          -- human label e.g. "Full Bloom (BBCH 65)"

  -- Pest / Disease (EPPO-coded)
  pest_eppo_code        text,                          -- e.g. VENTIN, PODOSL, ERWIAM
  pest_name             text NOT NULL,                 -- human name e.g. "Apple Scab"
  pest_category         text CHECK (pest_category IN ('PEST', 'DISEASE', 'PHYSIOLOGICAL', 'NONE')),

  -- Severity
  pest_count            numeric DEFAULT 0,             -- count per leaf / shoot / fruit
  severity_score        integer CHECK (severity_score BETWEEN 0 AND 5),
  -- 0=None 1=Trace 2=Low 3=Moderate 4=High 5=Severe
  severity_label        text GENERATED ALWAYS AS (
    CASE severity_score
      WHEN 0 THEN 'None'
      WHEN 1 THEN 'Trace'
      WHEN 2 THEN 'Low'
      WHEN 3 THEN 'Moderate'
      WHEN 4 THEN 'High'
      WHEN 5 THEN 'Severe'
      ELSE 'Unknown'
    END
  ) STORED,

  -- Affected Part
  affected_part         plant_part DEFAULT 'LEAF',

  -- Observation Text
  notes                 text,

  -- Health Classification (computed on sync / ETL)
  tree_health_status    tree_health_status DEFAULT 'HEALTHY',
  etl_action_recommended etl_action DEFAULT 'NO_ACTION',

  -- Audit
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_scouting_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scouting observations"
  ON tree_scouting_observations FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Allow doctors / agronomists to read scouting data (same pattern as consultations)
CREATE POLICY "Doctors can read all scouting observations"
  ON tree_scouting_observations FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 2. TREE SCOUTING PHOTOS
--    One observation can have multiple photos.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_scouting_photos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id        uuid REFERENCES tree_scouting_observations(id) ON DELETE CASCADE NOT NULL,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url             text NOT NULL,                 -- Supabase storage path or base64 stub (offline)
  is_synced             boolean DEFAULT false,          -- false = stored offline, not yet uploaded
  caption               text,
  taken_at              timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_scouting_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scouting photos"
  ON tree_scouting_photos FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TREE HEALTH SNAPSHOTS
--    One row per tree; updated by ETL after each new observation sync.
--    Fast lookup for dashboard map coloring.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_health_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_tag_id           uuid REFERENCES tree_tags(id) ON DELETE CASCADE NOT NULL UNIQUE,
  field_id              uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Current Health
  health_status         tree_health_status NOT NULL DEFAULT 'HEALTHY',
  last_scouted_at       timestamptz,
  last_pest_eppo        text,
  last_severity_score   integer,
  total_observations    integer DEFAULT 0,

  -- Seasonal Counters (reset each season)
  season_year           integer DEFAULT date_part('year', now())::integer,
  infected_count        integer DEFAULT 0,             -- times this tree was INFECTED this season
  critical_count        integer DEFAULT 0,             -- times this tree was CRITICAL this season
  spray_action_count    integer DEFAULT 0,

  -- Computed by ETL
  etl_action            etl_action DEFAULT 'NO_ACTION',
  risk_score            numeric DEFAULT 0,             -- 0–100 composite risk

  computed_at           timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own health snapshots"
  ON tree_health_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can read health snapshots"
  ON tree_health_snapshots FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 4. TREE ETL RULES
--    Economic Threshold Logic rules at tree resolution.
--    Administrators / agronomists populate this table.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_etl_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope
  pest_eppo_code        text,                          -- NULL = applies to any pest
  variety_name          text,                          -- NULL = applies to any variety
  bbch_min              integer DEFAULT 0,
  bbch_max              integer DEFAULT 99,

  -- Thresholds
  pest_count_threshold  numeric NOT NULL,              -- observations above this → action
  severity_threshold    integer NOT NULL DEFAULT 2,    -- severity score above this → action

  -- Outcome
  action                etl_action NOT NULL DEFAULT 'MONITOR',
  escalation_pct        numeric DEFAULT 25.0,          -- % of block trees infected → block alert

  -- Description
  rule_name             text NOT NULL,
  description           text,

  active                boolean DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_etl_rules ENABLE ROW LEVEL SECURITY;

-- ETL rules are system-wide reference data — all authenticated users can read
CREATE POLICY "Authenticated users read ETL rules"
  ON tree_etl_rules FOR SELECT TO authenticated
  USING (true);

-- Only service role / admins write rules (not exposing insert policy here)

-- ============================================================================
-- 5. TREE SCOUTING ALERTS
--    Tree-level or block-level alerts generated by the ETL engine.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_scouting_alerts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_id              uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  tree_tag_id           uuid REFERENCES tree_tags(id) ON DELETE SET NULL,  -- NULL for block-level alerts

  -- Alert Classification
  alert_level           alert_level NOT NULL DEFAULT 'TREE',
  alert_status          alert_status NOT NULL DEFAULT 'OPEN',
  severity              tree_health_status NOT NULL DEFAULT 'INFECTED',

  -- Context
  pest_eppo_code        text,
  pest_name             text,
  etl_action            etl_action NOT NULL,
  message               text NOT NULL,
  triggered_by_obs_id   uuid REFERENCES tree_scouting_observations(id) ON DELETE SET NULL,

  -- Block escalation context
  block_infected_pct    numeric,                       -- % of trees infected in block (for BLOCK alerts)
  affected_tree_count   integer DEFAULT 1,

  -- Resolution
  resolved_at           timestamptz,
  resolution_notes      text,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_scouting_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scouting alerts"
  ON tree_scouting_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TREE SPRAY ACTIONS
--    Precision spray records at tree or block resolution.
--    Links back to an alert and tracks execution.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tree_spray_actions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_id              uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  alert_id              uuid REFERENCES tree_scouting_alerts(id) ON DELETE SET NULL,

  -- Scope
  action_level          alert_level NOT NULL DEFAULT 'TREE',  -- TREE or BLOCK
  target_tree_ids       uuid[],                        -- array of tree_tag IDs treated
  target_tree_count     integer DEFAULT 1,

  -- Spray Details
  product_name          text NOT NULL,
  eppo_code             text,
  dosage                text NOT NULL,                 -- e.g. "500ml/200L"
  water_litres          numeric,
  spray_date            date NOT NULL DEFAULT CURRENT_DATE,

  -- Cost
  estimated_cost        numeric DEFAULT 0,
  actual_cost           numeric,
  currency              text DEFAULT 'INR',

  -- Outcome
  executed              boolean DEFAULT false,
  executed_at           timestamptz,
  executor_name         text,
  notes                 text,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE tree_spray_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own spray actions"
  ON tree_spray_actions FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS — updated_at
-- ============================================================================
-- Reuse the existing update_updated_at_column() function created in the base migration.

CREATE TRIGGER update_tree_scouting_observations_updated_at
  BEFORE UPDATE ON tree_scouting_observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tree_health_snapshots_updated_at
  BEFORE UPDATE ON tree_health_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tree_etl_rules_updated_at
  BEFORE UPDATE ON tree_etl_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tree_scouting_alerts_updated_at
  BEFORE UPDATE ON tree_scouting_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tree_spray_actions_updated_at
  BEFORE UPDATE ON tree_spray_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES — Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tso_tree_tag_id       ON tree_scouting_observations(tree_tag_id);
CREATE INDEX IF NOT EXISTS idx_tso_field_id          ON tree_scouting_observations(field_id);
CREATE INDEX IF NOT EXISTS idx_tso_user_id           ON tree_scouting_observations(user_id);
CREATE INDEX IF NOT EXISTS idx_tso_scouted_at        ON tree_scouting_observations(scouted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tso_sync_status       ON tree_scouting_observations(sync_status) WHERE sync_status = 'PENDING_SYNC';
CREATE INDEX IF NOT EXISTS idx_tso_client_uuid       ON tree_scouting_observations(client_uuid);
CREATE INDEX IF NOT EXISTS idx_tso_pest_eppo         ON tree_scouting_observations(pest_eppo_code);

CREATE INDEX IF NOT EXISTS idx_ths_tree_tag_id       ON tree_health_snapshots(tree_tag_id);
CREATE INDEX IF NOT EXISTS idx_ths_field_id          ON tree_health_snapshots(field_id);
CREATE INDEX IF NOT EXISTS idx_ths_health_status     ON tree_health_snapshots(health_status);

CREATE INDEX IF NOT EXISTS idx_tsa_field_id          ON tree_scouting_alerts(field_id);
CREATE INDEX IF NOT EXISTS idx_tsa_user_id           ON tree_scouting_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_tsa_alert_status      ON tree_scouting_alerts(alert_status) WHERE alert_status = 'OPEN';

CREATE INDEX IF NOT EXISTS idx_tspr_field_id         ON tree_spray_actions(field_id);
CREATE INDEX IF NOT EXISTS idx_tspr_user_id          ON tree_spray_actions(user_id);

-- ============================================================================
-- ETL FUNCTION — compute_tree_health
--    Called after each observation batch sync.
--    Updates tree_health_snapshots and generates alerts.
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_tree_health(p_tree_tag_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_latest    tree_scouting_observations%ROWTYPE;
  v_count     integer;
  v_max_sev   integer;
  v_status    tree_health_status;
  v_action    etl_action;
  v_rule      tree_etl_rules%ROWTYPE;
  v_field_id  uuid;
  v_block_total   integer;
  v_block_infected integer;
  v_block_pct      numeric;
BEGIN
  -- Latest observation for this tree
  SELECT * INTO v_latest
  FROM tree_scouting_observations
  WHERE tree_tag_id = p_tree_tag_id
  ORDER BY scouted_at DESC
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  v_field_id := v_latest.field_id;

  -- Aggregate stats for this tree (current season)
  SELECT COUNT(*), COALESCE(MAX(severity_score), 0)
  INTO v_count, v_max_sev
  FROM tree_scouting_observations
  WHERE tree_tag_id = p_tree_tag_id
    AND date_part('year', scouted_at) = date_part('year', now());

  -- Match ETL rule
  SELECT * INTO v_rule
  FROM tree_etl_rules
  WHERE active = true
    AND (pest_eppo_code IS NULL OR pest_eppo_code = v_latest.pest_eppo_code)
    AND (variety_name IS NULL OR variety_name = v_latest.tree_variety)
    AND v_latest.bbch_stage BETWEEN bbch_min AND bbch_max
    AND (v_latest.severity_score >= severity_threshold
         OR v_latest.pest_count >= pest_count_threshold)
  ORDER BY action DESC                                    -- most severe rule wins
  LIMIT 1;

  -- Derive health status from latest severity
  v_status := CASE
    WHEN v_max_sev = 0 THEN 'HEALTHY'::tree_health_status
    WHEN v_max_sev <= 2 THEN 'STRESSED'::tree_health_status
    WHEN v_max_sev <= 4 THEN 'INFECTED'::tree_health_status
    ELSE 'CRITICAL'::tree_health_status
  END;

  v_action := COALESCE(v_rule.action, CASE
    WHEN v_status = 'HEALTHY'  THEN 'NO_ACTION'::etl_action
    WHEN v_status = 'STRESSED' THEN 'MONITOR'::etl_action
    WHEN v_status = 'INFECTED' THEN 'TREAT_TREE'::etl_action
    ELSE 'TREAT_BLOCK'::etl_action
  END);

  -- Upsert health snapshot
  INSERT INTO tree_health_snapshots (
    tree_tag_id, field_id, user_id,
    health_status, last_scouted_at, last_pest_eppo, last_severity_score,
    total_observations, etl_action, risk_score, computed_at,
    infected_count, critical_count, season_year
  )
  VALUES (
    p_tree_tag_id, v_field_id, p_user_id,
    v_status, v_latest.scouted_at, v_latest.pest_eppo_code, v_max_sev,
    v_count, v_action, (v_max_sev * 20)::numeric, now(),
    CASE WHEN v_status IN ('INFECTED','CRITICAL') THEN 1 ELSE 0 END,
    CASE WHEN v_status = 'CRITICAL' THEN 1 ELSE 0 END,
    date_part('year', now())::integer
  )
  ON CONFLICT (tree_tag_id) DO UPDATE SET
    health_status        = EXCLUDED.health_status,
    last_scouted_at      = EXCLUDED.last_scouted_at,
    last_pest_eppo       = EXCLUDED.last_pest_eppo,
    last_severity_score  = EXCLUDED.last_severity_score,
    total_observations   = EXCLUDED.total_observations,
    etl_action           = EXCLUDED.etl_action,
    risk_score           = EXCLUDED.risk_score,
    computed_at          = now(),
    updated_at           = now(),
    infected_count       = tree_health_snapshots.infected_count
                           + CASE WHEN EXCLUDED.health_status IN ('INFECTED','CRITICAL') THEN 1 ELSE 0 END,
    critical_count       = tree_health_snapshots.critical_count
                           + CASE WHEN EXCLUDED.health_status = 'CRITICAL' THEN 1 ELSE 0 END;

  -- Also update tree_tags.health_status for quick map lookup
  UPDATE tree_tags SET
    health_status = v_status::text,
    updated_at    = now()
  WHERE id = p_tree_tag_id;

  -- Generate tree-level alert if action required
  IF v_action IN ('TREAT_TREE', 'TREAT_BLOCK', 'TREAT_ORCHARD') THEN
    INSERT INTO tree_scouting_alerts (
      user_id, field_id, tree_tag_id,
      alert_level, alert_status, severity,
      pest_eppo_code, pest_name, etl_action, message,
      triggered_by_obs_id, affected_tree_count
    )
    VALUES (
      p_user_id, v_field_id, p_tree_tag_id,
      'TREE', 'OPEN', v_status,
      v_latest.pest_eppo_code, v_latest.pest_name, v_action,
      format('Tree %s: %s detected (severity %s/5). Action: %s',
             p_tree_tag_id, v_latest.pest_name, v_max_sev, v_action),
      v_latest.id, 1
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Smart Escalation: if ≥ escalation_pct of block trees infected → BLOCK alert ──
  IF v_rule.escalation_pct IS NOT NULL THEN
    SELECT COUNT(*) INTO v_block_total
    FROM tree_tags WHERE field_id = v_field_id;

    SELECT COUNT(*) INTO v_block_infected
    FROM tree_health_snapshots
    WHERE field_id = v_field_id
      AND health_status IN ('INFECTED', 'CRITICAL');

    IF v_block_total > 0 THEN
      v_block_pct := (v_block_infected::numeric / v_block_total) * 100;
      IF v_block_pct >= v_rule.escalation_pct THEN
        INSERT INTO tree_scouting_alerts (
          user_id, field_id, tree_tag_id,
          alert_level, alert_status, severity,
          pest_eppo_code, pest_name, etl_action, message,
          triggered_by_obs_id, block_infected_pct, affected_tree_count
        )
        VALUES (
          p_user_id, v_field_id, NULL,
          'BLOCK', 'OPEN', 'CRITICAL',
          v_latest.pest_eppo_code, v_latest.pest_name, 'TREAT_BLOCK',
          format('BLOCK ALERT: %s%% of trees in block infected with %s. Block-level treatment required.',
                 round(v_block_pct, 1), v_latest.pest_name),
          v_latest.id, v_block_pct, v_block_infected
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- FUNCTION — batch_sync_scouting
--    Called from the mobile app on reconnect.
--    Accepts an array of observation JSON objects and upserts them idempotently.
-- ============================================================================
CREATE OR REPLACE FUNCTION batch_sync_scouting(
  p_user_id        uuid,
  p_observations   jsonb          -- array of observation objects
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obs           jsonb;
  v_id          uuid;
  v_synced      integer := 0;
  v_skipped     integer := 0;
  v_errors      jsonb := '[]'::jsonb;
BEGIN
  FOR obs IN SELECT * FROM jsonb_array_elements(p_observations)
  LOOP
    BEGIN
      INSERT INTO tree_scouting_observations (
        id, client_uuid, user_id,
        tree_tag_id, field_id, orchard_id,
        tree_variety, tree_row_number, tree_lat, tree_lng,
        scouted_by, scouted_at,
        gps_lat, gps_lng, gps_accuracy_m,
        bbch_stage, bbch_label,
        pest_eppo_code, pest_name, pest_category,
        pest_count, severity_score, affected_part,
        notes, sync_status, synced_at
      )
      VALUES (
        COALESCE((obs->>'id')::uuid, gen_random_uuid()),
        (obs->>'client_uuid')::uuid,
        p_user_id,
        (obs->>'tree_tag_id')::uuid,
        (obs->>'field_id')::uuid,
        (obs->>'orchard_id')::uuid,
        obs->>'tree_variety',
        (obs->>'tree_row_number')::integer,
        (obs->>'tree_lat')::numeric,
        (obs->>'tree_lng')::numeric,
        obs->>'scouted_by',
        COALESCE((obs->>'scouted_at')::timestamptz, now()),
        (obs->>'gps_lat')::numeric,
        (obs->>'gps_lng')::numeric,
        (obs->>'gps_accuracy_m')::numeric,
        (obs->>'bbch_stage')::integer,
        obs->>'bbch_label',
        obs->>'pest_eppo_code',
        COALESCE(obs->>'pest_name', 'Unknown'),
        COALESCE(obs->>'pest_category', 'PEST'),
        COALESCE((obs->>'pest_count')::numeric, 0),
        COALESCE((obs->>'severity_score')::integer, 0),
        COALESCE((obs->>'affected_part')::plant_part, 'LEAF'),
        obs->>'notes',
        'SYNCED',
        now()
      )
      ON CONFLICT (client_uuid) DO UPDATE SET
        sync_status = 'SYNCED',
        synced_at   = now();

      v_id := (obs->>'tree_tag_id')::uuid;
      PERFORM compute_tree_health(v_id, p_user_id);
      v_synced := v_synced + 1;

    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      v_errors  := v_errors || jsonb_build_object(
        'client_uuid', obs->>'client_uuid',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'synced',  v_synced,
    'skipped', v_skipped,
    'errors',  v_errors
  );
END;
$$;

-- ============================================================================
-- VIEW — tree_scouting_dashboard_view
--    Powers the web dashboard map and table.
-- ============================================================================
CREATE OR REPLACE VIEW tree_scouting_dashboard_view AS
SELECT
  tt.id                   AS tree_id,
  tt.name                 AS tree_name,
  tt.variety,
  tt.field_id,
  tt.row_number,
  tt.latitude,
  tt.longitude,
  f.name                  AS field_name,
  COALESCE(ths.health_status, 'HEALTHY'::tree_health_status) AS health_status,
  ths.last_scouted_at,
  ths.last_pest_eppo,
  ths.last_severity_score,
  ths.total_observations,
  ths.etl_action,
  ths.risk_score,
  ths.infected_count,
  ths.critical_count,
  ths.spray_action_count,
  -- Latest observation summary
  latest_obs.pest_name    AS latest_pest_name,
  latest_obs.bbch_label   AS latest_bbch,
  latest_obs.affected_part AS latest_affected_part,
  latest_obs.notes        AS latest_notes
FROM tree_tags tt
LEFT JOIN fields f              ON tt.field_id = f.id
LEFT JOIN tree_health_snapshots ths ON tt.id = ths.tree_tag_id
LEFT JOIN LATERAL (
  SELECT pest_name, bbch_label, affected_part, notes
  FROM tree_scouting_observations
  WHERE tree_tag_id = tt.id
  ORDER BY scouted_at DESC
  LIMIT 1
) latest_obs ON true;

-- ============================================================================
-- VIEW — block_health_summary
--    Aggregate health per field/block for escalation display.
-- ============================================================================
CREATE OR REPLACE VIEW block_health_summary AS
SELECT
  f.id                    AS field_id,
  f.name                  AS field_name,
  f.user_id,
  COUNT(tt.id)            AS total_trees,
  COUNT(ths.id)           AS scouted_trees,
  SUM(CASE WHEN ths.health_status = 'HEALTHY'  THEN 1 ELSE 0 END) AS healthy_count,
  SUM(CASE WHEN ths.health_status = 'STRESSED' THEN 1 ELSE 0 END) AS stressed_count,
  SUM(CASE WHEN ths.health_status = 'INFECTED' THEN 1 ELSE 0 END) AS infected_count,
  SUM(CASE WHEN ths.health_status = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
  ROUND(
    (SUM(CASE WHEN ths.health_status IN ('INFECTED','CRITICAL') THEN 1 ELSE 0 END)::numeric
     / NULLIF(COUNT(ths.id), 0)) * 100, 1
  )                       AS infected_pct,
  MAX(ths.last_scouted_at) AS last_scouted_at
FROM fields f
LEFT JOIN tree_tags tt          ON f.id = tt.field_id
LEFT JOIN tree_health_snapshots ths ON tt.id = ths.tree_tag_id
GROUP BY f.id, f.name, f.user_id;

-- ============================================================================
-- STORAGE BUCKET — scouting-photos
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('scouting-photos', 'scouting-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own scouting photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scouting-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own scouting photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'scouting-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SEED ETL RULES  (Apple orchard defaults — Kashmir region)
-- ============================================================================
INSERT INTO tree_etl_rules (rule_name, pest_eppo_code, variety_name, bbch_min, bbch_max,
                             pest_count_threshold, severity_threshold, action,
                             escalation_pct, description)
VALUES
  ('Apple Scab — Critical', 'VENTIN', NULL, 51, 75, 5, 3, 'TREAT_TREE', 20.0,
   'Venturia inaequalis: treat individual tree when severity ≥3; escalate block if 20% infected'),
  ('Apple Scab — Monitor', 'VENTIN', NULL, 51, 75, 2, 2, 'MONITOR', 20.0,
   'Venturia inaequalis: monitor when severity = 2'),
  ('Powdery Mildew — Treat', 'PODOCA', NULL, 53, 87, 3, 3, 'TREAT_TREE', 25.0,
   'Podosphaera leucotricha: treat when severity ≥3'),
  ('Codling Moth — Treat', 'LASPNI', NULL, 71, 87, 1, 2, 'TREAT_TREE', 15.0,
   'Cydia pomonella: 1 per trap/tree trigger'),
  ('Fire Blight — Escalate', 'ERWIAM', NULL, 55, 75, 1, 2, 'TREAT_BLOCK', 10.0,
   'Erwinia amylovora: immediately escalate — spreads rapidly');
   -- Add card_photo_url to tree_tags (no-op if already exists)
ALTER TABLE tree_tags
  ADD COLUMN IF NOT EXISTS card_photo_url text;

-- Optional: index for quick lookup of trees that have a card photo
CREATE INDEX IF NOT EXISTS idx_tree_tags_card_photo
  ON tree_tags(id)
  WHERE card_photo_url IS NOT NULL;
