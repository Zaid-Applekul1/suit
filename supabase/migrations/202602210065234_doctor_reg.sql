/*
  # Add Doctors Table

  This migration adds a `doctors` table so that real users who are doctors
  can register their profiles. Growers then consult real doctors from this table.

  ## Changes:
  1. Create `doctors` table linked to auth.users
  2. RLS: doctors can manage their own profile; authenticated users can read all doctors
  3. Drop the old `doctor_id text` column on consultations and replace with a proper FK
     (or keep text for backwards compat — we keep text but now values are UUIDs matching doctors.id)

  ## How to apply:
  Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).
*/

-- ============================================================================
-- DOCTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Links to the Supabase auth user so each doctor has exactly one profile.
  -- Set to NULL to allow doctors who haven't signed up yet (not needed here —
  -- we require sign-up, so NOT NULL).
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  specialization text NOT NULL,
  hospital_name text NOT NULL,
  phone text,
  email text,
  bio text,
  rating numeric DEFAULT 5.0,
  available boolean DEFAULT true,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- All authenticated users can READ doctors (growers need to pick a doctor)
CREATE POLICY "Authenticated users can read doctors"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the doctor themselves can INSERT their own profile
CREATE POLICY "Doctors can insert own profile"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only the doctor themselves can UPDATE their own profile
CREATE POLICY "Doctors can update own profile"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the doctor themselves can DELETE their own profile
CREATE POLICY "Doctors can delete own profile"
  ON doctors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Timestamp trigger for doctors
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for lookups by user_id
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- ============================================================================
-- NOTE ON consultations.doctor_id
-- ============================================================================
-- The existing `doctor_id text` column in consultations now stores the UUID
-- of the doctors.id row (as a text string).  No column type change is strictly
-- required; Supabase / PostgREST will match correctly as long as the app
-- passes the UUID string.  If you prefer a hard FK, run:
--
--   ALTER TABLE consultations
--     ALTER COLUMN doctor_id TYPE uuid USING doctor_id::uuid,
--     ADD CONSTRAINT fk_consultations_doctor
--       FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
--
-- Only do this after clearing any old mock IDs (DR001, DR002, etc.) from the table.
