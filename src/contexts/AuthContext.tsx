/**
 * AuthContext.tsx
 *
 * RBAC-aware auth context.
 * - Reads `role` and `doctor_type` from the `profiles` table.
 * - Exposes `userRole: 'Doctor' | 'Grower' | null` so every component
 *   can gate UI without extra DB calls.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';

export type UserRole = 'Doctor' | 'Grower' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  userRole: UserRole;          // ← NEW: 'Doctor' | 'Grower' | null
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapProfile = (authUser: SupabaseUser, profile: any | null): User => {
  return {
    id: authUser.id,
    name: profile?.name ?? authUser.user_metadata?.name ?? '',
    email: profile?.email ?? authUser.email ?? '',
    phone: profile?.phone ?? authUser.user_metadata?.phone ?? '',
    farmName: profile?.farm_name ?? '',
    avatar: profile?.avatar_url ?? undefined,
    khasraNumber: profile?.khasra_number ?? undefined,
    khataNumber: profile?.khata_number ?? undefined,
    whatsapp: profile?.whatsapp ?? undefined,
    address: profile?.address ?? undefined,
    language: profile?.language ?? undefined,
    currency: profile?.currency ?? undefined,
    // RBAC additions (stored on the User object for convenience)
    role: profile?.role ?? authUser.user_metadata?.role ?? null,
    doctorType: profile?.doctor_type ?? authUser.user_metadata?.doctorType ?? null,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null);
      setUserRole(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, name, email, phone, farm_name, avatar_url, khasra_number, khata_number, whatsapp, address, language, currency, role, doctor_type'
      )
      .eq('id', authUser.id)
      .single();

    const mapped = mapProfile(authUser, error ? null : data);
    setUser(mapped);

    // Derive role — prefer DB profile, fall back to JWT metadata
    const role: UserRole =
      (data?.role as UserRole) ??
      (authUser.user_metadata?.role as UserRole) ??
      null;
    setUserRole(role);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await loadProfile(session.user);
  }, [loadProfile, session?.user]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, user, userRole, loading, refreshProfile, signOut }),
    [session, user, userRole, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
