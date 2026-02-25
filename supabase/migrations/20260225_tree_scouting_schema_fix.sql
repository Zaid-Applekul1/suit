/*
  # Tree Scouting Schema Fix — Missing Columns
  AppleKul™ Suite | Required by TreeScouting.tsx (Premium Edition v2)

  ## Problem
  TreeScouting.tsx reads and writes two columns on tree_scouting_observations
  that do NOT exist in the original 202602210065235_tree_scounting.sql:

    1. photo_url      text     — URL of the synced Supabase Storage photo for an observation
    2. ai_prediction  jsonb    — Rule-based AI prediction payload stored on sync

  Without these columns:
    • Synced observations lose their photo reference (photo_url always returns null)
    • AI prediction data is silently dropped on every batch_sync_scouting call
      (the function's INSERT list does not include it, so the value sent by the
       app is ignored even though Postgres would reject it as an unknown column
       in a direct INSERT).

  ## What this migration does
    1. Adds photo_url to tree_scouting_observations (safe no-op if it already exists)
    2. Adds ai_prediction to tree_scouting_observations (safe no-op if it already exists)
    3. Re-creates batch_sync_scouting to include BOTH new columns in the INSERT
       so AI predictions are actually persisted on sync.

  ## How to apply
  Run in Supabase SQL Editor → New Query (after all existing migrations are applied).
*/

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO tree_scouting_observations
-- ============================================================================

-- photo_url: stores the Supabase Storage URL of the observation photo
-- after the mobile app uploads the base64 image on sync.
ALTER TABLE tree_scouting_observations
  ADD COLUMN IF NOT EXISTS photo_url text;

-- ai_prediction: JSONB blob containing the rule-based AI prediction output
-- generated client-side (predictedHealth, confidence, riskScore, topRisks,
-- recommendation, reasoning, spreadRisk). Stored as-is for audit / display.
ALTER TABLE tree_scouting_observations
  ADD COLUMN IF NOT EXISTS ai_prediction jsonb;

-- ============================================================================
-- 2. RE-CREATE batch_sync_scouting TO INCLUDE THE NEW COLUMNS
--    (DROP + CREATE OR REPLACE because the INSERT column list must change)
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
        notes,
        photo_url,       -- NEW: observation photo URL (uploaded to scouting-photos bucket)
        ai_prediction,   -- NEW: client-side AI prediction payload (jsonb)
        sync_status, synced_at
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
        obs->>'photo_url',                        -- NEW
        obs->'ai_prediction',                     -- NEW (use -> not ->> to keep as jsonb)
        'SYNCED',
        now()
      )
      ON CONFLICT (client_uuid) DO UPDATE SET
        sync_status   = 'SYNCED',
        synced_at     = now(),
        photo_url     = COALESCE(EXCLUDED.photo_url, tree_scouting_observations.photo_url),
        ai_prediction = COALESCE(EXCLUDED.ai_prediction, tree_scouting_observations.ai_prediction);

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
