import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type CheckoutSessionPayload = {
  paymentRequestId: string;
  leadId?: string | null;
  orderNumber?: string | null;
  paymentType: 'deposit' | 'full';
  amount: number;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  designTitle?: string | null;
  successUrl?: string;
  cancelUrl?: string;
};

function getFunctionsBaseUrl() {
  const explicit = String(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const projectUrl = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  if (!projectUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');

  const match = projectUrl.match(/^https:\/\/([^.]+)\.supabase\.co$/);
  if (!match) throw new Error('Could not derive Supabase Functions URL from EXPO_PUBLIC_SUPABASE_URL');

  return `https://${match[1]}.functions.supabase.co`;
}

function getAppBaseUrl() {
  const configured = String(process.env.APP_BASE_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return Linking.createURL('/').replace(/\/$/, '');
}

export function buildPaymentReturnUrls(leadId?: string | null) {
  const base = getAppBaseUrl();
  const safeLeadId = leadId || '';

  if (Platform.OS === 'web') {
    return {
      successUrl: `${base}/payment-center?status=success&leadId=${encodeURIComponent(safeLeadId)}`,
      cancelUrl: `${base}/payment-center?status=cancelled&leadId=${encodeURIComponent(safeLeadId)}`,
    };
  }

  return {
    successUrl: Linking.createURL('/payment-center', {
      queryParams: { status: 'success', leadId: safeLeadId },
    }),
    cancelUrl: Linking.createURL('/payment-center', {
      queryParams: { status: 'cancelled', leadId: safeLeadId },
    }),
  };
}

export async function createHostedCheckoutSession(input: CheckoutSessionPayload) {
  const accessToken = (await supabase.auth.getSession()).data.session?.access_token || null;
  const anonKey = String(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  const response = await fetch(`${getFunctionsBaseUrl()}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      ...input,
      currency: String(input.currency || 'usd').toLowerCase(),
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Could not create Stripe Checkout session.');
  }

  if (!payload?.url) {
    throw new Error('Stripe Checkout URL was not returned.');
  }

  return payload as { url: string; id: string };
}