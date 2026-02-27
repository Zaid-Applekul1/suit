-- ============================================================
-- COMPREHENSIVE DROP QUERY
-- Generated: 2026-02-27
-- Drops all database objects from migrations
-- ============================================================
-- This script safely removes all database objects in the correct
-- dependency order to avoid foreign key constraint violations.
-- All statements use IF EXISTS for safe execution.
-- ============================================================

-- ============================================================
-- DROP POLICIES
-- ============================================================
-- Note: RLS policies are automatically dropped when tables are
-- dropped with CASCADE, but we list them here for completeness.

-- Team Management Policies
DROP POLICY IF EXISTS "Owners can manage their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can accept invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can manage their team members" ON team_members;
DROP POLICY IF EXISTS "Members can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Owners can manage field access" ON team_field_access;
DROP POLICY IF EXISTS "Members can view their field access" ON team_field_access;
DROP POLICY IF EXISTS "Team members can read accessible fields" ON fields;
DROP POLICY IF EXISTS "Team members can update accessible fields" ON fields;
DROP POLICY IF EXISTS "Team members can read tree tags for accessible fields" ON tree_tags;
DROP POLICY IF EXISTS "Team members can insert tree tags for accessible fields" ON tree_tags;
DROP POLICY IF EXISTS "Team members can update tree tags for accessible fields" ON tree_tags;
DROP POLICY IF EXISTS "Team members can delete tree tags for accessible fields" ON tree_tags;

-- Tree Scouting Policies
DROP POLICY IF EXISTS "Users manage own scouting observations" ON tree_scouting_observations;
DROP POLICY IF EXISTS "Doctors can read all scouting observations" ON tree_scouting_observations;
DROP POLICY IF EXISTS "Users manage own scouting photos" ON tree_scouting_photos;
DROP POLICY IF EXISTS "Users manage own health snapshots" ON tree_health_snapshots;
DROP POLICY IF EXISTS "Doctors can read health snapshots" ON tree_health_snapshots;
DROP POLICY IF EXISTS "Authenticated users read ETL rules" ON tree_etl_rules;
DROP POLICY IF EXISTS "Users manage own scouting alerts" ON tree_scouting_alerts;
DROP POLICY IF EXISTS "Users manage own spray actions" ON tree_spray_actions;
DROP POLICY IF EXISTS "Users manage own scouting activities" ON tree_scouting_activities;
DROP POLICY IF EXISTS "Doctors can read scouting activities" ON tree_scouting_activities;
DROP POLICY IF EXISTS "Users manage own scouting production" ON tree_scouting_production;
DROP POLICY IF EXISTS "Doctors can read scouting production" ON tree_scouting_production;

-- Water Test Policies
DROP POLICY IF EXISTS "Users can manage own water test results" ON water_test_results;

-- Doctor Policies
DROP POLICY IF EXISTS "Authenticated users can read doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can delete own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can view their own record" ON doctors;

-- Doctor Access Policies
DROP POLICY IF EXISTS "Growers can read own consultations" ON consultations;
DROP POLICY IF EXISTS "Growers can insert own consultations" ON consultations;
DROP POLICY IF EXISTS "Growers can update own consultations" ON consultations;
DROP POLICY IF EXISTS "Growers can delete own consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can read assigned consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can update assigned consultation status" ON consultations;
DROP POLICY IF EXISTS "Users can read own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can delete own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can manage own consultations" ON consultations;

-- Prescription Policies
DROP POLICY IF EXISTS "Anyone can manage prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Growers can read own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can read prescriptions for assigned consultations" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can insert prescriptions for assigned consultations" ON prescriptions;
DROP POLICY IF EXISTS "Authenticated can update prescription status" ON prescriptions;

-- Prescription Action Item Policies
DROP POLICY IF EXISTS "Anyone can manage prescription action items" ON prescription_action_items;
DROP POLICY IF EXISTS "Access prescription action items via prescription" ON prescription_action_items;

-- Doctor Field Access Policies
DROP POLICY IF EXISTS "Doctors can read fields of their patients" ON fields;
DROP POLICY IF EXISTS "Doctors can read tree tags of their patients' fields" ON tree_tags;
DROP POLICY IF EXISTS "Doctors can read orchard varieties of their patients' fields" ON orchard_varieties;

-- Calendar Activities Policies
DROP POLICY IF EXISTS "Users can manage own calendar activities" ON calendar_activities;

