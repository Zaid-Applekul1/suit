/*
  # Tree Scouting — Activities & Production Storage
  AppleKul™ Suite | TreeScouting.tsx Premium Edition v2

  ## Problem
  The ScoutingForm has two tabs — "Activities" and "Production" — that collect
  data via ActivitiesForm and ProductionForm components.  The state is captured
  in the ScoutingForm component but is NEVER included in the saved observation
  or the batch_sync_scouting payload.  This migration:

    1. Creates tree_scouting_activities   — one row per activity entry per observation
    2. Creates tree_scouting_production   — one row per production entry per observation
    3. Re-creates batch_sync_scouting     — now accepts and persists activities[] and
                                           production[] arrays in addition to the
                                           previously-added photo_url and ai_prediction

  ## Fields from ActivitiesForm (ActivityEntry interface)
    date, type, product, quantity, notes

  ## Fields from ProductionForm (ProductionEntry interface)
    date, fruit_size, color_pct, estimated_yield_kg, quality_grade, notes

  ## How to apply
  Run in Supabase SQL Editor AFTER the existing migrations:
    1. 20260220065234_quiet_sound.sql      (base schema)
    2. 202602210065235_tree_scounting.sql  (scouting module)
    3. 20260225_tree_scouting_schema_fix.sql (photo_url + ai_prediction columns)
    4. THIS FILE
*/

-- ============================================================================
-- 1. TREE SCOUTING ACTIVITIES
--    Mirrors ActivityEntry interface in TreeScouting.tsx
--    One observation → many activity rows (sprays, pruning, irrigation etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tree_scouting_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the parent observation (FK with cascade delete)
  observation_id   uuid REFERENCES tree_scouting_observations(id) ON DELETE CASCADE NOT NULL,

  -- Ownership (denormalised for fast RLS + queries)
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tree_tag_id      uuid REFERENCES tree_tags(id)  ON DELETE CASCADE NOT NULL,
  field_id         uuid REFERENCES fields(id)     ON DELETE CASCADE NOT NULL,

  -- ActivityEntry fields (from ActivitiesForm)
  activity_date    date,                          -- 'date' field in ActivityEntry
  activity_type    text,                          -- 'type': Pruning, Irrigation, Spray, etc.
  product          text,                          -- product / chemical name
  quantity         text,                          -- quantity + unit as free text (e.g. "500ml")
  notes            text,                          -- activity-specific notes

  created_at       timestamptz DEFAULT now()
);

ALTER TABLE tree_scouting_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scouting activities"
  ON tree_scouting_activities FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can read scouting activities"
  ON tree_scouting_activities FOR SELECT TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tsact_observation_id ON tree_scouting_activities(observation_id);
CREATE INDEX IF NOT EXISTS idx_tsact_tree_tag_id    ON tree_scouting_activities(tree_tag_id);
CREATE INDEX IF NOT EXISTS idx_tsact_field_id       ON tree_scouting_activities(field_id);
CREATE INDEX IF NOT EXISTS idx_tsact_user_id        ON tree_scouting_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_tsact_activity_date  ON tree_scouting_activities(activity_date DESC);

-- ============================================================================
-- 2. TREE SCOUTING PRODUCTION
--    Mirrors ProductionEntry interface in TreeScouting.tsx
--    One observation → many production entries (snapshot of fruit status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tree_scouting_production (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the parent observation
  observation_id       uuid REFERENCES tree_scouting_observations(id) ON DELETE CASCADE NOT NULL,

  -- Ownership
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tree_tag_id          uuid REFERENCES tree_tags(id)  ON DELETE CASCADE NOT NULL,
  field_id             uuid REFERENCES fields(id)     ON DELETE CASCADE NOT NULL,

  -- ProductionEntry fields (from ProductionForm)
  production_date      date,                          -- 'date' field
  fruit_size           text,                          -- 'fruitSize' e.g. "60mm", "Small", "Large"
  color_pct            numeric,                       -- 'colorPct' % colour development (0–100)
  estimated_yield_kg   numeric,                       -- 'estimatedYieldKg' per tree
  quality_grade        text,                          -- 'qualityGrade': Grade A/B/C/Export/Culls
  notes                text,                          -- production-specific notes

  created_at           timestamptz DEFAULT now()
);

ALTER TABLE tree_scouting_production ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scouting production"
  ON tree_scouting_production FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can read scouting production"
  ON tree_scouting_production FOR SELECT TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tsprod_observation_id   ON tree_scouting_production(observation_id);
CREATE INDEX IF NOT EXISTS idx_tsprod_tree_tag_id      ON tree_scouting_production(tree_tag_id);
CREATE INDEX IF NOT EXISTS idx_tsprod_field_id         ON tree_scouting_production(field_id);
CREATE INDEX IF NOT EXISTS idx_tsprod_user_id          ON tree_scouting_production(user_id);
CREATE INDEX IF NOT EXISTS idx_tsprod_production_date  ON tree_scouting_production(production_date DESC);

-- ============================================================================
-- 3. RE-CREATE batch_sync_scouting
--    Extends the existing function to:
--      a) persist photo_url + ai_prediction (from previous fix migration)
--      b) INSERT rows into tree_scouting_activities  for each entry in p_observations[].activities
--      c) INSERT rows into tree_scouting_production  for each entry in p_observations[].production
--
--    The mobile app must include `activities` and `production` arrays in each
--    observation object of the p_observations JSONB array, e.g.:
--
--    {
--      "id": "...", "client_uuid": "...", "tree_tag_id": "...",
--      ...existing fields...,
--      "photo_url": null,
--      "ai_prediction": { ... },
--      "activities": [
--        { "date": "2026-02-25", "type": "Pruning", "product": "", "quantity": "", "notes": "..." }
--      ],
--      "production": [
--        { "date": "2026-02-25", "fruitSize": "60mm", "colorPct": "75",
--          "estimatedYieldKg": "12", "qualityGrade": "Grade A", "notes": "" }
--      ]
--    }
-- ============================================================================

