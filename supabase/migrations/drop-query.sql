-- ============================================================================
-- FULL DROP QUERY — AppleKul™ Suite (Fresh Start) — SAFE VERSION
-- Every statement uses IF EXISTS. Extensions dropped last to avoid
-- dependency conflicts. Storage bucket delete is wrapped safely.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_tree_scouting_observations_updated_at ON tree_scouting_observations;
DROP TRIGGER IF EXISTS update_tree_health_snapshots_updated_at      ON tree_health_snapshots;
DROP TRIGGER IF EXISTS update_tree_etl_rules_updated_at             ON tree_etl_rules;
DROP TRIGGER IF EXISTS update_tree_scouting_alerts_updated_at       ON tree_scouting_alerts;
DROP TRIGGER IF EXISTS update_tree_spray_actions_updated_at         ON tree_spray_actions;

DROP TRIGGER IF EXISTS update_water_test_results_updated_at ON water_test_results;

DROP TRIGGER IF EXISTS update_profiles_updated_at           ON profiles;
DROP TRIGGER IF EXISTS update_fields_updated_at             ON fields;
DROP TRIGGER IF EXISTS update_tree_tags_updated_at          ON tree_tags;
DROP TRIGGER IF EXISTS update_orchard_varieties_updated_at  ON orchard_varieties;
DROP TRIGGER IF EXISTS update_production_records_updated_at ON production_records;
DROP TRIGGER IF EXISTS update_soil_test_results_updated_at  ON soil_test_results;
DROP TRIGGER IF EXISTS update_tasks_updated_at              ON tasks;
DROP TRIGGER IF EXISTS update_expenses_updated_at           ON expenses;
DROP TRIGGER IF EXISTS update_harvests_updated_at           ON harvests;
DROP TRIGGER IF EXISTS update_doctors_updated_at            ON doctors;

DROP TRIGGER IF EXISTS set_consultation_user_id_trigger ON consultations;

-- ============================================================================
-- STEP 2: DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS tree_scouting_dashboard_view CASCADE;
DROP VIEW IF EXISTS block_health_summary            CASCADE;
DROP VIEW IF EXISTS field_analytics_view            CASCADE;
DROP VIEW IF EXISTS field_summary                   CASCADE;

-- ============================================================================
-- STEP 3: DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS batch_sync_scouting(uuid, jsonb)  CASCADE;
DROP FUNCTION IF EXISTS compute_tree_health(uuid, uuid)   CASCADE;
DROP FUNCTION IF EXISTS get_doctor_id_for_user(uuid)      CASCADE;
DROP FUNCTION IF EXISTS calculate_field_stats(uuid)       CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column()        CASCADE;
DROP FUNCTION IF EXISTS set_consultation_user_id()        CASCADE;

-- ============================================================================
-- STEP 4: DROP RLS POLICIES ON TABLES (if any were created)
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- fields
DROP POLICY IF EXISTS "Users can view own fields"   ON fields;
DROP POLICY IF EXISTS "Users can insert own fields" ON fields;
DROP POLICY IF EXISTS "Users can update own fields" ON fields;
DROP POLICY IF EXISTS "Users can delete own fields" ON fields;

-- doctors
DROP POLICY IF EXISTS "Doctors can view their own record" ON doctors;

-- ============================================================================
-- STEP 5: DROP STORAGE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users upload own scouting photos"     ON storage.objects;
DROP POLICY IF EXISTS "Users read own scouting photos"       ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Field images are publicly accessible"  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload field images"         ON storage.objects;
DROP POLICY IF EXISTS "Harvest images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload harvest images"        ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own receipts"    ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own receipts"    ON storage.objects;
DROP POLICY IF EXISTS "Chemical images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chemical images"        ON storage.objects;

-- ============================================================================
-- STEP 6: DROP TABLES (children before parents)
-- ============================================================================

DROP TABLE IF EXISTS tree_spray_actions          CASCADE;
DROP TABLE IF EXISTS tree_scouting_alerts        CASCADE;
DROP TABLE IF EXISTS tree_etl_rules              CASCADE;
DROP TABLE IF EXISTS tree_health_snapshots       CASCADE;
DROP TABLE IF EXISTS tree_scouting_photos        CASCADE;
DROP TABLE IF EXISTS tree_scouting_observations  CASCADE;

DROP TABLE IF EXISTS water_test_results          CASCADE;

DROP TABLE IF EXISTS doctors                     CASCADE;

DROP TABLE IF EXISTS prescription_action_items   CASCADE;
DROP TABLE IF EXISTS prescriptions               CASCADE;
DROP TABLE IF EXISTS consultations               CASCADE;

DROP TABLE IF EXISTS spray_chemicals             CASCADE;
DROP TABLE IF EXISTS sprays                      CASCADE;
DROP TABLE IF EXISTS activity_expenses           CASCADE;
DROP TABLE IF EXISTS labour_workers              CASCADE;
DROP TABLE IF EXISTS income_entries              CASCADE;

DROP TABLE IF EXISTS field_analytics             CASCADE;
DROP TABLE IF EXISTS harvests                    CASCADE;
DROP TABLE IF EXISTS expenses                    CASCADE;
DROP TABLE IF EXISTS tasks                       CASCADE;
DROP TABLE IF EXISTS notifications               CASCADE;
DROP TABLE IF EXISTS weather_data                CASCADE;
DROP TABLE IF EXISTS activities                  CASCADE;
DROP TABLE IF EXISTS soil_test_results           CASCADE;
DROP TABLE IF EXISTS production_records          CASCADE;

DROP TABLE IF EXISTS orchard_varieties           CASCADE;
DROP TABLE IF EXISTS tree_tags                   CASCADE;
DROP TABLE IF EXISTS fields                      CASCADE;
DROP TABLE IF EXISTS profiles                    CASCADE;

-- ============================================================================
-- STEP 7: DROP ENUM TYPES
-- ============================================================================

DROP TYPE IF EXISTS etl_action           CASCADE;
DROP TYPE IF EXISTS plant_part           CASCADE;
DROP TYPE IF EXISTS alert_status         CASCADE;
DROP TYPE IF EXISTS alert_level          CASCADE;
DROP TYPE IF EXISTS scouting_sync_status CASCADE;
DROP TYPE IF EXISTS tree_health_status   CASCADE;

-- ============================================================================
-- STEP 8: DROP EXTENSIONS (last — after all dependent objects are gone)
-- ============================================================================

DROP EXTENSION IF EXISTS postgis     CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================================================
-- STEP 9: DELETE STORAGE BUCKETS (safe — DELETE ignores missing rows)
-- ============================================================================

DELETE FROM storage.buckets
WHERE id IN (
  'scouting-photos',
  'avatars',
  'field-images',
  'harvest-images',
  'receipts',
  'chemical-images'
);

-- ============================================================================
-- Done. Database is now fully clean. Re-run your migration files in order:
--   1. quiet_sound.sql              (base schema)
--   2. doctor_reg.sql               (doctors table)
--   3. rbac_doctor_access.sql       (RBAC policies)
--   4. doctor_field_access.sql      (doctor field/tree RLS)
--   5. water_test_v2.sql            (water test results)
--   6. tree_scouting.sql            (tree scouting module)
-- ============================================================================
