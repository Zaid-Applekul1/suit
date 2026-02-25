/*
  # Calendar Activities Table — AppleKul™ Suite
  Migration: calendar_activities

  Run AFTER quiet_sound.sql (the base schema).
  This file is idempotent — safe to re-run.

  ## What it creates:
  - `calendar_activities` table (user-planned activities for the calendar)
  - RLS policy  (same pattern as the rest of the suite)
  - updated_at trigger (reuses existing update_updated_at_column() function)
  - Performance indexes

  ## Relationship to existing schema:
  - Optionally linked to `fields(id)`  → field_id (nullable FK)
  - Optionally linked to `tasks(id)`   → task_id  (nullable FK, for promoting
                                                    a calendar item into a task)
  - user_id → auth.users(id)           (standard ownership pattern)

  NOTE: The `activities` table that already exists in quiet_sound.sql is an
  internal audit/activity-feed log (kind ∈ success/warning/info/error).
  This table is DIFFERENT — it is the user-facing orchard calendar planner.
*/

-- ============================================================================
-- TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_activities (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (standard suite pattern)
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional field link (growers plan activities per field)
  field_id       uuid        REFERENCES fields(id) ON DELETE SET NULL,

  -- Optional task promotion (calendar item → tasks table)
  task_id        uuid        REFERENCES tasks(id)  ON DELETE SET NULL,

  -- Core calendar data
  date           date        NOT NULL,
  type           text        NOT NULL CHECK (type IN (
                               'tree_scouting',
                               'soil_test',
                               'water_test',
                               'orchard_doctor',
                               'spray',
                               'irrigation',
                               'pruning',
                               'harvesting',
                               'fertilizer',
                               'other'
                             )),
  title          text        NOT NULL,
  notes          text        NOT NULL DEFAULT '',
  completed      boolean     NOT NULL DEFAULT false,
  completed_at   timestamptz,                         -- set when completed = true

  -- Which app module this activity links to
  linked_module  text        CHECK (linked_module IN (
                               'TreeScouting',
                               'SoilTestAdvisory',
                               'OrchardDoctor',
                               'SkuastAdvisory',
                               'Fields',
                               NULL
                             )),

  -- Audit
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Follows the exact same pattern used throughout quiet_sound.sql:
--   FOR ALL TO authenticated USING (auth.uid() = user_id)
-- ============================================================================
ALTER TABLE calendar_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own calendar activities" ON calendar_activities;
CREATE POLICY "Users can manage own calendar activities"
  ON calendar_activities
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER — updated_at
-- Reuses update_updated_at_column() created in quiet_sound.sql.
-- Do NOT redefine the function here.
-- ============================================================================
DROP TRIGGER IF EXISTS update_calendar_activities_updated_at ON calendar_activities;
CREATE TRIGGER update_calendar_activities_updated_at
  BEFORE UPDATE ON calendar_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-STAMP completed_at WHEN completed FLIPS TO TRUE
-- ============================================================================
CREATE OR REPLACE FUNCTION stamp_calendar_activity_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    NEW.completed_at := now();
  ELSIF NEW.completed = false THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendar_activity_completed ON calendar_activities;
CREATE TRIGGER trg_calendar_activity_completed
  BEFORE UPDATE ON calendar_activities
  FOR EACH ROW EXECUTE FUNCTION stamp_calendar_activity_completed();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast per-user calendar queries
CREATE INDEX IF NOT EXISTS idx_calendar_activities_user_date
  ON calendar_activities (user_id, date);

-- Fast field-scoped queries (e.g. "what's planned for Field X this month?")
CREATE INDEX IF NOT EXISTS idx_calendar_activities_field_id
  ON calendar_activities (field_id)
  WHERE field_id IS NOT NULL;

-- Pending items only (for "upcoming" sidebar)
CREATE INDEX IF NOT EXISTS idx_calendar_activities_pending
  ON calendar_activities (user_id, date)
  WHERE completed = false;

-- Type-based queries (e.g. all spray events this season)
CREATE INDEX IF NOT EXISTS idx_calendar_activities_type
  ON calendar_activities (user_id, type);

-- ============================================================================
-- ADD TO DROP SCRIPT
-- Copy-paste these lines into drop-query.sql (STEP 1 triggers / STEP 3 functions
-- / STEP 4 RLS / STEP 6 tables) when you next need a fresh reset:
--
--   DROP TRIGGER IF EXISTS update_calendar_activities_updated_at ON calendar_activities;
--   DROP TRIGGER IF EXISTS trg_calendar_activity_completed        ON calendar_activities;
--   DROP FUNCTION IF EXISTS stamp_calendar_activity_completed()   CASCADE;
--   DROP POLICY  IF EXISTS "Users can manage own calendar activities" ON calendar_activities;
--   DROP TABLE   IF EXISTS calendar_activities CASCADE;
-- ============================================================================