CREATE OR REPLACE FUNCTION batch_sync_scouting(
  p_user_id        uuid,
  p_observations   jsonb          -- array of observation objects from the mobile app
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obs           jsonb;
  act           jsonb;
  prod          jsonb;
  v_obs_id      uuid;
  v_tree_id     uuid;
  v_field_id    uuid;
  v_synced      integer := 0;
  v_skipped     integer := 0;
  v_errors      jsonb := '[]'::jsonb;
BEGIN
  FOR obs IN SELECT * FROM jsonb_array_elements(p_observations)
  LOOP
    BEGIN
      -- ── Upsert the core observation ──────────────────────────────────────
      v_obs_id   := COALESCE((obs->>'id')::uuid, gen_random_uuid());
      v_tree_id  := (obs->>'tree_tag_id')::uuid;
      v_field_id := (obs->>'field_id')::uuid;

      INSERT INTO tree_scouting_observations (
        id, client_uuid, user_id,
        tree_tag_id, field_id, orchard_id,
        tree_variety, tree_row_number, tree_lat, tree_lng,
        scouted_by, scouted_at,
        gps_lat, gps_lng, gps_accuracy_m,
        bbch_stage, bbch_label,
        pest_eppo_code, pest_name, pest_category,
        pest_count, severity_score, affected_part,
        notes,
        photo_url,
        ai_prediction,
        sync_status, synced_at
      )
      VALUES (
        v_obs_id,
        (obs->>'client_uuid')::uuid,
        p_user_id,
        v_tree_id,
        v_field_id,
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
        obs->>'photo_url',
        obs->'ai_prediction',
        'SYNCED',
        now()
      )
      ON CONFLICT (client_uuid) DO UPDATE SET
        sync_status   = 'SYNCED',
        synced_at     = now(),
        photo_url     = COALESCE(EXCLUDED.photo_url,     tree_scouting_observations.photo_url),
        ai_prediction = COALESCE(EXCLUDED.ai_prediction, tree_scouting_observations.ai_prediction);

      -- Resolve the actual inserted/updated observation id
      SELECT id INTO v_obs_id
      FROM tree_scouting_observations
      WHERE client_uuid = (obs->>'client_uuid')::uuid;

      -- ── Activities — delete old rows then re-insert from payload ─────────
      -- (idempotent: on re-sync we replace the activity rows for this observation)
      IF obs->'activities' IS NOT NULL AND jsonb_array_length(obs->'activities') > 0 THEN
        DELETE FROM tree_scouting_activities WHERE observation_id = v_obs_id;

        FOR act IN SELECT * FROM jsonb_array_elements(obs->'activities')
        LOOP
          -- Skip empty rows (no type set)
          CONTINUE WHEN COALESCE(act->>'type', '') = '';

          INSERT INTO tree_scouting_activities (
            observation_id, user_id, tree_tag_id, field_id,
            activity_date, activity_type, product, quantity, notes
          )
          VALUES (
            v_obs_id,
            p_user_id,
            v_tree_id,
            v_field_id,
            CASE WHEN act->>'date' IS NOT NULL AND act->>'date' <> ''
                 THEN (act->>'date')::date ELSE CURRENT_DATE END,
            act->>'type',
            NULLIF(act->>'product',  ''),
            NULLIF(act->>'quantity', ''),
            NULLIF(act->>'notes',    '')
          );
        END LOOP;
      END IF;

      -- ── Production — delete old rows then re-insert from payload ─────────
      IF obs->'production' IS NOT NULL AND jsonb_array_length(obs->'production') > 0 THEN
        DELETE FROM tree_scouting_production WHERE observation_id = v_obs_id;

        FOR prod IN SELECT * FROM jsonb_array_elements(obs->'production')
        LOOP
          -- Skip empty rows (no quality grade and no yield set)
          CONTINUE WHEN COALESCE(prod->>'qualityGrade', '') = ''
                    AND COALESCE(prod->>'estimatedYieldKg', '') = '';

          INSERT INTO tree_scouting_production (
            observation_id, user_id, tree_tag_id, field_id,
            production_date, fruit_size, color_pct, estimated_yield_kg, quality_grade, notes
          )
          VALUES (
            v_obs_id,
            p_user_id,
            v_tree_id,
            v_field_id,
            CASE WHEN prod->>'date' IS NOT NULL AND prod->>'date' <> ''
                 THEN (prod->>'date')::date ELSE CURRENT_DATE END,
            NULLIF(prod->>'fruitSize',        ''),
            CASE WHEN prod->>'colorPct' IS NOT NULL AND prod->>'colorPct' <> ''
                 THEN (prod->>'colorPct')::numeric ELSE NULL END,
            CASE WHEN prod->>'estimatedYieldKg' IS NOT NULL AND prod->>'estimatedYieldKg' <> ''
                 THEN (prod->>'estimatedYieldKg')::numeric ELSE NULL END,
            NULLIF(prod->>'qualityGrade', ''),
            NULLIF(prod->>'notes',        '')
          );
        END LOOP;
      END IF;

      -- ── Run ETL health computation for this tree ─────────────────────────
      PERFORM compute_tree_health(v_tree_id, p_user_id);
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