-- Base Schema Policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own fields" ON fields;
DROP POLICY IF EXISTS "Users can view own fields" ON fields;
DROP POLICY IF EXISTS "Users can insert own fields" ON fields;
DROP POLICY IF EXISTS "Users can update own fields" ON fields;
DROP POLICY IF EXISTS "Users can delete own fields" ON fields;
DROP POLICY IF EXISTS "Users can manage own tree tags" ON tree_tags;
DROP POLICY IF EXISTS "Users can manage own orchard varieties" ON orchard_varieties;
DROP POLICY IF EXISTS "Users can manage own production records" ON production_records;
DROP POLICY IF EXISTS "Users can manage own soil test results" ON soil_test_results;
DROP POLICY IF EXISTS "Users can manage own activities" ON activities;
DROP POLICY IF EXISTS "Users can manage own weather data" ON weather_data;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own harvests" ON harvests;
DROP POLICY IF EXISTS "Users can manage own field analytics" ON field_analytics;
DROP POLICY IF EXISTS "Anyone can manage sprays" ON sprays;
DROP POLICY IF EXISTS "Anyone can manage spray chemicals" ON spray_chemicals;
DROP POLICY IF EXISTS "Anyone can manage activity expenses" ON activity_expenses;
DROP POLICY IF EXISTS "Anyone can manage labour workers" ON labour_workers;
DROP POLICY IF EXISTS "Anyone can manage income entries" ON income_entries;

-- ============================================================
-- DROP STORAGE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users upload own scouting photos" ON storage.objects;
DROP POLICY IF EXISTS "Users read own scouting photos" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Field images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload field images" ON storage.objects;
DROP POLICY IF EXISTS "Harvest images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload harvest images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Chemical images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chemical images" ON storage.objects;

-- ============================================================
-- DROP TRIGGERS
-- ============================================================

-- Team Management Triggers
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

-- Tree Scouting Triggers
DROP TRIGGER IF EXISTS update_tree_scouting_observations_updated_at ON tree_scouting_observations;
DROP TRIGGER IF EXISTS update_tree_health_snapshots_updated_at ON tree_health_snapshots;
DROP TRIGGER IF EXISTS update_tree_etl_rules_updated_at ON tree_etl_rules;
DROP TRIGGER IF EXISTS update_tree_scouting_alerts_updated_at ON tree_scouting_alerts;
DROP TRIGGER IF EXISTS update_tree_spray_actions_updated_at ON tree_spray_actions;

-- Water Test Triggers
DROP TRIGGER IF EXISTS update_water_test_results_updated_at ON water_test_results;

-- Calendar Activities Triggers
DROP TRIGGER IF EXISTS update_calendar_activities_updated_at ON calendar_activities;
DROP TRIGGER IF EXISTS trg_calendar_activity_completed ON calendar_activities;

-- Doctor Triggers
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;

-- Consultation Triggers
DROP TRIGGER IF EXISTS set_consultation_user_id_trigger ON consultations;

-- Base Schema Triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_fields_updated_at ON fields;
DROP TRIGGER IF EXISTS update_tree_tags_updated_at ON tree_tags;
DROP TRIGGER IF EXISTS update_orchard_varieties_updated_at ON orchard_varieties;
DROP TRIGGER IF EXISTS update_production_records_updated_at ON production_records;
DROP TRIGGER IF EXISTS update_soil_test_results_updated_at ON soil_test_results;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_harvests_updated_at ON harvests;

-- ============================================================
-- DROP VIEWS
-- ============================================================

DROP VIEW IF EXISTS team_members_with_profiles CASCADE;
DROP VIEW IF EXISTS pending_team_invitations CASCADE;
DROP VIEW IF EXISTS tree_scouting_dashboard_view CASCADE;
DROP VIEW IF EXISTS block_health_summary CASCADE;
DROP VIEW IF EXISTS field_analytics_view CASCADE;
DROP VIEW IF EXISTS field_summary CASCADE;

-- ============================================================
-- DROP FUNCTIONS
-- ============================================================

