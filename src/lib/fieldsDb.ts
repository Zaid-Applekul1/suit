import { supabase } from './supabaseClient';

export interface Field {
  id: string;
  name: string;
  area?: number;
  crop_stage?: string;
  health_status?: string;
  location?: string;
  updated_at?: string;
}

export async function fetchFields(userId: string): Promise<Field[]> {
  const { data, error } = await supabase
    .from('fields')
    .select('id, name, area, crop_stage, health_status, location, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
