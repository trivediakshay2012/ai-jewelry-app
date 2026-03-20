import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { listLocalLeadsByEmail, listLocalOrdersByEmail } from '../lib/localWorkflowStore';
import { supabase } from '../lib/supabase';
import { useResponsive } from '../lib/responsive';

type LeadRow = {
  id: string;
  vendor_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  design_title?: string | null;
  design_summary?: string | null;
  budget?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type QuoteRow = {
  id: string;
  lead_id: string;
  vendor_id?: string | null;
  quote_amount?: number | null;
  currency?: string | null;
  timeline?: string | null;
  notes?: string | null;
  deposit_percent?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type OrderRow = {
  id: string;
  lead_id?: string | null;
  order_number?: string | null;
  quote_amount?: number | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
  timeline?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function MyQuotesScreen() {
  const params = useLocalSearchParams<{ customerEmail?: string | string[]; customerName?: string | string[] }>();
  const initialEmail = useMemo(() => Array.isArray(params.customerEmail) ? params.customerEmail[0] || '' : params.customerEmail || '', [params.customerEmail]);
  const initialName = useMemo(() => Array.isArray(params.customerName) ? params.customerName[0] || '' : params.customerName || '', [params.customerName]);

  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [message, setMessage] = useState('');
  const responsive = useResponsive();

  const loadQuotes = useCallback(async (emailOverride?: string) => {
    const email = (emailOverride || customerEmail || '').trim().toLowerCase();
    if (!email) return;

    let leadList: LeadRow[] = [];
    let quoteList: QuoteRow[] = [];
    let orderRows: OrderRow[] = [];
    let loadError: any = null;

    try {
      const { data: leadRows, error: leadError } = await supabase
        .from('vendor_leads')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });
      if (leadError) throw leadError;

      leadList = (leadRows || []) as LeadRow[];
      const leadIds = leadList.map((lead) => lead.id).filter(Boolean);

      if (leadIds.length > 0) {
        const { data: quoteRows, error: quoteError } = await supabase
          .from('vendor_quotes')
          .select('*')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false });
        if (quoteError) throw quoteError;
        quoteList = (quoteRows || []) as QuoteRow[];

        const primaryOrders = await supabase.from('vendor_orders').select('*').in('lead_id', leadIds).order('created_at', { ascending: false });
        if (!primaryOrders.error) {
          orderRows = (primaryOrders.data || []) as OrderRow[];
        } else {
          const fallbackOrders = await supabase.from('orders').select('*').in('lead_id', leadIds).order('created_at', { ascending: false });
          if (!fallbackOrders.error) orderRows = (fallbackOrders.data || []) as OrderRow[];
        }
      }
    } catch (error) {
      loadError = error;
      console.log('MyQuotes: supabase load failed, using local fallback', error);
    }

    const localLeads = await listLocalLeadsByEmail(email);
    const localOrders = await listLocalOrdersByEmail(email);

    const mergedLeads = [...leadList, ...localLeads.filter((localLead) => !leadList.some((lead) => lead.id === localLead.id))]
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    const mergedOrders = [...orderRows, ...localOrders.filter((localOrder) => !orderRows.some((order) => order.id === localOrder.id))]
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    setLeads(mergedLeads);
    setQuotes(quoteList);
    setOrders(mergedOrders);

    if (loadError && mergedLeads.length === 0 && mergedOrders.length === 0) throw loadError;
  }, [customerEmail]);

  useEffect(() => {
    if (!initialEmail) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        await loadQuotes(initialEmail);
      } catch (error: any) {
        if (active) setMessage(error?.message || 'Could not load quotes.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [initialEmail, loadQuotes]);

  const quotesByLeadId = useMemo(() => {
    return quotes.reduce<Record<string, QuoteRow>>((acc, quote) => {
      if (!acc[quote.lead_id]) acc[quote.lead_id] = quote;
      return acc;
    }, {});
  }, [quotes]);

  const ordersByLeadId = useMemo(() => {
    return orders.reduce<Record<string, OrderRow>>((acc, order) => {
      if (order.lead_id && !acc[order.lead_id]) acc[order.lead_id] = order;
      return acc;
    }, {});
  }, [orders]);

  const handleSearch = async () => {
    try {
      if (!customerEmail.trim()) {
        Alert.alert('Email needed', 'Enter the same email you used for your quote request.');
        return;
      }
      setMessage('');
      setLoading(true);
      await loadQuotes();
    } catch (error: any) {
      setMessage(error?.message || 'Could not load quotes.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadQuotes();
    } catch (error: any) {
      setMessage(error?.message || 'Could not refresh quotes.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptQuote = async (lead: LeadRow, quote: QuoteRow) => {
    try {
      const depositPercent = Number(quote.deposit_percent || 50);
      const total = Number(quote.quote_amount || 0);
      const depositAmount = Number(((total * depositPercent) / 100).toFixed(2));
      const balanceAmount = Number((total - depositAmount).toFixed(2));
      const orderNumber = `ORD-${String(lead.id).slice(0, 8).toUpperCase()}`;
      const orderPayload = {
        vendor_id: lead.vendor_id || quote.vendor_id || null,
        lead_id: lead.id,
        customer_name: lead.customer_name || null,
        customer_email: lead.customer_email || null,
        design_title: lead.design_title || 'Custom jewelry project',
        quote_amount: total,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        order_number: orderNumber,
        timeline: quote.timeline || null,
        status: 'awaiting_deposit',
        summary: quote.notes || lead.design_summary || null,
        created_at: new Date().toISOString(),
      };

      const primaryOrder = await supabase.from('vendor_orders').insert([orderPayload]);
      const orderError = primaryOrder.error ? (await supabase.from('orders').insert([orderPayload])).error : null;
      if (primaryOrder.error && orderError) throw orderError;

      const quoteUpdate = await supabase.from('vendor_quotes').update({ status: 'accepted_by_customer' }).eq('id', quote.id);
      if (quoteUpdate.error) throw quoteUpdate.error;
      const leadUpdate = await supabase.from('vendor_leads').update({ status: 'order_created' }).eq('id', lead.id);
      if (leadUpdate.error) throw leadUpdate.error;

      Alert.alert('Quote accepted', 'Your order has been created. Next step: pay the deposit.');
      await loadQuotes();
      router.push({ pathname: '/payment-center', params: { leadId: lead.id, quoteAmount: String(total), depositPercent: String(depositPercent) } } as any);
    } catch (error: any) {
      Alert.alert('Could not accept quote', error?.message || 'Please try again.');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingHorizontal: responsive.gutter, alignSelf: 'center', width: '100%', maxWidth: responsive.contentMaxWidth }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.eyebrow}>CUSTOMER QUOTE INBOX</Text>
      <Text style={styles.title}>My quotes</Text>
      <Text style={styles.subtitle}>Track every quote request, vendor response, and order status in one place.</Text>

      <View style={styles.searchCard}>
        {!!customerName ? <Text style={styles.welcome}>Welcome, {customerName}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Enter your quote email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={customerEmail}
          onChangeText={setCustomerEmail}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
          <Text style={styles.primaryButtonText}>Load My Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/my-orders', params: { customerEmail, customerName } } as any)}>
          <Text style={styles.secondaryButtonText}>Open My Orders</Text>
        </TouchableOpacity>
      </View>

      {!!message ? <View style={styles.infoBox}><Text style={styles.infoText}>{message}</Text></View> : null}
      {loading ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading your quotes...</Text></View> : null}

      {!loading && customerEmail && leads.length === 0 ? (
        <View style={styles.card}><Text style={styles.muted}>No quote requests found for this email yet.</Text></View>
      ) : null}

      {leads.map((lead) => {
        const quote = quotesByLeadId[lead.id];
        const order = ordersByLeadId[lead.id];
        return (
          <View key={lead.id} style={styles.card}>
            <Text style={styles.cardTitle}>{lead.design_title || 'Custom jewelry request'}</Text>
            <Text style={styles.meta}>Requested on {formatDate(lead.created_at)}</Text>
            <Text style={styles.detail}>Lead status: {lead.status || 'submitted'}</Text>
            {!!lead.budget ? <Text style={styles.detail}>Budget: ${lead.budget}</Text> : null}
            {!!lead.design_summary ? <Text style={styles.summary}>{lead.design_summary}</Text> : null}

            {quote ? (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteTitle}>Vendor quote received</Text>
                <Text style={styles.detail}>Price: {quote.currency || '$'} {quote.quote_amount || 0}</Text>
                {!!quote.timeline ? <Text style={styles.detail}>Timeline: {quote.timeline}</Text> : null}
                {!!quote.deposit_percent ? <Text style={styles.detail}>Deposit: {quote.deposit_percent}%</Text> : null}
                {!!quote.notes ? <Text style={styles.summary}>{quote.notes}</Text> : null}
                <Text style={styles.meta}>Quote status: {quote.status || 'sent'}</Text>
                {!!order ? <Text style={styles.detail}>Order status: {order.status || 'awaiting_deposit'}</Text> : null}
                {!order && quote.status !== 'accepted_by_customer' ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={() => handleAcceptQuote(lead, quote)}>
                    <Text style={styles.primaryButtonText}>Accept Quote & Create Order</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.quoteBox}><Text style={styles.muted}>Waiting for vendor response.</Text></View>
            )}

            {order ? (
              <View style={styles.orderBox}>
                <Text style={styles.quoteTitle}>Order ready</Text>
                <Text style={styles.detail}>Order: {order.order_number || 'Order draft'}</Text>
                {!!order.quote_amount ? <Text style={styles.detail}>Total: ${order.quote_amount}</Text> : null}
                {!!order.deposit_amount ? <Text style={styles.detail}>Deposit due: ${order.deposit_amount}</Text> : null}
                {!!order.balance_amount ? <Text style={styles.detail}>Balance: ${order.balance_amount}</Text> : null}
                {!!order.timeline ? <Text style={styles.detail}>Timeline: {order.timeline}</Text> : null}
                <Text style={styles.meta}>Order status: {order.status || 'awaiting_deposit'}</Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/payment-center', params: { leadId: lead.id, quoteAmount: String(order.quote_amount || quote?.quote_amount || 0), depositPercent: String(quote?.deposit_percent || 50) } } as any)}>
                  <Text style={styles.secondaryButtonText}>Open Payment Center</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  center: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  eyebrow: { color: '#8a6b2f', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', lineHeight: 22 },
  searchCard: { borderWidth: 1, borderColor: '#E5D2B0', borderRadius: 18, padding: 16, backgroundColor: '#FFF8EC', gap: 12 },
  welcome: { fontSize: 16, fontWeight: '700', color: '#111' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fff' },
  card: { borderWidth: 1, borderColor: '#EADAC0', borderRadius: 18, padding: 16, gap: 8, backgroundColor: '#fff' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  quoteBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 14, padding: 12, gap: 6, backgroundColor: '#FCFCFC' },
  orderBox: { borderWidth: 1, borderColor: '#ABEFC6', borderRadius: 14, padding: 12, gap: 6, backgroundColor: '#ECFDF3' },
  quoteTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  detail: { color: '#444', fontSize: 14 },
  summary: { color: '#555', lineHeight: 20 },
  meta: { color: '#666', fontSize: 13 },
  muted: { color: '#666' },
  infoBox: { backgroundColor: '#FFF7E8', borderWidth: 1, borderColor: '#E5D2B0', borderRadius: 14, padding: 14 },
  infoText: { color: '#5D5248' },
  primaryButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#111', fontWeight: '700', fontSize: 15 },
});
