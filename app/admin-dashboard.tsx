
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../components/AuthRoleContext';
import { getWorkflowStoreSnapshot } from '../lib/localWorkflowStore';
import { supabase } from '../lib/supabase';
import { setRemoteProductApproval } from '../lib/vendorCatalogStore';
import { getVendorPlanConfig, normalizePlan } from '../lib/vendorSubscriptions';

type VendorRow = {
  id: string;
  business_name?: string | null;
  email?: string | null;
  country?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  is_onboarded?: boolean | null;
  is_featured?: boolean | null;
  is_suspended?: boolean | null;
  monthly_leads_used?: number | null;
  average_response_hours?: number | null;
  created_at?: string | null;
};

type LeadRow = { id: string; customer_name?: string | null; assigned_vendor_name?: string | null; status?: string | null; created_at?: string | null };
type QuoteRow = { id: string; quote_amount?: number | null; status?: string | null; created_at?: string | null };
type OrderRow = { id: string; order_number?: string | null; status?: string | null; created_at?: string | null };
type PaymentRow = { id: string; amount?: number | null; status?: string | null; created_at?: string | null };
type CatalogRow = { id: string; title?: string | null; vendor_name?: string | null; is_approved?: boolean | null; is_active?: boolean | null; created_at?: string | null };


export default function AdminDashboardScreen() {
  const { isAdmin, loading: roleLoading, adminEmails, user } = useAuthRole();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogRow[]>([]);

  const loadAdminData = useCallback(async () => {
    try {
      setMessage('');
      const [vendorsResult, leadsResult, quotesResult, ordersPrimary, paymentsPrimary, catalogResult, localSnapshot] = await Promise.all([
        supabase.from('vendors').select('id, business_name, email, country, subscription_plan, subscription_status, is_onboarded, is_featured, is_suspended, monthly_leads_used, average_response_hours, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendor_leads').select('id, customer_name, assigned_vendor_name, status, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendor_quotes').select('id, quote_amount, status, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendor_orders').select('id, order_number, status, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('payment_requests').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendor_catalog').select('id, title, vendor_name, is_approved, is_active, created_at').order('created_at', { ascending: false }).limit(50),
        getWorkflowStoreSnapshot(),
      ]);
      let orderRows = ordersPrimary.data as OrderRow[] | null;
      let paymentRows = paymentsPrimary.data as PaymentRow[] | null;
      if (ordersPrimary.error) {
        const ordersFallback = await supabase.from('orders').select('id, order_number, status, created_at').order('created_at', { ascending: false }).limit(50);
        orderRows = ordersFallback.data as OrderRow[] | null;
      }
      if (paymentsPrimary.error) {
        const paymentsFallback = await supabase.from('payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(50);
        paymentRows = paymentsFallback.data as PaymentRow[] | null;
      }
      if (vendorsResult.error) throw vendorsResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (quotesResult.error) throw quotesResult.error;
      if (catalogResult.error) throw catalogResult.error;
      const remoteLeads = (leadsResult.data || []) as LeadRow[];
      const localLeads = (localSnapshot?.leads || []).map((lead: any) => ({
        id: String(lead.id),
        customer_name: lead.customer_name,
        assigned_vendor_name: lead.assigned_vendor_name,
        status: lead.status,
        created_at: lead.created_at,
      }));
      const mergedLeads = [...remoteLeads, ...localLeads.filter((local: any) => !remoteLeads.some((remote) => String(remote.id) === String(local.id)))].sort((a: any, b: any) => new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime());
      const remoteOrders = orderRows || [];
      const localOrders = (localSnapshot?.orders || []).map((order: any) => ({
        id: String(order.id),
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
      }));
      const mergedOrders = [...remoteOrders, ...localOrders.filter((local: any) => !remoteOrders.some((remote: any) => String(remote.id) == String(local.id)))].sort((a: any, b: any) => new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime());
      setVendors((vendorsResult.data || []) as VendorRow[]);
      setLeads(mergedLeads as LeadRow[]);
      setQuotes((quotesResult.data || []) as QuoteRow[]);
      setOrders(mergedOrders as OrderRow[]);
      setPayments(paymentRows || []);
      setCatalogItems((catalogResult.data || []) as CatalogRow[]);
    } catch (error: any) {
      setMessage(error?.message || 'Could not load admin dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadAdminData(); }, [isAdmin, loadAdminData]);

  const updateVendor = async (vendorId: string, patch: Record<string, any>, successMessage: string) => {
    try {
      const result = await supabase.from('vendors').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', vendorId).select('id').single();
      if (result.error) throw result.error;
      setVendors((prev) => prev.map((vendor) => (vendor.id === vendorId ? { ...vendor, ...patch } : vendor)));
      setMessage(successMessage);
      await loadAdminData();
      Alert.alert('Updated', successMessage);
    } catch (error: any) {
      Alert.alert('Could not update vendor', error?.message || 'Please try again.');
    }
  };

  const approveProduct = async (productId: string, isApproved: boolean) => {
    try {
      await setRemoteProductApproval(productId, { isApproved });
      await loadAdminData();
    } catch (error: any) {
      Alert.alert('Could not update product approval', error?.message || 'Please try again.');
    }
  };

  const pendingVendors = useMemo(() => vendors.filter((item) => item.is_onboarded !== true || ['pending', 'needs_review', 'under_review'].includes(String(item.subscription_status || '').toLowerCase())).length, [vendors]);
  const pendingLeads = useMemo(() => leads.filter((item) => ['submitted', 'new'].includes(String(item.status || '').toLowerCase())).length, [leads]);
  const pendingPayments = useMemo(() => payments.filter((item) => !['paid'].includes(String(item.status || '').toLowerCase())).length, [payments]);
  const pendingCatalog = useMemo(() => catalogItems.filter((item) => item.is_active !== false && item.is_approved !== true).length, [catalogItems]);

  if (roleLoading) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Checking admin access...</Text></View>;
  if (!isAdmin) {
    return <View style={styles.guardCard}><Text style={styles.title}>Admin access required</Text><Text style={styles.subtitle}>Set your account role to admin in the profiles table or add your email to EXPO_PUBLIC_ADMIN_EMAILS.</Text><Text style={styles.muted}>Signed in as: {user?.email || 'Not signed in'}</Text><Text style={styles.muted}>Configured admin emails: {adminEmails.join(', ') || 'None yet'}</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAdminData(); }} />}>
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>Platform control center</Text>
      <Text style={styles.subtitle}>Approve vendors and products, manage subscriptions, suspend accounts, and monitor leads, orders, and payments.</Text>

      {!!message ? <View style={styles.card}><Text style={styles.error}>{message}</Text></View> : null}
      {loading ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading admin dashboard...</Text></View> : null}

      <View style={styles.grid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Vendors</Text><Text style={styles.statValue}>{vendors.length}</Text><Text style={styles.muted}>Total onboarded + pending</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Pending vendors</Text><Text style={styles.statValue}>{pendingVendors}</Text><Text style={styles.muted}>Needs review</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Catalog</Text><Text style={styles.statValue}>{catalogItems.length}</Text><Text style={styles.muted}>{pendingCatalog} pending approval</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Leads</Text><Text style={styles.statValue}>{leads.length}</Text><Text style={styles.muted}>{pendingLeads} waiting</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Orders</Text><Text style={styles.statValue}>{orders.length}</Text><Text style={styles.muted}>Created jobs</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Payments</Text><Text style={styles.statValue}>{payments.length}</Text><Text style={styles.muted}>{pendingPayments} open requests</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendor approvals & subscriptions</Text>
        {vendors.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No vendors yet.</Text></View> : vendors.slice(0, 14).map((vendor) => {
          const plan = getVendorPlanConfig(normalizePlan(vendor.subscription_plan));
          return (
            <View key={vendor.id} style={styles.card}>
              <Text style={styles.cardTitle}>{vendor.business_name || 'Vendor'}</Text>
              <Text style={styles.muted}>{vendor.email || '—'} • {vendor.country || '—'}</Text>
              <Text style={styles.muted}>Plan: {plan.name} • Status: {vendor.subscription_status || 'pending'} • Onboarded: {vendor.is_onboarded ? 'Yes' : 'No'}</Text>
              <Text style={styles.muted}>Featured: {vendor.is_featured ? 'Yes' : 'No'} • Suspended: {vendor.is_suspended ? 'Yes' : 'No'}</Text>
              <Text style={styles.muted}>Lead cap: {plan.leadLimit == null ? 'Unlimited' : plan.leadLimit} • Inventory cap: {plan.inventoryLimit == null ? 'Unlimited' : plan.inventoryLimit}</Text>
              <View style={styles.actionRow}>
                {!vendor.is_onboarded ? <TouchableOpacity style={styles.actionButton} onPress={() => updateVendor(vendor.id, { is_onboarded: true, subscription_status: 'active', stripe_onboarding_complete: true, payouts_enabled: true }, 'Vendor approved and made eligible for routing.') }><Text style={styles.actionText}>Approve</Text></TouchableOpacity> : null}
                <TouchableOpacity style={styles.secondaryActionButton} onPress={() => updateVendor(vendor.id, { subscription_plan: 'basic' }, 'Moved to Basic plan.') }><Text style={styles.secondaryActionText}>Basic</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionButton} onPress={() => updateVendor(vendor.id, { subscription_plan: 'pro' }, 'Moved to Pro plan.') }><Text style={styles.secondaryActionText}>Pro</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionButton} onPress={() => updateVendor(vendor.id, { subscription_plan: 'premium' }, 'Moved to Premium plan.') }><Text style={styles.secondaryActionText}>Premium</Text></TouchableOpacity>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryActionButton} onPress={() => updateVendor(vendor.id, { is_featured: !vendor.is_featured }, vendor.is_featured ? 'Vendor unfeatured.' : 'Vendor marked featured.') }><Text style={styles.secondaryActionText}>{vendor.is_featured ? 'Unfeature' : 'Feature'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryActionButton, vendor.is_suspended && styles.warnButton]} onPress={() => updateVendor(vendor.id, { is_suspended: !vendor.is_suspended }, vendor.is_suspended ? 'Vendor reactivated.' : 'Vendor suspended.') }><Text style={[styles.secondaryActionText, vendor.is_suspended && styles.warnButtonText]}>{vendor.is_suspended ? 'Reactivate' : 'Suspend'}</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catalog approvals</Text>
        {catalogItems.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No catalog items yet.</Text></View> : catalogItems.slice(0, 12).map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title || 'Untitled product'}</Text>
            <Text style={styles.muted}>{item.vendor_name || 'Vendor'} • {item.is_active ? 'Active' : 'Hidden'} • {item.is_approved ? 'Approved' : 'Pending approval'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => approveProduct(item.id, !(item.is_approved ?? false))}><Text style={styles.actionText}>{item.is_approved ? 'Unapprove' : 'Approve Product'}</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f2ec' },
  content: { padding: 20, gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, color: '#8b6740' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f1208' },
  subtitle: { fontSize: 15, color: '#5d4835', lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '31%', minWidth: 160, backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 6 },
  statLabel: { color: '#8b6740', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { color: '#1f1208', fontSize: 26, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1f1208' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#201208' },
  muted: { color: '#7a6754' },
  error: { color: '#8d2b2b', fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  guardCard: { flex: 1, justifyContent: 'center', padding: 24, gap: 10, backgroundColor: '#f7f2ec' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  actionButton: { backgroundColor: '#1c130c', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: '#fff', fontWeight: '700' },
  secondaryActionButton: { borderWidth: 1, borderColor: '#1c130c', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryActionText: { color: '#1c130c', fontWeight: '700' },
  warnButton: { borderColor: '#b42318' },
  warnButtonText: { color: '#b42318' },
});
