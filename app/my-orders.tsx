import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useResponsive } from '../lib/responsive';

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
  timeline?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function prettyStatus(value?: string | null) {
  return String(value || 'awaiting_update').replace(/_/g, ' ');
}

export default function MyOrdersScreen() {
  const params = useLocalSearchParams<{ customerEmail?: string | string[]; customerName?: string | string[] }>();
  const initialEmail = useMemo(() => Array.isArray(params.customerEmail) ? params.customerEmail[0] || '' : params.customerEmail || '', [params.customerEmail]);
  const initialName = useMemo(() => Array.isArray(params.customerName) ? params.customerName[0] || '' : params.customerName || '', [params.customerName]);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerName] = useState(initialName);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const responsive = useResponsive();

  const loadOrders = useCallback(async (emailOverride?: string) => {
    const email = String(emailOverride || customerEmail || '').trim().toLowerCase();
    if (!email) {
      setOrders([]);
      return;
    }
    setMessage('');
    let result = await supabase.from('vendor_orders').select('*').eq('customer_email', email).order('created_at', { ascending: false });
    if (result.error) {
      result = await supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false });
    }
    if (result.error) throw result.error;
    setOrders((result.data || []) as OrderRow[]);
  }, [customerEmail]);

  useFocusEffect(useCallback(() => {
    if (!initialEmail) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        await loadOrders(initialEmail);
      } catch (error: any) {
        if (active) setMessage(error?.message || 'Could not load orders.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [initialEmail, loadOrders]));

  const handleSearch = async () => {
    try {
      setLoading(true);
      await loadOrders();
    } catch (error: any) {
      setMessage(error?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadOrders();
    } catch (error: any) {
      setMessage(error?.message || 'Could not refresh orders.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingHorizontal: responsive.gutter, alignSelf: 'center', width: '100%', maxWidth: responsive.contentMaxWidth }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Text style={styles.eyebrow}>CUSTOMER ORDER TRACKING</Text>
      <Text style={styles.title}>My orders</Text>
      <Text style={styles.subtitle}>Track deposit status, production progress, and final order milestones across mobile, tablet, and web.</Text>

      <View style={styles.searchCard}>
        {!!customerName ? <Text style={styles.welcome}>Welcome, {customerName}</Text> : null}
        <TextInput style={styles.input} placeholder="Enter your order email" autoCapitalize="none" keyboardType="email-address" value={customerEmail} onChangeText={setCustomerEmail} />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}><Text style={styles.primaryButtonText}>Load My Orders</Text></TouchableOpacity>
      </View>

      {!!message ? <View style={styles.card}><Text style={styles.error}>{message}</Text></View> : null}
      {loading ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading your orders...</Text></View> : null}
      {!loading && customerEmail && orders.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No orders found for this email yet.</Text></View> : null}

      <View style={[styles.grid, responsive.isTablet && { justifyContent: 'space-between' }]}> 
        {orders.map((order) => (
          <View key={order.id} style={[styles.card, responsive.isTablet && styles.tabletCard]}>
            <Text style={styles.cardTitle}>{order.design_title || 'Custom jewelry order'}</Text>
            <Text style={styles.meta}>Order #{order.order_number || 'Pending'}</Text>
            <Text style={styles.meta}>Created: {formatDate(order.created_at)}</Text>
            <Text style={styles.status}>Status: {prettyStatus(order.status)}</Text>
            <Text style={styles.detail}>Quote total: ${Number(order.quote_amount || 0).toFixed(2)}</Text>
            <Text style={styles.detail}>Deposit: ${Number(order.deposit_amount || 0).toFixed(2)}</Text>
            <Text style={styles.detail}>Balance: ${Number(order.balance_amount || 0).toFixed(2)}</Text>
            {!!order.timeline ? <Text style={styles.detail}>Timeline: {order.timeline}</Text> : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/payment-center', params: { orderId: order.id, leadId: order.lead_id || '', customerEmail: order.customer_email || customerEmail, customerName: order.customer_name || customerName, designTitle: order.design_title || '' } } as any)}>
              <Text style={styles.secondaryButtonText}>Open Payment Center</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f2ec' },
  content: { paddingVertical: 20, gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, color: '#8b6740' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f1208' },
  subtitle: { fontSize: 15, color: '#5d4835', lineHeight: 22 },
  searchCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  welcome: { fontSize: 16, fontWeight: '700', color: '#2b1d10' },
  input: { borderWidth: 1, borderColor: '#dcccb6', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fff' },
  primaryButton: { backgroundColor: '#1c130c', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { marginTop: 8, borderWidth: 1, borderColor: '#1c130c', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#1c130c', fontWeight: '700' },
  grid: { gap: 12 },
  tabletCard: { width: '48%' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1f1208' },
  meta: { color: '#7a6754' },
  status: { color: '#5a432d', fontWeight: '700', textTransform: 'capitalize' },
  detail: { color: '#413123' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  muted: { color: '#7a6754' },
  error: { color: '#8d2b2b', fontWeight: '700' },
});
