import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthRoleContextType = {
  user: any;
  vendor: any;
  profile: any;
  isVendor: boolean;
  isAdmin: boolean;
  loading: boolean;
  adminEmails: string[];
  refreshRole: () => Promise<void>;
};

const adminEmails = String(process.env.EXPO_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const AuthRoleContext = createContext<AuthRoleContextType>({
  user: null,
  vendor: null,
  profile: null,
  isVendor: false,
  isAdmin: false,
  loading: true,
  adminEmails,
  refreshRole: async () => {},
});

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshRole = async () => {
    try {
      setLoading(true);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser ?? null);

      if (!authUser?.id) {
        setVendor(null);
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      const [vendorResult, profileResult] = await Promise.all([
        supabase.from('vendors').select('*').eq('user_id', authUser.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
      ]);

      const nextVendor = vendorResult.error ? null : vendorResult.data ?? null;
      const nextProfile = profileResult.error ? null : profileResult.data ?? null;

      setVendor(nextVendor);
      setProfile(nextProfile);

      const normalizedEmail = String(authUser.email || '').trim().toLowerCase();
      const profileRole = String(
        nextProfile?.role || authUser.user_metadata?.role || authUser.app_metadata?.role || ''
      )
        .trim()
        .toLowerCase();

      const vendorAdminFlag = Boolean(nextVendor?.is_admin);
      const emailAdminFlag = adminEmails.includes(normalizedEmail);

      setIsAdmin(profileRole === 'admin' || vendorAdminFlag || emailAdminFlag);
    } catch (error) {
      console.error('Auth role refresh failed:', error);
      setVendor(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (!mounted) return;
      await refreshRole();
    };

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      vendor,
      profile,
      isVendor: !!vendor,
      isAdmin,
      loading,
      adminEmails,
      refreshRole,
    }),
    [user, vendor, profile, isAdmin, loading]
  );

  return <AuthRoleContext.Provider value={value}>{children}</AuthRoleContext.Provider>;
}

export function useAuthRole() {
  return useContext(AuthRoleContext);
}