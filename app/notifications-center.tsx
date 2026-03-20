import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../lib/responsive';
import { supabase } from '../lib/supabase';

type NotificationRow = {
  id: string;
  audience?: string | null;
  channel?: string | null;
  title?: string | null;
  body?: string | null;
  status?: string | null;
  recipient_email?: string | null;
  recipient_vendor_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string | null;
  source_table?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function dedupeNotifications(items: NotificationRow[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.source_table || 'notification_events', item.reference_type || '', item.reference_id || item.id || '', item.title || ''].join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function NotificationsCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [message, setMessage] = useState('');
  const [realtimeState, setRealtimeState] = useState('connecting');
  const responsive = useResponsive();

  const loadNotifications = useCallback(async () => {
    try {
      setMessage('');

      const [primary, fallback, leadsResult, quotesResult, paymentsResult, paymentRequestsResult] = await Promise.all([
        supabase.from('notification_events').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('vendor_leads').select('id, customer_name, customer_email, design_title, status, created_at').order('created_at', { ascending: false }).limit(25),
        supabase.from('vendor_quotes').select('id, lead_id, quote_amount, status, created_at').order('created_at', { ascending: false }).limit(25),
        supabase.from('payments').select('id, amount, status, customer_email, order_number, created_at').order('created_at', { ascending: false }).limit(25),
        supabase.from('payment_requests').select('id, amount, status, customer_email, order_number, created_at').order('created_at', { ascending: false }).limit(25),
      ]);

      const rows: NotificationRow[] = [];

      if (!primary.error && primary.data) {
        rows.push(...((primary.data as NotificationRow[]).map((item) => ({ ...item, source_table: 'notification_events' }))));
      }

      if (!fallback.error && fallback.data) {
        rows.push(...((fallback.data as NotificationRow[]).map((item) => ({ ...item, source_table: 'notifications' }))));
      }

      if (!leadsResult.error && leadsResult.data) {
        rows.push(
          ...leadsResult.data.map((lead: any) => ({
            id: `lead-${lead.id}`,
            audience: 'vendor',
            channel: 'system',
            title: 'Lead activity',
            body: `${lead.customer_name || 'Customer'} submitted ${lead.design_title || 'a jewelry request'}.`,
            status: lead.status || 'submitted',
            recipient_email: lead.customer_email || null,
            reference_type: 'vendor_lead',
            reference_id: lead.id,
            created_at: lead.created_at,
            source_table: 'vendor_leads',
          }))
        );
      }

      if (!quotesResult.error && quotesResult.data) {
        rows.push(
          ...quotesResult.data.map((quote: any) => ({
            id: `quote-${quote.id}`,
            audience: 'customer',
            channel: 'system',
            title: 'Quote activity',
            body: `Quote ${quote.id} was saved for ${Number(quote.quote_amount || 0).toFixed(2)}.`,
            status: quote.status || 'sent',
            reference_type: 'vendor_quote',
            reference_id: quote.id,
            created_at: quote.created_at,
            source_table: 'vendor_quotes',
          }))
        );
      }

      if (!paymentsResult.error && paymentsResult.data) {
        rows.push(
          ...paymentsResult.data.map((payment: any) => ({
            id: `payment-${payment.id}`,
            audience: 'customer',
            channel: 'system',
            title: 'Payment activity',
            body: `${payment.order_number || 'Payment'} is ${payment.status || 'requested'} for $${Number(payment.amount || 0).toFixed(2)}.`,
            status: payment.status || 'requested',
            recipient_email: payment.customer_email || null,
            reference_type: 'payment',
            reference_id: payment.id,
            created_at: payment.created_at,
            source_table: 'payments',
          }))
        );
      }

      if (!paymentRequestsResult.error && paymentRequestsResult.data) {
        rows.push(
          ...paymentRequestsResult.data.map((payment: any) => ({
            id: `payment-request-${payment.id}`,
            audience: 'customer',
            channel: 'system',
            title: 'Checkout requested',
            body: `${payment.order_number || 'Checkout'} is ${payment.status || 'requested'} for $${Number(payment.amount || 0).toFixed(2)}.`,
            status: payment.status || 'requested',
            recipient_email: payment.customer_email || null,
            reference_type: 'payment_request',
            reference_id: payment.id,
            created_at: payment.created_at,
            source_table: 'payment_requests',
          }))
        );
      }

      const merged = dedupeNotifications(rows).sort((a, b) => {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });

      if (primary.error && fallback.error && merged.length === 0) {
        throw primary.error;
      }

      setNotifications(merged);
    } catch (error: any) {
      setMessage(error?.message || 'Could not load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  useEffect(() => {
    const channel = supabase
      .channel('notification-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_events' }, () => {
        setRealtimeState('live');
        loadNotifications();
      })
      .subscribe((status) => {
        setRealtimeState(String(status || '').toLowerCase());
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const markRead = async (item: NotificationRow) => {
    try {
      if (item.source_table === 'notification_events' || item.source_table === 'notifications') {
        const result = await supabase.from(item.source_table).update({ status: 'read' }).eq('id', item.id.replace(/^.*-/, '') === item.id ? item.id : item.id);
        if (result.error) throw result.error;
      }
      await loadNotifications();
    } catch (error: any) {
      Alert.alert('Could not update notification', error?.message || 'Please try again.');
    }
  };

  const unread = useMemo(() => notifications.filter((item) => String(item.status || '').toLowerCase() !== 'read').length, [notifications]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingHorizontal: responsive.gutter, alignSelf: 'center', width: '100%', maxWidth: responsive.contentMaxWidth }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />}>
      <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
      <Text style={styles.title}>Activity center</Text>
      <Text style={styles.subtitle}>Track customer, vendor, quote, and payment activity with realtime refresh and launch-safe fallbacks.</Text>

      <View style={[styles.statsCard, responsive.isTablet && { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <View><Text style={styles.statLabel}>Total events</Text><Text style={styles.statValue}>{notifications.length}</Text></View>
        <View><Text style={styles.statLabel}>Unread</Text><Text style={styles.statValue}>{unread}</Text></View>
        <View><Text style={styles.statLabel}>Realtime</Text><Text style={styles.statValueSmall}>{realtimeState}</Text></View>
      </View>

      {!!message ? <View style={styles.card}><Text style={styles.error}>{message}</Text><Text style={styles.muted}>This screen now also shows fallback activity from leads, quotes, and payments, so you can still validate the MVP even if the notification table is empty.</Text></View> : null}
      {loading ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading notifications...</Text></View> : null}
      {!loading && notifications.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No notifications yet.</Text></View> : null}

      <View style={[styles.grid, responsive.isTablet && { justifyContent: 'space-between' }]}>
        {notifications.map((item) => (
          <View key={item.id} style={[styles.card, responsive.isTablet && styles.tabletCard]}>
            <View style={styles.row}><Text style={styles.badge}>{item.audience || 'system'}</Text><Text style={styles.status}>{item.status || 'unread'}</Text></View>
            <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
            {!!item.body ? <Text style={styles.body}>{item.body}</Text> : null}
            <Text style={styles.muted}>{formatDate(item.created_at)}</Text>
            {!!item.recipient_email ? <Text style={styles.muted}>Recipient: {item.recipient_email}</Text> : null}
            {!!item.reference_type ? <Text style={styles.muted}>Reference: {item.reference_type} {item.reference_id || ''}</Text> : null}
            {!!item.source_table ? <Text style={styles.muted}>Source: {item.source_table}</Text> : null}
            {String(item.status || '').toLowerCase() !== 'read' ? <TouchableOpacity style={styles.actionButton} onPress={() => markRead(item)}><Text style={styles.actionText}>Refresh / Mark Read</Text></TouchableOpacity> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f2ec' },
  content: { paddingVertical: 20, gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6, color: '#8b6740' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f1208' },
  subtitle: { fontSize: 15, color: '#5d4835', lineHeight: 22 },
  statsCard: { backgroundColor: '#1c130c', borderRadius: 18, padding: 16, gap: 12 },
  statLabel: { color: '#cfb89a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statValueSmall: { color: '#fff', fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  grid: { gap: 12 },
  tabletCard: { width: '48%' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#efe0cc', color: '#5a432d', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  status: { color: '#7a6754', fontWeight: '700', textTransform: 'capitalize' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#201208' },
  body: { fontSize: 14, color: '#413123', lineHeight: 20 },
  muted: { color: '#7a6754' },
  error: { color: '#8d2b2b', fontWeight: '700' },
  actionButton: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#1c130c', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: '#fff', fontWeight: '700' },
});
