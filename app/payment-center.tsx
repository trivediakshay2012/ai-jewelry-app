import * as Linking from 'expo-linking';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { createOrderDraft } from '../lib/orderFlow';
import { createPaymentAmounts, formatMoney, normalizeCurrency } from '../lib/paymentFlow';
import { buildPaymentReturnUrls, createHostedCheckoutSession } from '../lib/stripeCheckout';

type OrderRow = {
  id: string;
  lead_id?: string | null;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  design_title?: string | null;
  quote_amount?: number | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
  status?: string | null;
  timeline?: string | null;
};

type PaymentRow = {
  id: string;
  lead_id?: string | null;
  order_number?: string | null;
  payment_type?: string | null;
  amount?: number | null;
  currency?: string | null;
  memo?: string | null;
  status?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  design_title?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function PaymentCenterScreen() {
  const params = useLocalSearchParams<any>();
  const leadId = useMemo(() => Array.isArray(params.leadId) ? params.leadId[0] || '' : params.leadId || '', [params.leadId]);
  const statusParam = useMemo(() => Array.isArray(params.status) ? params.status[0] || '' : params.status || '', [params.status]);
  const quoteAmount = useMemo(() => Number(Array.isArray(params.quoteAmount) ? params.quoteAmount[0] : params.quoteAmount || 0), [params.quoteAmount]);
  const depositPercent = useMemo(() => Number(Array.isArray(params.depositPercent) ? params.depositPercent[0] : params.depositPercent || 50), [params.depositPercent]);
  const customerName = useMemo(() => Array.isArray(params.customerName) ? params.customerName[0] || '' : params.customerName || '', [params.customerName]);
  const customerEmail = useMemo(() => Array.isArray(params.customerEmail) ? params.customerEmail[0] || '' : params.customerEmail || '', [params.customerEmail]);
  const designTitle = useMemo(() => Array.isArray(params.designTitle) ? params.designTitle[0] || '' : params.designTitle || '', [params.designTitle]);
  const orderIdParam = useMemo(() => Array.isArray(params.orderId) ? params.orderId[0] || '' : params.orderId || '', [params.orderId]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [memo, setMemo] = useState('Custom jewelry payment request');
  const [statusMessage, setStatusMessage] = useState('');

  const fallbackDraft = useMemo(() => createOrderDraft({
    quoteAmount,
    depositPercent,
    leadId,
    customerName,
    designTitle,
  }), [quoteAmount, depositPercent, leadId, customerName, designTitle]);

  const paymentAmounts = useMemo(() => createPaymentAmounts({
    quoteAmount: order?.quote_amount ?? quoteAmount,
    depositPercent,
  }), [order?.quote_amount, quoteAmount, depositPercent]);

  const loadPaymentData = useCallback(async () => {
    try {
      setStatusMessage('');
      setLoading(true);
      let resolvedOrder: OrderRow | null = null;
      if (orderIdParam) {
        const primaryOrder = await supabase.from('vendor_orders').select('*').eq('id', orderIdParam).maybeSingle();
        if (!primaryOrder.error && primaryOrder.data) resolvedOrder = primaryOrder.data as OrderRow;
        if (!resolvedOrder) {
          const fallbackOrder = await supabase.from('orders').select('*').eq('id', orderIdParam).maybeSingle();
          if (!fallbackOrder.error && fallbackOrder.data) resolvedOrder = fallbackOrder.data as OrderRow;
        }
      } else if (leadId) {
        const primaryOrder = await supabase.from('vendor_orders').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!primaryOrder.error && primaryOrder.data) resolvedOrder = primaryOrder.data as OrderRow;
        if (!resolvedOrder) {
          const fallbackOrder = await supabase.from('orders').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (!fallbackOrder.error && fallbackOrder.data) resolvedOrder = fallbackOrder.data as OrderRow;
        }
      }
      setOrder(resolvedOrder);

      let paymentRows: PaymentRow[] = [];
      if (resolvedOrder?.order_number) {
        const primaryPayments = await supabase.from('payment_requests').select('*').eq('order_number', resolvedOrder.order_number).order('created_at', { ascending: false });
        if (!primaryPayments.error) paymentRows = (primaryPayments.data || []) as PaymentRow[];
      }
      if (paymentRows.length === 0 && leadId) {
        const primaryPayments = await supabase.from('payment_requests').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
        if (!primaryPayments.error) paymentRows = (primaryPayments.data || []) as PaymentRow[];
        else {
          const fallbackPayments = await supabase.from('payments').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
          if (!fallbackPayments.error) paymentRows = (fallbackPayments.data || []) as PaymentRow[];
        }
      }
      setPayments(paymentRows);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Could not load payment data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadId, orderIdParam]);

  useEffect(() => { loadPaymentData(); }, [loadPaymentData]);
  useFocusEffect(useCallback(() => { loadPaymentData(); }, [loadPaymentData]));

  useEffect(() => {
    if (!statusParam) return;
    const label = String(statusParam).toLowerCase();
    if (label === 'success') {
      setStatusMessage('Stripe checkout completed. Refreshing your payment status now.');
      loadPaymentData();
    }
    if (label === 'cancelled') {
      setStatusMessage('Stripe checkout was cancelled. You can retry below any time.');
    }
  }, [statusParam, loadPaymentData]);

  const savePaymentRequest = async (kind: 'deposit' | 'full' | 'offline_paid') => {
    const amount = kind === 'full' ? paymentAmounts.total : kind === 'deposit' ? paymentAmounts.deposit : 0;
    const payload = {
      lead_id: order?.lead_id || leadId || null,
      payment_type: kind,
      amount,
      currency: 'usd',
      memo,
      status: kind === 'offline_paid' ? 'paid' : 'requested',
      order_number: order?.order_number || fallbackDraft.orderNumber,
      customer_name: order?.customer_name || customerName || null,
      customer_email: order?.customer_email || customerEmail || null,
      design_title: order?.design_title || designTitle || null,
      created_at: new Date().toISOString(),
    };

    const primary = await supabase.from('payment_requests').insert([payload]).select('*').single();
    if (primary.error) {
      const fallback = await supabase.from('payments').insert([payload]).select('*').single();
      if (fallback.error) throw fallback.error;
      return fallback.data as PaymentRow;
    }
    return primary.data as PaymentRow;
  };

  const updateOrderStatusForPayment = async (kind: 'deposit' | 'full' | 'offline_paid' | 'stripe_started') => {
    if (!order?.id) return;
    const nextStatus = kind === 'deposit'
      ? 'payment_requested'
      : kind === 'full'
        ? 'full_payment_requested'
        : kind === 'offline_paid'
          ? 'paid_offline'
          : 'payment_checkout_started';
    const orderPrimary = await supabase.from('vendor_orders').update({ status: nextStatus }).eq('id', order.id);
    if (orderPrimary.error) await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
  };

  const insertPaymentNotification = async (kind: 'deposit' | 'full' | 'offline_paid' | 'stripe_started') => {
    const titleMap = {
      deposit: 'Deposit requested',
      full: 'Full payment requested',
      offline_paid: 'Payment recorded offline',
      stripe_started: 'Stripe checkout ready',
    } as const;

    const bodyMap = {
      deposit: `A deposit request is ready for ${order?.design_title || designTitle || 'your jewelry order'}.`,
      full: `A full payment request is ready for ${order?.design_title || designTitle || 'your jewelry order'}.`,
      offline_paid: `A payment for ${order?.design_title || designTitle || 'your jewelry order'} was recorded offline.`,
      stripe_started: `A Stripe checkout link is ready for ${order?.design_title || designTitle || 'your jewelry order'}.`,
    } as const;

    await supabase.from('notification_events').insert([{
      audience: 'customer',
      channel: 'in_app',
      title: titleMap[kind],
      body: bodyMap[kind],
      reference_type: 'payment',
      reference_id: order?.order_number || leadId || null,
      recipient_email: order?.customer_email || customerEmail || null,
      status: 'unread',
      created_at: new Date().toISOString(),
    }]);
  };

  const createPaymentRequest = async (kind: 'deposit' | 'full' | 'offline_paid') => {
    try {
      setSaving(true);
      await savePaymentRequest(kind);
      await updateOrderStatusForPayment(kind);
      await insertPaymentNotification(kind);
      Alert.alert('Payment workflow updated', kind === 'offline_paid' ? 'Payment marked as paid.' : 'Payment request saved successfully.');
      await loadPaymentData();
    } catch (error: any) {
      Alert.alert('Payment save issue', error?.message || 'Could not save payment request.');
    } finally {
      setSaving(false);
    }
  };

  const startStripeCheckout = async (kind: 'deposit' | 'full') => {
    try {
      setStripeBusy(true);
      const paymentRow = await savePaymentRequest(kind);
      await updateOrderStatusForPayment('stripe_started');
      await insertPaymentNotification('stripe_started');

      const returnUrls = buildPaymentReturnUrls(order?.lead_id || leadId || null);
      const session = await createHostedCheckoutSession({
        paymentRequestId: paymentRow.id,
        leadId: order?.lead_id || leadId || null,
        orderNumber: order?.order_number || fallbackDraft.orderNumber,
        paymentType: kind,
        amount: Number(paymentRow.amount || 0),
        currency: normalizeCurrency(String(paymentRow.currency || 'usd')),
        customerEmail: paymentRow.customer_email || customerEmail || null,
        customerName: paymentRow.customer_name || customerName || null,
        designTitle: paymentRow.design_title || designTitle || null,
        successUrl: returnUrls.successUrl,
        cancelUrl: returnUrls.cancelUrl,
      });

      await Linking.openURL(session.url);
    } catch (error: any) {
      Alert.alert('Stripe checkout issue', error?.message || 'Could not launch Stripe checkout.');
    } finally {
      setStripeBusy(false);
      await loadPaymentData();
    }
  };

  const markPaymentPaid = async (paymentId: string) => {
    try {
      const primary = await supabase.from('payment_requests').update({ status: 'paid' }).eq('id', paymentId);
      if (primary.error) {
        const fallback = await supabase.from('payments').update({ status: 'paid' }).eq('id', paymentId);
        if (fallback.error) throw fallback.error;
      }
      if (order?.id) {
        const paidTotal = payments.reduce((sum, item) => sum + (item.id === paymentId ? Number(item.amount || 0) : item.status === 'paid' ? Number(item.amount || 0) : 0), 0);
        const nextStatus = paidTotal >= paymentAmounts.total ? 'paid' : 'deposit_paid';
        const orderPrimary = await supabase.from('vendor_orders').update({ status: nextStatus }).eq('id', order.id);
        if (orderPrimary.error) await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
      }
      await loadPaymentData();
    } catch (error: any) {
      Alert.alert('Could not update payment', error?.message || 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPaymentData(); }} />}>
      <Text style={styles.eyebrow}>PAYMENT CENTER</Text>
      <Text style={styles.title}>Collect deposit or full payment</Text>
      <Text style={styles.subtitle}>Use this screen to prepare deposit requests, launch Stripe Checkout, mark payments, and move orders toward production.</Text>

      {(loading && !order) ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading payment center...</Text></View> : null}
      {!!statusMessage ? <View style={styles.infoCard}><Text style={styles.infoText}>{statusMessage}</Text></View> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Project</Text>
        <Text style={styles.detail}>Customer: {order?.customer_name || customerName || 'Customer'}</Text>
        <Text style={styles.detail}>Design: {order?.design_title || designTitle || 'Custom jewelry project'}</Text>
        <Text style={styles.detail}>Order #: {order?.order_number || fallbackDraft.orderNumber}</Text>
        <Text style={styles.detail}>Status: {order?.status || 'awaiting_payment_setup'}</Text>
        {!!order?.timeline ? <Text style={styles.detail}>Timeline: {order.timeline}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amounts</Text>
        <View style={styles.row}><Text style={styles.label}>Quoted total</Text><Text style={styles.value}>{formatMoney(paymentAmounts.total)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Deposit ({depositPercent}%)</Text><Text style={styles.value}>{formatMoney(paymentAmounts.deposit)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Remaining balance</Text><Text style={styles.value}>{formatMoney(paymentAmounts.balance)}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stripe checklist</Text>
        <Text style={styles.detail}>1. Add EXPO_PUBLIC_ADMIN_EMAILS and EXPO_PUBLIC_SUPABASE_ANON_KEY in your app .env</Text>
        <Text style={styles.detail}>2. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Supabase Edge Function secrets</Text>
        <Text style={styles.detail}>3. Deploy create-checkout-session and stripe-webhook</Text>
        <Text style={styles.detail}>4. Add the Stripe webhook endpoint in the Stripe dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment memo</Text>
        <TextInput style={styles.input} value={memo} onChangeText={setMemo} placeholder="Add payment instructions or memo" multiline />
        <View style={styles.actionStack}>
          <TouchableOpacity style={styles.primaryButton} disabled={saving || stripeBusy} onPress={() => createPaymentRequest('deposit')}><Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Deposit Request'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} disabled={saving || stripeBusy} onPress={() => createPaymentRequest('full')}><Text style={styles.secondaryButtonText}>Save Full Payment Request</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} disabled={saving || stripeBusy} onPress={() => startStripeCheckout('deposit')}><Text style={styles.secondaryButtonText}>{stripeBusy ? 'Launching Stripe...' : 'Pay Deposit with Stripe'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} disabled={saving || stripeBusy} onPress={() => startStripeCheckout('full')}><Text style={styles.secondaryButtonText}>Pay Full Amount with Stripe</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} disabled={saving || stripeBusy} onPress={() => createPaymentRequest('offline_paid')}><Text style={styles.secondaryButtonText}>Mark Offline Payment</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment history</Text>
        {payments.length === 0 ? <Text style={styles.muted}>No payment records yet.</Text> : payments.map((payment) => (
          <View key={payment.id} style={styles.paymentRow}>
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentTitle}>{String(payment.payment_type || 'payment').replace(/_/g, ' ')}</Text>
              <Text style={styles.detail}>{formatMoney(Number(payment.amount || 0))} • {payment.status || 'requested'}</Text>
              <Text style={styles.muted}>{formatDate(payment.created_at)}</Text>
              {!!payment.memo ? <Text style={styles.muted}>{payment.memo}</Text> : null}
            </View>
            {payment.status !== 'paid' ? <TouchableOpacity style={styles.smallButton} onPress={() => markPaymentPaid(payment.id)}><Text style={styles.smallButtonText}>Mark Paid</Text></TouchableOpacity> : null}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/notifications-center' as any)}>
        <Text style={styles.footerLinkText}>Open notifications</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f1ea' },
  content: { padding: 20, gap: 16 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#8a6a42' },
  title: { fontSize: 28, fontWeight: '800', color: '#1d1208' },
  subtitle: { fontSize: 15, color: '#5b4632', lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  infoCard: { backgroundColor: '#fff7eb', borderRadius: 16, padding: 14 },
  infoText: { color: '#7b5a2c', fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#201208' },
  detail: { fontSize: 14, color: '#473626' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, color: '#5d4b39' },
  value: { fontSize: 16, fontWeight: '700', color: '#1f1209' },
  input: { minHeight: 92, backgroundColor: '#f8f3ec', borderRadius: 14, padding: 14, fontSize: 15, color: '#22150c', textAlignVertical: 'top' },
  actionStack: { gap: 10 },
  primaryButton: { backgroundColor: '#1d1208', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#1d1208', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#1d1208', fontWeight: '700' },
  paymentRow: { borderTopWidth: 1, borderTopColor: '#eee0d1', paddingTop: 12, flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
  paymentMeta: { flex: 1, gap: 4 },
  paymentTitle: { fontSize: 15, fontWeight: '700', color: '#22150c', textTransform: 'capitalize' },
  muted: { color: '#7a6756' },
  smallButton: { backgroundColor: '#e8d8c1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  smallButtonText: { color: '#1d1208', fontWeight: '700' },
  footerLink: { alignItems: 'center', paddingVertical: 4 },
  footerLinkText: { color: '#7c5b36', fontWeight: '700' },
});
