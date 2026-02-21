/**
 * orchardDb.ts – All Supabase data-access for the Orchard Doctor module.
 * Every function here is a real DB round-trip; nothing is mocked.
 *
 * Schema (consultations table):
 *   id, user_id, grower_name, grower_phone, field_id, orchard_name,
 *   doctor_id, type, status, target_datetime, notes, created_at
 *
 * Schema (doctors table):
 *   id, user_id, name, specialization, hospital_name, phone, email,
 *   bio, rating, available, avatar_url, created_at, updated_at
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from './supabaseClient';
import type {
  ConsultationRequest,
  ConsultStatus,
  DigitalPrescription,
  PrescriptionStatus,
  ActionItem,
  ConsultType,
  DoctorProfile,
} from './database.types';

/* ─────────────────────────────────────────────────────
   MAPPERS (DB row → app type)
───────────────────────────────────────────────────── */

function mapDoctorRow(row: any): DoctorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    specialization: row.specialization,
    hospitalName: row.hospital_name,
    phone: row.phone,
    email: row.email,
    bio: row.bio,
    rating: Number(row.rating ?? 5),
    available: row.available,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

function mapConsultRow(row: any): ConsultationRequest {
  const prescription = row.prescriptions?.[0]
    ? mapPrescriptionRow(row.prescriptions[0])
    : undefined;

  return {
    id: row.id,
    growerName: row.grower_name,
    growerPhone: row.grower_phone,
    fieldId: row.field_id,
    orchardName: row.orchard_name,
    doctorId: row.doctor_id,
    type: row.type as ConsultType,
    status: row.status as ConsultStatus,
    targetDateTime: row.target_datetime,
    notes: row.notes,
    createdAt: row.created_at,
    prescription,
  };
}

function mapPrescriptionRow(row: any): DigitalPrescription {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    doctorName: row.doctor_name,
    hospitalName: row.hospital_name,
    issueDiagnosed: row.issue_diagnosed,
    eppoCode: row.eppo_code,
    recommendation: row.recommendation,
    status: row.status as PrescriptionStatus,
    issuedAt: row.issued_at,
    followUpDate: row.follow_up_date,
    actionItems: ((row.prescription_action_items ?? []) as any[])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((it: any): ActionItem => ({
        id: it.id,
        category: it.category,
        productName: it.product_name,
        dosage: it.dosage,
        estimatedCost: Number(it.estimated_cost),
      })),
  };
}

// Cast to any to avoid supabase-js generic resolution issues with hand-written types
const db = supabase as any;

/* ─────────────────────────────────────────────────────
   DOCTORS
───────────────────────────────────────────────────── */

/**
 * Fetch all doctors from the `doctors` table.
 * All authenticated users can read this (growers need to pick one).
 */
export async function fetchDoctors(): Promise<DoctorProfile[]> {
  const { data, error } = await db
    .from('doctors')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`fetchDoctors: ${error.message}`);
  return ((data ?? []) as any[]).map(mapDoctorRow);
}

/**
 * Fetch the doctor profile for a given auth user id.
 * Returns null if the user has not registered as a doctor yet.
 */
export async function fetchDoctorByUserId(userId: string): Promise<DoctorProfile | null> {
  const { data, error } = await db
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`fetchDoctorByUserId: ${error.message}`);
  return data ? mapDoctorRow(data) : null;
}

/**
 * Create a new doctor profile for the currently signed-in user.
 */
export async function createDoctorProfile(payload: {
  userId: string;
  name: string;
  specialization: string;
  hospitalName: string;
  phone?: string;
  email?: string;
  bio?: string;
}): Promise<DoctorProfile> {
  const { data, error } = await db
    .from('doctors')
    .insert({
      user_id: payload.userId,
      name: payload.name,
      specialization: payload.specialization,
      hospital_name: payload.hospitalName,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      bio: payload.bio ?? null,
      available: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(`createDoctorProfile: ${error.message}`);
  return mapDoctorRow(data);
}

/**
 * Update the current doctor's own profile (availability, bio, etc.)
 */
export async function updateDoctorProfile(
  doctorId: string,
  patch: Partial<{
    name: string;
    specialization: string;
    hospitalName: string;
    phone: string;
    email: string;
    bio: string;
    available: boolean;
    avatarUrl: string;
  }>
): Promise<DoctorProfile> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined)           dbPatch.name = patch.name;
  if (patch.specialization !== undefined) dbPatch.specialization = patch.specialization;
  if (patch.hospitalName !== undefined)   dbPatch.hospital_name = patch.hospitalName;
  if (patch.phone !== undefined)          dbPatch.phone = patch.phone;
  if (patch.email !== undefined)          dbPatch.email = patch.email;
  if (patch.bio !== undefined)            dbPatch.bio = patch.bio;
  if (patch.available !== undefined)      dbPatch.available = patch.available;
  if (patch.avatarUrl !== undefined)      dbPatch.avatar_url = patch.avatarUrl;

  const { data, error } = await db
    .from('doctors')
    .update(dbPatch)
    .eq('id', doctorId)
    .select('*')
    .single();

  if (error) throw new Error(`updateDoctorProfile: ${error.message}`);
  return mapDoctorRow(data);
}

/* ─────────────────────────────────────────────────────
   CONSULTATIONS
───────────────────────────────────────────────────── */

