/*
  # Team Management System for Orchard Growers

  Allows orchard owners (growers) to:
  1. Invite managers and workers to access their account/fields
  2. Manage team member permissions (view, edit, full access)
  3. Track invitation status (pending, accepted, rejected)
  4. Remove team members

  ## Tables Created:
  - team_invitations: Tracks sent invitations
  - team_members: Tracks active team members with roles and permissions
  - team_field_access: Granular field-level access control

  ## Roles:
  - owner: Original account holder (grower)
  - manager: Can view and edit most data, manage workers
  - worker: Can view data and perform basic tasks

  ## Permissions:
  - view: Read-only access
  - edit: Can modify data
  - full: Can view, edit, and manage

  Run this in Supabase SQL Editor → New Query.
*/

-- ============================================================================
-- 1. TEAM INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email text NOT NULL,
  invitee_phone text,
  role text NOT NULL CHECK (role IN ('manager', 'worker')),
  permissions text NOT NULL DEFAULT 'view' CHECK (permissions IN ('view', 'edit', 'full')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  invitation_token text UNIQUE NOT NULL,
  invited_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for team_invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_owner_id ON team_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_email ON team_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- ============================================================================
-- 2. TEAM MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'worker')),
  permissions text NOT NULL DEFAULT 'view' CHECK (permissions IN ('view', 'edit', 'full')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),
  invitation_id uuid REFERENCES team_invitations(id),
  joined_at timestamptz DEFAULT now(),
  last_active_at timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, member_id)
);

-- Indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================================================
-- 3. TEAM FIELD ACCESS TABLE (Granular field-level permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_field_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  field_id uuid REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_manage_trees boolean DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, field_id)
);

-- Indexes for team_field_access
CREATE INDEX IF NOT EXISTS idx_team_field_access_team_member ON team_field_access(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_field_access_field ON team_field_access(field_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_field_access ENABLE ROW LEVEL SECURITY;

-- Team Invitations Policies
-- Owners can manage their sent invitations
CREATE POLICY "Owners can manage their invitations"
  ON team_invitations
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

-- Invitees can view invitations sent to their email
CREATE POLICY "Invitees can view their invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    invitee_email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > now()
  );

-- Invitees can accept invitations
CREATE POLICY "Invitees can accept invitations"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invitee_email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > now()
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
  );

-- Team Members Policies
-- Owners can manage their team members
CREATE POLICY "Owners can manage their team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

-- Members can view team they belong to
CREATE POLICY "Members can view their team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Team Field Access Policies
-- Owners and managers can manage field access
CREATE POLICY "Owners can manage field access"
  ON team_field_access
  FOR ALL
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
  );

-- Members can view their field access
CREATE POLICY "Members can view their field access"
  ON team_field_access
  FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE member_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
BEGIN
  token := encode(gen_random_bytes(32), 'base64');
  token := replace(token, '/', '_');
  token := replace(token, '+', '-');
  RETURN token;
END;
$$;

