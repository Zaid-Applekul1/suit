/*
  # Calendar Activities — Tree-Specific Activity Support
  Migration: calendar_activities_tree_link_update.sql

  Run AFTER calendar_activities.sql

  ## What it does:
  - Adds tree_tag_id column to calendar_activities to link activities to specific trees
  - Adds row_number column to store the tree's row number for display in calendar
  - Adds tree_serial_number column to store the tree's serial number within its row
  - Updates indexes to support tree-specific activity queries
  - Preserves all existing data (nullable columns)

  ## Use case:
  When users create activities in the Tree Scouting form (Activities tab), those
  activities should appear in the calendar with tree-specific context like:
  "Tree #3 · Row 5: Apply fungicide treatment"
*/

-- ============================================================================
-- ADD TREE-SPECIFIC COLUMNS TO calendar_activities
-- ============================================================================

-- Add tree_tag_id reference (nullable, for tree-specific activities)
ALTER TABLE calendar_activities
ADD COLUMN IF NOT EXISTS tree_tag_id uuid REFERENCES tree_tags(id) ON DELETE CASCADE;

-- Add row_number (denormalized for fast display)
ALTER TABLE calendar_activities
ADD COLUMN IF NOT EXISTS row_number integer;

-- Add tree_serial_number (position within row, e.g., 1st tree in row 5)
ALTER TABLE calendar_activities
ADD COLUMN IF NOT EXISTS tree_serial_number integer;

-- ============================================================================
-- INDEXES FOR TREE-SPECIFIC QUERIES
-- ============================================================================

-- Fast tree-specific activity lookup
CREATE INDEX IF NOT EXISTS idx_calendar_activities_tree_tag_id
  ON calendar_activities (tree_tag_id)
  WHERE tree_tag_id IS NOT NULL;

-- Combined index for tree + date queries
CREATE INDEX IF NOT EXISTS idx_calendar_activities_tree_date
  ON calendar_activities (tree_tag_id, date)
  WHERE tree_tag_id IS NOT NULL;

-- Row-based activity queries (e.g., "show all activities for row 5")
CREATE INDEX IF NOT EXISTS idx_calendar_activities_row
  ON calendar_activities (user_id, row_number, date)
  WHERE row_number IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN calendar_activities.tree_tag_id IS 'Links activity to a specific tree (optional). When set, this activity is tree-specific from Tree Scouting module.';
COMMENT ON COLUMN calendar_activities.row_number IS 'Denormalized row number from tree_tags for fast display in calendar UI without joins.';
COMMENT ON COLUMN calendar_activities.tree_serial_number IS 'Serial number of tree within its row (1-based). For display like "Tree #3 in Row 5".';

-- ============================================================================
-- NOTES
-- ============================================================================

/*
USAGE EXAMPLE:

When a user creates activities in Tree Scouting > Activities tab for a specific tree,
the app should:

1. Get the tree's row_number from tree_tags table
2. Calculate the tree's serial_number (position in row, 1-based)
3. Insert calendar_activity with:
   - tree_tag_id = <tree UUID>
   - row_number = <tree's row number>
   - tree_serial_number = <position in row>
   - field_id = <tree's field>
   - type = 'tree_scouting' or activity type
   - title = "Tree #3 · Row 5: {activity description}"

Calendar display can then show:
- Field-level activities (tree_tag_id = null)
- Tree-specific activities (tree_tag_id != null) with tree context

Example query to get all activities for a specific tree:
  SELECT * FROM calendar_activities
  WHERE user_id = $1 AND tree_tag_id = $2
  ORDER BY date DESC;

Example query to get all tree activities in a row:
  SELECT * FROM calendar_activities
  WHERE user_id = $1 AND row_number = $2
  ORDER BY tree_serial_number, date;
*/
