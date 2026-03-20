export type NotificationSeed = {
  audience: 'vendor' | 'customer' | 'admin';
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
  recipientEmail?: string | null;
};

export function buildNotificationPayload(input: NotificationSeed) {
  return {
    audience: input.audience,
    channel: 'in_app',
    title: input.title,
    body: input.body,
    reference_type: input.referenceType || null,
    reference_id: input.referenceId || null,
    recipient_email: input.recipientEmail || null,
    status: 'unread',
    created_at: new Date().toISOString(),
  };
}
