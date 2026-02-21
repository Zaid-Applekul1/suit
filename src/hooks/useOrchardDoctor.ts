/**
 * useOrchardDoctor – manages all state + DB mutations for the Orchard Doctor module.
 *
 * RBAC changes vs original:
 * - Accepts a `userRole` parameter ('Doctor' | 'Grower' | null).
 * - When userRole === 'Doctor':
 *     • Skips fetching the grower's consultation list (no fieldId needed).
 *     • Still loads myDoctorProfile and doctorConsultations.
 * - When userRole === 'Grower' (or null / unknown):
 *     • Loads consultations for the given fieldId (unchanged behaviour).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ConsultationRequest,
  ConsultType,
  ActionItem,
  DoctorProfile,
} from '../lib/database.types';
import {
  fetchConsultations,
  fetchConsultationsForDoctor,
  createConsultation,
  updateConsultationStatus,
  issuePrescription,
  updatePrescriptionStatus,
  fetchDoctors,
  fetchDoctorByUserId,
  createDoctorProfile,
  updateDoctorProfile,
} from '../lib/orchardDb';
import type { UserRole } from '../contexts/AuthContext';

export type MutationState = 'idle' | 'loading' | 'error';

export function useOrchardDoctor(
  fieldId: string,
  userId: string,
  growerName: string,
  growerPhone: string,
  userRole: UserRole = null,
) {
  const isDoctor = userRole === 'Doctor';

  /* ── Grower consultations (skip for doctors) ── */
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(!isDoctor);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  /* ── All real doctors from DB (growers need to pick one) ── */
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  /* ── Current user's doctor profile (if they are a doctor) ── */
  const [myDoctorProfile, setMyDoctorProfile] = useState<DoctorProfile | null>(null);
  const [myDoctorProfileLoading, setMyDoctorProfileLoading] = useState(true);

  /* ── Doctor-mode: consultations assigned to this doctor ── */
  const [doctorConsultations, setDoctorConsultations] = useState<ConsultationRequest[]>([]);
  const [doctorConsultationsLoading, setDoctorConsultationsLoading] = useState(false);

  /* ── Load doctors list (always, growers need to pick) ── */
  const reloadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const rows = await fetchDoctors();
      setDoctors(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => { reloadDoctors(); }, [reloadDoctors]);

  /* ── Load current user's doctor profile ── */
  const reloadMyDoctorProfile = useCallback(async () => {
    if (!userId) { setMyDoctorProfileLoading(false); return; }
    setMyDoctorProfileLoading(true);
    try {
      const profile = await fetchDoctorByUserId(userId);
      setMyDoctorProfile(profile);
    } catch {
      setMyDoctorProfile(null);
    } finally {
      setMyDoctorProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => { reloadMyDoctorProfile(); }, [reloadMyDoctorProfile]);

  /* ── Load doctor's own consultation queue when doctor profile is known ── */
  const reloadDoctorConsultations = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    setDoctorConsultationsLoading(true);
    try {
      const rows = await fetchConsultationsForDoctor(doctorId);
      setDoctorConsultations(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDoctorConsultationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (myDoctorProfile?.id) {
      reloadDoctorConsultations(myDoctorProfile.id);
    }
  }, [myDoctorProfile?.id, reloadDoctorConsultations]);

  /* ── Grower: initial load (skip entirely for doctors) ── */
  const reload = useCallback(async () => {
    if (isDoctor) return; // doctors don't have a "my consultations" list by field
    if (!fieldId || !userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchConsultations(fieldId, userId);
      setConsultations(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fieldId, userId, isDoctor]);

  useEffect(() => { reload(); }, [reload]);

  /* ── Derived ── */
  const allPrescriptions = useMemo(
    () => consultations.flatMap(c => c.prescription ? [c.prescription] : []),
    [consultations]
  );

  const pendingRxCount = useMemo(
    () => allPrescriptions.filter(rx => rx.status === 'PENDING').length,
    [allPrescriptions]
  );

  /* ── Mutation helper ── */
  function withMutation<T extends unknown[]>(fn: (...args: T) => Promise<void>) {
    return async (...args: T) => {
      setMutating(true);
      setError(null);
      try {
        await fn(...args);
        if (!isDoctor) await reload();
        if (myDoctorProfile?.id) {
          await reloadDoctorConsultations(myDoctorProfile.id);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setMutating(false);
      }
    };
  }

  /* ── Actions ── */

  const requestConsultation = withMutation(async (payload: {
    doctorId: string;
    type: ConsultType;
    targetDateTime: string;
    notes: string;
    fieldId: string;
    orchardName: string;
  }) => {
    await createConsultation({
      growerName,
      growerPhone,
      fieldId: payload.fieldId,
      orchardName: payload.orchardName,
      userId,
      doctorId: payload.doctorId,
      type: payload.type,
      targetDateTime: payload.targetDateTime,
      notes: payload.notes,
    });
  });

  const acceptRequest = withMutation(async (consultationId: string, doctorId: string) => {
    await updateConsultationStatus(consultationId, 'IN_PROGRESS', doctorId);
  });

  const issueRx = withMutation(async (payload: {
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
  }) => {
    await issuePrescription(payload);
  });

  const executeRx = withMutation(async (rxId: string) => {
    await updatePrescriptionStatus(rxId, 'APPLIED');
  });

  const flagCorrection = withMutation(async (rxId: string) => {
    await updatePrescriptionStatus(rxId, 'NEEDS_CORRECTION');
  });

  /** Register the current user as a doctor (used if profile was not created at signup) */
  const registerAsDoctor = async (payload: {
    name: string;
    specialization: string;
    hospitalName: string;
    phone?: string;
    email?: string;
    bio?: string;
  }): Promise<void> => {
    setMutating(true);
    setError(null);
    try {
      const profile = await createDoctorProfile({ userId, ...payload });
      setMyDoctorProfile(profile);
      await reloadDoctors();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMutating(false);
    }
  };

  /** Update the current doctor's own profile */
  const updateMyDoctorProfile = async (
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
  ): Promise<void> => {
    if (!myDoctorProfile) return;
    setMutating(true);
    setError(null);
    try {
      const updated = await updateDoctorProfile(myDoctorProfile.id, patch);
      setMyDoctorProfile(updated);
      await reloadDoctors();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMutating(false);
    }
  };

  return {
    /* grower data */
    consultations,
    allPrescriptions,
    pendingRxCount,
    loading,
    mutating,
    error,
    reload,
    requestConsultation,
    acceptRequest,
    issueRx,
    executeRx,
    flagCorrection,

    /* doctors list */
    doctors,
    doctorsLoading,

    /* current user's doctor profile */
    myDoctorProfile,
    myDoctorProfileLoading,
    registerAsDoctor,
    updateMyDoctorProfile,

    /* doctor-mode consultation queue */
    doctorConsultations,
    doctorConsultationsLoading,
    reloadDoctorConsultations,
  };
}
