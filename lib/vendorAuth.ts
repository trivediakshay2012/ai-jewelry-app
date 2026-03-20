import { supabase } from './supabase';

type PendingVendorSignup = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  website: string;
  specialization: string;
  subscriptionPlan?: string;
};

type VendorUpsertInput = PendingVendorSignup & {
  userId: string;
};

const STORAGE_KEY = 'ai_jewelry_pending_vendor_signup';
const memoryStore = new Map<string, string>();

function readStorage(key: string): string | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage.getItem(key);
    }
  } catch {}
  return memoryStore.get(key) ?? null;
}

function writeStorage(key: string, value: string) {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStore.set(key, value);
}

function removeStorage(key: string) {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.removeItem(key);
      return;
    }
  } catch {}
  memoryStore.delete(key);
}

function slugifyInviteCode(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  const fallback = `vendor-${Math.random().toString(36).slice(2, 8)}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || fallback}-${suffix}`;
}

export function savePendingVendorSignup(data: PendingVendorSignup) {
  writeStorage(STORAGE_KEY, JSON.stringify(data));
}

export function getPendingVendorSignup(): PendingVendorSignup | null {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingVendorSignup;
  } catch {
    return null;
  }
}

export function clearPendingVendorSignup() {
  removeStorage(STORAGE_KEY);
}

export async function createOrUpdateVendorProfile(input: VendorUpsertInput) {
  const specializationList = input.specialization
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const existingVendor = await getCurrentVendorByUserId(input.userId);

  const { error } = await supabase.from('vendors').upsert(
    {
      user_id: input.userId,
      business_name: input.businessName,
      owner_name: input.ownerName,
      email: input.email,
      phone: input.phone || null,
      country: input.country,
      city: input.city || null,
      website: input.website || null,
      specialization: specializationList,
      invite_code:
        existingVendor?.invite_code || slugifyInviteCode(input.businessName || input.ownerName || input.email),
      subscription_plan: input.subscriptionPlan || existingVendor?.subscription_plan || 'basic',
      subscription_status: existingVendor?.subscription_status || 'trialing',
      is_onboarded: existingVendor?.is_onboarded ?? false,
      trial_started_at: existingVendor?.trial_started_at || new Date().toISOString(),
      trial_ends_at: existingVendor?.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      monthly_leads_used: existingVendor?.monthly_leads_used || 0,
      average_response_hours: existingVendor?.average_response_hours || null,
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

export async function getCurrentVendorByUserId(userId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureVendorProfileForUser(args: { userId: string; email?: string | null }) {
  let vendor = await getCurrentVendorByUserId(args.userId);
  if (vendor) return vendor;

  const pendingSignup = getPendingVendorSignup();
  if (pendingSignup) {
    await createOrUpdateVendorProfile({ ...pendingSignup, userId: args.userId });
    clearPendingVendorSignup();
    vendor = await getCurrentVendorByUserId(args.userId);
    if (vendor) return vendor;
  }

  if (args.email) {
    const { data: emailVendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', args.email)
      .maybeSingle();

    if (error) throw error;

    if (emailVendor && emailVendor.user_id !== args.userId) {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ user_id: args.userId })
        .eq('id', emailVendor.id);

      if (updateError) throw updateError;
    }

    if (emailVendor) {
      vendor = await getCurrentVendorByUserId(args.userId);
      if (vendor) return vendor;
    }

    const fallbackBusinessName = args.email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    const fallbackInviteCode = slugifyInviteCode(fallbackBusinessName || args.email);
    const { error: createError } = await supabase.from('vendors').upsert(
      {
        user_id: args.userId,
        business_name: fallbackBusinessName || 'Vendor',
        owner_name: fallbackBusinessName || 'Vendor Owner',
        email: args.email,
        country: 'United States',
        city: null,
        website: null,
        specialization: [],
        invite_code: fallbackInviteCode,
        subscription_plan: 'basic',
        subscription_status: 'trialing',
        is_onboarded: false,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        monthly_leads_used: 0,
      },
      { onConflict: 'user_id' }
    );

    if (createError) throw createError;

    vendor = await getCurrentVendorByUserId(args.userId);
    if (vendor) return vendor;
  }

  return null;
}

export async function signOutVendor() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
