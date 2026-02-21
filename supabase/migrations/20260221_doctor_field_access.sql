/*
  # Doctor Field Access — RLS Policy

  Allows a doctor to SELECT the `fields` row for any grower who has booked them.

  Rule:
    A doctor can read a field if:
      consultations.field_id = fields.id
      AND consultations.doctor_id = get_doctor_id_for_user(auth.uid())

  PREREQUISITE:
    - 20260221_rbac_doctor_access.sql must have been applied first
      (creates the `get_doctor_id_for_user` helper function)

  Run this in Supabase SQL Editor → New Query.
*/

-- ============================================================================
-- 1. Allow doctors to read fields belonging to growers who have booked them
-- ============================================================================

CREATE POLICY "Doctors can read fields of their patients"
  ON fields
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT c.field_id
      FROM consultations c
      WHERE
        c.field_id IS NOT NULL
        AND c.doctor_id IS NOT NULL
        AND c.doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );

-- ============================================================================
-- 2. Allow doctors to read tree_tags for those same fields
-- ============================================================================

CREATE POLICY "Doctors can read tree tags of their patients' fields"
  ON tree_tags
  FOR SELECT
  TO authenticated
  USING (
    field_id IN (
      SELECT c.field_id
      FROM consultations c
      WHERE
        c.field_id IS NOT NULL
        AND c.doctor_id IS NOT NULL
        AND c.doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );

-- ============================================================================
-- 3. Allow doctors to read orchard_varieties for those same fields
-- ============================================================================

CREATE POLICY "Doctors can read orchard varieties of their patients' fields"
  ON orchard_varieties
  FOR SELECT
  TO authenticated
  USING (
    field_id IN (
      SELECT c.field_id
      FROM consultations c
      WHERE
        c.field_id IS NOT NULL
        AND c.doctor_id IS NOT NULL
        AND c.doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );
