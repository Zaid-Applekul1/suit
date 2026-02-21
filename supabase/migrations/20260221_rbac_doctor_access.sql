/*
  # RBAC — Doctor Access to Consultations

  Applies Role-Based Access Control so:

  1. DOCTORS can read ALL consultations where they are assigned doctor
     (consultations.doctor_id = their doctors.id, matched via auth.uid())
  2. GROWERS can still only read/write their own consultations (unchanged)
  3. DOCTORS can also update status on their assigned consultations
     (to mark REQUESTED → IN_PROGRESS, etc.)

  Run this in Supabase SQL Editor → New Query.

  PREREQUISITE: The `doctors` table must exist (applied via 202602210065234_doctor_reg.sql).

  ─────────────────────────────────────────────────────────────────────────────
  HOW IT WORKS
  ─────────────────────────────────────────────────────────────────────────────
  We add a helper function `get_doctor_id_for_user(uuid)` that returns the
  doctors.id for a given auth UID. This is used inside the RLS policy
  USING clauses so Postgres can do a sub-select at query time.

  All old "Users can …" policies are dropped and recreated with correct logic.
*/

-- ============================================================================
-- 1. Helper function to look up a doctor's doctors.id from auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_doctor_id_for_user(_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM doctors WHERE user_id = _uid LIMIT 1;
$$;

-- Grant execution to authenticated users so RLS policies can call it
GRANT EXECUTE ON FUNCTION get_doctor_id_for_user(uuid) TO authenticated;

-- ============================================================================
-- 2. Drop old consultation policies that lack doctor-awareness
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own consultations"  ON consultations;
DROP POLICY IF EXISTS "Users can read own consultations"    ON consultations;
DROP POLICY IF EXISTS "Users can insert own consultations"  ON consultations;
DROP POLICY IF EXISTS "Users can update own consultations"  ON consultations;
DROP POLICY IF EXISTS "Users can delete own consultations"  ON consultations;

-- ============================================================================
-- 3. GROWER policies (unchanged behaviour — growers own their consultations)
-- ============================================================================

CREATE POLICY "Growers can read own consultations"
  ON consultations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Growers can insert own consultations"
  ON consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Growers can update own consultations"
  ON consultations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Growers can delete own consultations"
  ON consultations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. DOCTOR policies (doctors see consultations assigned to them)
-- ============================================================================

-- Doctors can SELECT consultations where doctor_id matches their doctors.id
CREATE POLICY "Doctors can read assigned consultations"
  ON consultations
  FOR SELECT
  TO authenticated
  USING (
    doctor_id IS NOT NULL
    AND doctor_id::text = get_doctor_id_for_user(auth.uid())::text
  );

-- Doctors can UPDATE status on their assigned consultations
-- (e.g. REQUESTED → IN_PROGRESS, IN_PROGRESS → COMPLETED)
CREATE POLICY "Doctors can update assigned consultation status"
  ON consultations
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id IS NOT NULL
    AND doctor_id::text = get_doctor_id_for_user(auth.uid())::text
  )
  WITH CHECK (
    doctor_id IS NOT NULL
    AND doctor_id::text = get_doctor_id_for_user(auth.uid())::text
  );

-- ============================================================================
-- 5. Prescriptions — doctors can INSERT/SELECT prescriptions for their consultations
-- ============================================================================

-- Drop the overly-permissive original policy
DROP POLICY IF EXISTS "Anyone can manage prescriptions" ON prescriptions;

-- Growers: read prescriptions linked to their own consultations
CREATE POLICY "Growers can read own prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE user_id = auth.uid()
    )
  );

-- Doctors: read prescriptions on consultations assigned to them
CREATE POLICY "Doctors can read prescriptions for assigned consultations"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations
      WHERE doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );

-- Doctors: issue (insert) prescriptions for their consultations
CREATE POLICY "Doctors can insert prescriptions for assigned consultations"
  ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM consultations
      WHERE doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );

-- Anyone authenticated can update prescription status (grower marks APPLIED)
CREATE POLICY "Authenticated can update prescription status"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- 6. Prescription Action Items — follow prescriptions access
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can manage prescription action items" ON prescription_action_items;

CREATE POLICY "Access prescription action items via prescription"
  ON prescription_action_items
  FOR ALL
  TO authenticated
  USING (
    prescription_id IN (
      SELECT p.id FROM prescriptions p
      JOIN consultations c ON c.id = p.consultation_id
      WHERE c.user_id = auth.uid()
         OR c.doctor_id::text = get_doctor_id_for_user(auth.uid())::text
    )
  );

-- ============================================================================
-- 7. Profiles — doctors can read each other's profile (optional, for UI display)
-- ============================================================================
-- Uncomment if you want any authenticated user to search profiles:
-- CREATE POLICY "Authenticated can read all profiles for display"
--   ON profiles FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 8. Indexes to make doctor-id lookups fast
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id_lookup  ON doctors(user_id);
