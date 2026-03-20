import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../components/AuthRoleContext';
import { supabase } from '../lib/supabase';

type VendorOrder = {
  id: string;
  vendor_id?: string | null;
  lead_id?: string | null;
  order_number?: string | null;
  customer_name?: string | null;
  design_title?: string | null;
  quote_amount?: number | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
  status?: string | null;
  timeline?: string | null;
};

export default function VendorOrdersScreen() {
  const { vendor } = useAuthRole();
  const currentVendorId = String(vendor?.id || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadOrders = async () => {
    try {
      setError('');
      setStatusMessage('');

      if (!currentVendorId) {
        setOrders([]);
        setError('Please log in as a vendor to view your orders.');
        return;
      }

      const primary = await supabase
        .from('vendor_orders')
        .select('*')
        .eq('vendor_id', currentVendorId)
        .order('created_at', { ascending: false });
      let rows = primary.data as VendorOrder[] | null;
      let err = primary.error;
      if (err) {
        const fallback = await supabase
          .from('orders')
          .select('*')
          .eq('vendor_id', currentVendorId)
          .order('created_at', { ascending: false });
        rows = fallback.data as VendorOrder[] | null;
        err = fallback.error;
      }
      if (err) throw err;
      setOrders(rows || []);
    } catch (error: any) {
      setError(error?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, [currentVendorId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setStatusMessage('Updating order...');
      const primary = await supabase.from('vendor_orders').update({ status }).eq('id', orderId).eq('vendor_id', currentVendorId);
      const err = primary.error ? (await supabase.from('orders').update({ status }).eq('id', orderId).eq('vendor_id', currentVendorId)).error : null;
      if (primary.error && err) throw err;
      setStatusMessage(`Order updated to ${status.replace(/_/g, ' ')}.`);
      await loadOrders();
    } catch (error: any) {
      setError(error?.message || 'Could not update order.');
      Alert.alert('Could not update order', error?.message || 'Please try again.');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading orders...</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}>
      <Text style={styles.eyebrow}>ORDER SYSTEM</Text>
      <Text style={styles.title}>Vendor orders</Text>
      <Text style={styles.subtitle}>Only orders assigned to the logged-in vendor are shown here for safer MVP data isolation.</Text>
      {!!statusMessage ? <View style={styles.card}><Text style={styles.success}>{statusMessage}</Text></View> : null}
      {!!error ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Text style={styles.muted}>If this is a missing table error, run the SQL file included in the project.</Text></View> : null}
      {orders.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No orders yet.</Text></View> : orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text style={styles.cardTitle}>{order.order_number || 'Order draft'}</Text>
          <Text style={styles.detail}>{order.customer_name || 'Customer'}</Text>
          <Text style={styles.detail}>{order.design_title || 'Custom jewelry project'}</Text>
          <Text style={styles.detail}>Status: {order.status || 'pending'}</Text>
          {!!order.quote_amount ? <Text style={styles.detail}>Total: ${order.quote_amount}</Text> : null}
          {!!order.deposit_amount ? <Text style={styles.detail}>Deposit: ${order.deposit_amount}</Text> : null}
          {!!order.balance_amount ? <Text style={styles.detail}>Balance: ${order.balance_amount}</Text> : null}
          {!!order.timeline ? <Text style={styles.detail}>Timeline: {order.timeline}</Text> : null}
          <View style={styles.row}>
            <TouchableOpacity style={styles.actionButton} onPress={() => updateOrderStatus(order.id, 'in_production')}><Text style={styles.actionButtonText}>Start Production</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => updateOrderStatus(order.id, 'ready_for_delivery')}><Text style={styles.actionButtonText}>Ready</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => updateOrderStatus(order.id, 'completed')}><Text style={styles.actionButtonText}>Complete</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={() => require('expo-router').router.push({ pathname: '/payment-center', params: { orderId: order.id, leadId: order.lead_id || '', quoteAmount: String(order.quote_amount || 0), customerName: order.customer_name || '', designTitle: order.design_title || '' } } as any)}><Text style={styles.actionButtonText}>Open Payment Center</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#8a6b2f', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', lineHeight: 21 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EADAC0', borderRadius: 18, padding: 16, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  detail: { fontSize: 14, color: '#444' },
  muted: { color: '#666' },
  error: { color: '#b42318' },
  success: { color: '#067647', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: { flex: 1, borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { color: '#111', fontWeight: '700' },
});
