/**
 * TreeScoutingCalendarIntegration.tsx
 *
 * Helper functions to sync tree scouting activities to the calendar
 *
 * This module provides functionality to:
 * 1. Save activities from Tree Scouting form to calendar_activities table
 * 2. Link activities with specific trees (tree_tag_id, row_number, tree_serial_number)
 * 3. Format activity titles with tree context
 */

import { supabase } from '../lib/supabaseClient';

interface ActivityEntry {
  date: string;
  type: string;
  product: string;
  quantity: string;
  notes: string;
}

interface TreeContext {
  treeId: string;
  treeName: string;
  treeRowNumber: number | null;
  treeSerialNumber: number;
  fieldId: string;
}

/**
 * Maps tree scouting activity types to calendar activity types
 */
function mapActivityTypeToCalendarType(scoutingType: string): string {
  const typeMap: Record<string, string> = {
    'Pruning': 'pruning',
    'Irrigation': 'irrigation',
    'Spray': 'spray',
    'Fertilizer': 'fertilizer',
    'Harvesting': 'harvesting',
    'Soil Treatment': 'soil_test',
    'Other': 'tree_scouting',
  };
  return typeMap[scoutingType] || 'tree_scouting';
}

/**
 * Formats activity title with tree context
 * Example: "Tree #3 · Row 5: Spray treatment - Fungicide"
 */
function formatActivityTitle(
  activity: ActivityEntry,
  treeContext: TreeContext
): string {
  const treeLabel = treeContext.treeName || `Tree #${treeContext.treeSerialNumber}`;
  const rowLabel = treeContext.treeRowNumber ? ` · Row ${treeContext.treeRowNumber}` : '';
  const productInfo = activity.product ? ` - ${activity.product}` : '';
  const quantityInfo = activity.quantity ? ` (${activity.quantity})` : '';

  return `${treeLabel}${rowLabel}: ${activity.type}${productInfo}${quantityInfo}`;
}

/**
 * Saves tree scouting activities to calendar
 * Called after saving a tree scouting observation
 */
export async function saveActivitiesToCalendar(
  userId: string,
  activities: ActivityEntry[],
  treeContext: TreeContext
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Filter out empty activities (no type selected)
    const validActivities = activities.filter(a => a.type && a.type.trim() !== '');

    if (validActivities.length === 0) {
      return { success: true, count: 0 };
    }

    // Build calendar activity records
    const calendarActivities = validActivities.map(activity => ({
      user_id: userId,
      field_id: treeContext.fieldId,
      tree_tag_id: treeContext.treeId,
      row_number: treeContext.treeRowNumber,
      tree_serial_number: treeContext.treeSerialNumber,
      date: activity.date,
      type: mapActivityTypeToCalendarType(activity.type),
      title: formatActivityTitle(activity, treeContext),
      notes: activity.notes || '',
      completed: false,
      linked_module: 'TreeScouting',
    }));

    // Insert into calendar_activities table
    const { error } = await supabase
      .from('calendar_activities')
      .insert(calendarActivities);

    if (error) {
      console.error('Error saving activities to calendar:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: validActivities.length };
  } catch (e: any) {
    console.error('Exception saving activities to calendar:', e);
    return { success: false, count: 0, error: e.message || 'Unknown error' };
  }
}

/**
 * Deletes tree-specific calendar activities for a tree
 * Useful when updating or removing tree scouting observations
 */
export async function deleteTreeActivitiesFromCalendar(
  userId: string,
  treeId: string,
  activityDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let query = supabase
      .from('calendar_activities')
      .delete()
      .eq('user_id', userId)
      .eq('tree_tag_id', treeId)
      .eq('linked_module', 'TreeScouting');

    if (activityDate) {
      query = query.eq('date', activityDate);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting tree activities from calendar:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Exception deleting tree activities from calendar:', e);
    return { success: false, error: e.message || 'Unknown error' };
  }
}
