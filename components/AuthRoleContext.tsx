import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type VendorRecord = {
  id: string;
  user_id?: string | null;
  business_name?: string | null;
  invite_code?: string | null;
  country?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  is_featured?: boolean | null;
  is_suspended?: boolean | null;
  monthly_leads_used?: number | null;
};

type AdminRecord = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  role?: string | null;
};

type AuthRoleContextValue = {
  session: Session | null;
  user: User | null;
  vendor: VendorRecord | null;
  admin: AdminRecord | null;
  isAdmin: boolean;
  isVendor: boolean;
  loading: boolean;
  refreshRole: () => Promise<void>;
};

const AuthRoleContext = createContext<AuthRoleContextValue>({
  session: null,
  user: null,
  vendor: null,
  admin: null,
  isAdmin: false,
  isVendor: false,
  loading: true,
  refreshRole: async () => {},
});

function getAdminEmails(): string[] {
  const raw = process.env.EXPO_PUBLIC_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [admin, setAdmin] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const adminEmails = useMemo(() => getAdminEmails(), []);

  const loadRole = async (authUser?: User | null) => {
    const currentUser = authUser ?? user;

    if (!currentUser?.id) {
      setVendor(null);
      setAdmin(null);
      return;
    }

    const normalizedEmail = String(currentUser.email || '').trim().toLowerCase();
    const emailMarkedAdmin = adminEmails.includes(normalizedEmail);

    try {
      const [vendorResult, adminResult] = await Promise.all([
        supabase
          .from('vendors')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('admins')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
      ]);

      if (vendorResult.error) {
        console.log('Vendor fetch error:', vendorResult.error);
        setVendor(null);
      } else {
        setVendor((vendorResult.data as VendorRecord | null) || null);
      }

      if (adminResult.error) {
        console.log('Admin fetch error:', adminResult.error);
        setAdmin(emailMarkedAdmin ? ({ user_id: currentUser.id, email: normalizedEmail, role: 'admin' } as AdminRecord) : null);
      } else {
        const adminRow = (adminResult.data as AdminRecord | null) || null;
        setAdmin(adminRow || (emailMarkedAdmin ? ({ user_id: currentUser.id, email: normalizedEmail, role: 'admin' } as AdminRecord) : null));
      }
    } catch (error) {
      console.log('AuthRole load failed:', error);
      setVendor(null);
      setAdmin(emailMarkedAdmin ? ({ user_id: currentUser.id, email: normalizedEmail, role: 'admin' } as AdminRecord) : null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        await loadRole(initialSession?.user ?? null);
      } catch (error) {
        console.log('Auth bootstrap failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setVendor(null);
          setAdmin(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(true);

      try {
        await loadRole(nextSession?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthRoleContextValue>(
    () => ({
      session,
      user,
      vendor,
      admin,
      isAdmin: Boolean(admin),
      isVendor: Boolean(vendor),
      loading,
      refreshRole: async () => {
        setLoading(true);
        try {
          await loadRole();
        } finally {
          setLoading(false);
        }
      },
    }),
    [session, user, vendor, admin, loading]
  );

  return <AuthRoleContext.Provider value={value}>{children}</AuthRoleContext.Provider>;
}

export function useAuthRole() {
  return useContext(AuthRoleContext);
}