/**
 * Fetch all consultations for a specific field + user, newest first,
 * with nested prescriptions + action items.
 */
export async function fetchConsultations(fieldId: string, userId: string): Promise<ConsultationRequest[]> {
  let query = db
    .from('consultations')
    .select(`
      *,
      prescriptions (
        *,
        prescription_action_items (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (fieldId) {
    query = query.eq('field_id', fieldId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`fetchConsultations: ${error.message}`);
  return ((data ?? []) as any[]).map(mapConsultRow);
}

/**
 * Fetch all consultations assigned to a doctor (doctor portal).
 * Since consultations are RLS'd by user_id (grower), doctors need a broader query.
 * The prescriptions RLS allows any authenticated user, so this works.
 *
 * NOTE: If you want doctors to only see their own assigned consultations,
 * add a separate RLS policy on consultations:
 *   USING (auth.uid()::text = doctor_id OR auth.uid() = user_id)
 */
export async function fetchConsultationsForDoctor(doctorId: string): Promise<ConsultationRequest[]> {
  const { data, error } = await db
    .from('consultations')
    .select(`
      *,
      prescriptions (
        *,
        prescription_action_items (*)
      )
    `)
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`fetchConsultationsForDoctor: ${error.message}`);
  return ((data ?? []) as any[]).map(mapConsultRow);
}

/**
 * Insert a new consultation request.
 */
export async function createConsultation(payload: {
  growerName: string;
  growerPhone: string;
  userId: string;
  fieldId: string;
  orchardName: string;
  doctorId: string;
  type: ConsultType;
  targetDateTime: string;
  notes: string;
}): Promise<ConsultationRequest> {
  const { data, error } = await db
    .from('consultations')
    .insert({
      user_id: payload.userId,
      grower_name: payload.growerName,
      grower_phone: payload.growerPhone,
      ...(payload.fieldId ? { field_id: payload.fieldId } : {}),
      orchard_name: payload.orchardName,
      doctor_id: payload.doctorId,
      type: payload.type,
      status: 'REQUESTED',
      target_datetime: payload.targetDateTime,
      notes: payload.notes,
    })
    .select(`
      *,
      prescriptions (
        *,
        prescription_action_items (*)
      )
    `)
    .single();

  if (error) throw new Error(`createConsultation: ${error.message}`);
  return mapConsultRow(data);
}

/**
 * Transition a consultation status (REQUESTED → IN_PROGRESS, etc.)
 */
export async function updateConsultationStatus(
  id: string,
  status: ConsultStatus,
  doctorId?: string
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (doctorId !== undefined) patch.doctor_id = doctorId;

  const { error } = await db
    .from('consultations')
    .update(patch)
    .eq('id', id);

  if (error) throw new Error(`updateConsultationStatus: ${error.message}`);
}

/* ─────────────────────────────────────────────────────
   PRESCRIPTIONS
───────────────────────────────────────────────────── */

/**
 * Issue a new digital prescription + its action items.
 * Returns the full hydrated prescription.
 */
export async function issuePrescription(payload: {
  consultationId: string;
  doctorName: string;
  hospitalName: string;
  issueDiagnosed: string;
  eppoCode: string;
  recommendation: string;
  followUpDate: string;
  actionItems: Array<{
    category: ActionItem['category'];
    productName: string;
    dosage: string;
    estimatedCost: number;
  }>;
}): Promise<DigitalPrescription> {
  // 1. Insert prescription row
  const { data: rxRow, error: rxErr } = await db
    .from('prescriptions')
    .insert({
      consultation_id: payload.consultationId,
      doctor_name: payload.doctorName,
      hospital_name: payload.hospitalName,
      issue_diagnosed: payload.issueDiagnosed,
      eppo_code: payload.eppoCode,
      recommendation: payload.recommendation,
      status: 'PENDING',
      issued_at: new Date().toISOString().slice(0, 10),
      follow_up_date: payload.followUpDate,
    })
    .select('*')
    .single();

  if (rxErr) throw new Error(`issuePrescription (rx): ${rxErr.message}`);

  // 2. Insert action items
  if (payload.actionItems.length > 0) {
    const { error: itemsErr } = await db
      .from('prescription_action_items')
      .insert(
        payload.actionItems.map((it, idx) => ({
          prescription_id: rxRow.id,
          category: it.category,
          product_name: it.productName,
          dosage: it.dosage,
          estimated_cost: it.estimatedCost,
          sort_order: idx,
        }))
      );

    if (itemsErr) throw new Error(`issuePrescription (items): ${itemsErr.message}`);
  }

  // 3. Mark consultation as COMPLETED
  await updateConsultationStatus(payload.consultationId, 'COMPLETED');

  // 4. Return full prescription with items
  const { data: full, error: fullErr } = await db
    .from('prescriptions')
    .select('*, prescription_action_items(*)')
    .eq('id', rxRow.id)
    .single();

  if (fullErr) throw new Error(`issuePrescription (refetch): ${fullErr.message}`);
  return mapPrescriptionRow(full);
}

/**
 * Update prescription status (PENDING → APPLIED or NEEDS_CORRECTION).
 */
export async function updatePrescriptionStatus(
  id: string,
  status: PrescriptionStatus
): Promise<void> {
  const { error } = await db
    .from('prescriptions')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`updatePrescriptionStatus: ${error.message}`);
}