-- Function to check if user has access to a field (owner or team member)
CREATE OR REPLACE FUNCTION user_has_field_access(_user_id uuid, _field_id uuid, _permission text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM fields WHERE id = _field_id AND user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is a team member with appropriate access
  IF _permission = 'view' THEN
    RETURN EXISTS (
      SELECT 1
      FROM team_members tm
      JOIN team_field_access tfa ON tfa.team_member_id = tm.id
      WHERE tm.member_id = _user_id
        AND tfa.field_id = _field_id
        AND tm.status = 'active'
        AND tfa.can_view = true
    );
  ELSIF _permission = 'edit' THEN
    RETURN EXISTS (
      SELECT 1
      FROM team_members tm
      JOIN team_field_access tfa ON tfa.team_member_id = tm.id
      WHERE tm.member_id = _user_id
        AND tfa.field_id = _field_id
        AND tm.status = 'active'
        AND tfa.can_edit = true
    );
  ELSIF _permission = 'delete' THEN
    RETURN EXISTS (
      SELECT 1
      FROM team_members tm
      JOIN team_field_access tfa ON tfa.team_member_id = tm.id
      WHERE tm.member_id = _user_id
        AND tfa.field_id = _field_id
        AND tm.status = 'active'
        AND tfa.can_delete = true
    );
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION user_has_field_access(uuid, uuid, text) TO authenticated;

-- Function to automatically create team member from accepted invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(_invitation_id uuid, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _invitation team_invitations;
  _member_id uuid;
BEGIN
  -- Get invitation
  SELECT * INTO _invitation
  FROM team_invitations
  WHERE id = _invitation_id
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- Verify user email matches
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = _user_id AND email = _invitation.invitee_email
  ) THEN
    RAISE EXCEPTION 'Email does not match invitation';
  END IF;

  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by = _user_id,
      updated_at = now()
  WHERE id = _invitation_id;

  -- Create team member
  INSERT INTO team_members (
    owner_id,
    member_id,
    role,
    permissions,
    invitation_id,
    joined_at
  ) VALUES (
    _invitation.owner_id,
    _user_id,
    _invitation.role,
    _invitation.permissions,
    _invitation_id,
    now()
  )
  RETURNING id INTO _member_id;

  -- If permissions is 'full', grant access to all owner's fields
  IF _invitation.permissions = 'full' THEN
    INSERT INTO team_field_access (
      team_member_id,
      field_id,
      can_view,
      can_edit,
      can_delete,
      can_manage_trees,
      granted_by
    )
    SELECT
      _member_id,
      f.id,
      true,
      true,
      false,
      true,
      _invitation.owner_id
    FROM fields f
    WHERE f.user_id = _invitation.owner_id;
  END IF;

  RETURN _member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_team_invitation(uuid, uuid) TO authenticated;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. UPDATE EXISTING POLICIES TO SUPPORT TEAM ACCESS
-- ============================================================================

-- Allow team members to read fields they have access to
CREATE POLICY "Team members can read accessible fields"
  ON fields
  FOR SELECT
  TO authenticated
  USING (
    user_has_field_access(auth.uid(), id, 'view')
  );

-- Allow team members with edit permission to update fields
CREATE POLICY "Team members can update accessible fields"
  ON fields
  FOR UPDATE
  TO authenticated
  USING (
    user_has_field_access(auth.uid(), id, 'edit')
  );

-- Allow team members to read tree tags for accessible fields
CREATE POLICY "Team members can read tree tags for accessible fields"
  ON tree_tags
  FOR SELECT
  TO authenticated
  USING (
    user_has_field_access(auth.uid(), field_id, 'view')
  );

-- Allow team members with edit permission to manage tree tags
CREATE POLICY "Team members can insert tree tags for accessible fields"
  ON tree_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_field_access(auth.uid(), field_id, 'edit')
  );

CREATE POLICY "Team members can update tree tags for accessible fields"
  ON tree_tags
  FOR UPDATE
  TO authenticated
  USING (
    user_has_field_access(auth.uid(), field_id, 'edit')
  );

CREATE POLICY "Team members can delete tree tags for accessible fields"
  ON tree_tags
  FOR DELETE
  TO authenticated
  USING (
    user_has_field_access(auth.uid(), field_id, 'edit')
  );

-- ============================================================================
-- 8. VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View to show team members with their profile info
CREATE OR REPLACE VIEW team_members_with_profiles AS
SELECT
  tm.id,
  tm.owner_id,
  tm.member_id,
  tm.role,
  tm.permissions,
  tm.status,
  tm.joined_at,
  tm.last_active_at,
  p.name AS member_name,
  p.email AS member_email,
  p.phone AS member_phone,
  p.avatar_url AS member_avatar,
  op.name AS owner_name,
  op.email AS owner_email,
  op.farm_name AS owner_farm_name
FROM team_members tm
LEFT JOIN profiles p ON p.id = tm.member_id
LEFT JOIN profiles op ON op.id = tm.owner_id;

-- View to show pending invitations with details
CREATE OR REPLACE VIEW pending_team_invitations AS
SELECT
  ti.id,
  ti.owner_id,
  ti.invitee_email,
  ti.invitee_phone,
  ti.role,
  ti.permissions,
  ti.invitation_token,
  ti.invited_at,
  ti.expires_at,
  ti.message,
  p.name AS owner_name,
  p.email AS owner_email,
  p.farm_name AS owner_farm_name,
  p.avatar_url AS owner_avatar
FROM team_invitations ti
LEFT JOIN profiles p ON p.id = ti.owner_id
WHERE ti.status = 'pending'
  AND ti.expires_at > now();