-- Team Management Functions
DROP FUNCTION IF EXISTS generate_invitation_token() CASCADE;
DROP FUNCTION IF EXISTS user_has_field_access(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS accept_team_invitation(uuid, uuid) CASCADE;

-- Tree Scouting Functions
DROP FUNCTION IF EXISTS batch_sync_scouting(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS compute_tree_health(uuid, uuid) CASCADE;

-- Calendar Activities Functions
DROP FUNCTION IF EXISTS stamp_calendar_activity_completed() CASCADE;

-- Doctor Functions
DROP FUNCTION IF EXISTS get_doctor_id_for_user(uuid) CASCADE;

-- Consultation Functions
DROP FUNCTION IF EXISTS set_consultation_user_id() CASCADE;

-- Base Schema Functions
DROP FUNCTION IF EXISTS calculate_field_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================
-- DROP TABLES (in correct dependency order)
-- ============================================================

-- Team Management Tables (drop in dependency order)
DROP TABLE IF EXISTS team_field_access CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;

-- Tree Scouting Tables (drop in dependency order)
DROP TABLE IF EXISTS tree_scouting_production CASCADE;
DROP TABLE IF EXISTS tree_scouting_activities CASCADE;
DROP TABLE IF EXISTS tree_spray_actions CASCADE;
DROP TABLE IF EXISTS tree_scouting_alerts CASCADE;
DROP TABLE IF EXISTS tree_etl_rules CASCADE;
DROP TABLE IF EXISTS tree_health_snapshots CASCADE;
DROP TABLE IF EXISTS tree_scouting_photos CASCADE;
DROP TABLE IF EXISTS tree_scouting_observations CASCADE;

-- Water Test Tables
DROP TABLE IF EXISTS water_test_results CASCADE;

-- Calendar Activities Tables
DROP TABLE IF EXISTS calendar_activities CASCADE;

-- Doctor Tables
DROP TABLE IF EXISTS doctors CASCADE;

-- Consultation Tables (drop in dependency order)
DROP TABLE IF EXISTS prescription_action_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;

-- Financial Ledger Tables
DROP TABLE IF EXISTS spray_chemicals CASCADE;
DROP TABLE IF EXISTS sprays CASCADE;
DROP TABLE IF EXISTS activity_expenses CASCADE;
DROP TABLE IF EXISTS labour_workers CASCADE;
DROP TABLE IF EXISTS income_entries CASCADE;

-- Base Schema Tables (drop in dependency order - children before parents)
DROP TABLE IF EXISTS field_analytics CASCADE;
DROP TABLE IF EXISTS harvests CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS weather_data CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS soil_test_results CASCADE;
DROP TABLE IF EXISTS production_records CASCADE;
DROP TABLE IF EXISTS orchard_varieties CASCADE;
DROP TABLE IF EXISTS tree_tags CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- DROP ENUM TYPES
-- ============================================================

-- Tree Scouting Enums
DROP TYPE IF EXISTS etl_action CASCADE;
DROP TYPE IF EXISTS plant_part CASCADE;
DROP TYPE IF EXISTS alert_status CASCADE;
DROP TYPE IF EXISTS alert_level CASCADE;
DROP TYPE IF EXISTS scouting_sync_status CASCADE;
DROP TYPE IF EXISTS tree_health_status CASCADE;

-- ============================================================
-- DROP INDEXES
-- ============================================================
-- Note: Indexes are automatically dropped when tables are dropped,
-- but we list them here for documentation purposes.

-- Team Management Indexes
-- DROP INDEX IF EXISTS idx_team_invitations_owner_id;
-- DROP INDEX IF EXISTS idx_team_invitations_invitee_email;
-- DROP INDEX IF EXISTS idx_team_invitations_token;
-- DROP INDEX IF EXISTS idx_team_invitations_status;
-- DROP INDEX IF EXISTS idx_team_members_owner_id;
-- DROP INDEX IF EXISTS idx_team_members_member_id;
-- DROP INDEX IF EXISTS idx_team_members_role;
-- DROP INDEX IF EXISTS idx_team_members_status;
-- DROP INDEX IF EXISTS idx_team_field_access_team_member;
-- DROP INDEX IF EXISTS idx_team_field_access_field;

-- Tree Scouting Indexes
-- DROP INDEX IF EXISTS idx_tsact_observation_id;
-- DROP INDEX IF EXISTS idx_tsact_tree_tag_id;
-- DROP INDEX IF EXISTS idx_tsact_field_id;
-- DROP INDEX IF EXISTS idx_tsact_user_id;
-- DROP INDEX IF EXISTS idx_tsact_activity_date;
-- (and many more - omitted for brevity)

-- ============================================================
-- DELETE STORAGE BUCKETS
-- ============================================================

DELETE FROM storage.buckets
WHERE id IN (
  'scouting-photos',
  'avatars',
  'field-images',
  'harvest-images',
  'receipts',
  'chemical-images'
);

-- ============================================================
-- DROP EXTENSIONS (OPTIONAL - may be used by other schemas)
-- ============================================================
-- Uncomment if you want to drop extensions completely.
-- WARNING: Only drop if no other schemas depend on these extensions!

-- DROP EXTENSION IF EXISTS postgis CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================================
-- COMPLETE
-- ============================================================
-- Database has been cleaned. You can now re-run your migration
-- files in the correct order:
--
-- 1. 20260220_quiet_sound.sql              (base schema)
-- 2. 20260221_doctor_reg.sql               (doctors table)
-- 3. 20260221_rbac_doctor_access.sql       (RBAC policies)
-- 4. 20260221_doctor_field_access.sql      (doctor field/tree RLS)
-- 5. 20260221_water_test_v2.sql            (water test results)
-- 6. 20260221_tree_scouting.sql            (tree scouting module)
-- 7. 20260225_tree_scouting_schema_fix.sql (photo_url + ai_prediction)
-- 8. 20260225_tree_scouting_activities_production.sql (activities + production)
-- 9. 20260226_team_management.sql          (team management)
-- 10. calendar_activities.sql              (calendar activities)
-- ============================================================
