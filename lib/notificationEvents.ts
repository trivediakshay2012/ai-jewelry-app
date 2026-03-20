import { supabase } from './supabase';

export type NotificationAudience = 'vendor' | 'customer' | 'admin' | 'system';

export type NotificationEventInput = {
  audience: NotificationAudience;
  channel?: 'in_app' | 'email_ready' | 'system';
  title: string;
  body: string;
  recipientEmail?: string | null;
  recipientVendorId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, any> | null;
};

function buildPayload(input: NotificationEventInput) {
  return {
    audience: input.audience,
    channel: input.channel || 'in_app',
    title: input.title,
    body: input.body,
    recipient_email: input.recipientEmail || null,
    recipient_vendor_id: input.recipientVendorId || null,
    reference_type: input.referenceType || null,
    reference_id: input.referenceId || null,
    metadata: input.metadata || {},
    status: 'unread',
    created_at: new Date().toISOString(),
  };
}

export async function createNotificationEvent(input: NotificationEventInput) {
  const payload = buildPayload(input);

  const primary = await supabase.from('notification_events').insert([payload]).select('*').single();

  if (!primary.error) {
    return primary.data;
  }

  console.log('notification_events insert failed:', primary.error);

  const fallback = await supabase.from('notifications').insert([payload]).select('*').single();

  if (!fallback.error) {
    return fallback.data;
  }

  console.log('notifications fallback insert failed:', fallback.error);

  return {
    id: `local-notification-${Date.now()}`,
    ...payload,
    backend_mode: 'local_skipped',
  };
}