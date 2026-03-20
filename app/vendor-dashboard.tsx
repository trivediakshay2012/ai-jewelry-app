import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthRole } from '../components/AuthRoleContext';
import { hapticTap } from '../lib/haptics';
import { getWorkflowStoreSnapshot } from '../lib/localWorkflowStore';
import { supabase } from '../lib/supabase';
import {
  getLocalizedPlanPricing,
  getVendorPlanConfig,
  normalizePlan,
} from '../lib/vendorSubscriptions';

type Vendor = {
  id: string;
  user_id?: string | null;
  business_name?: string | null;
  invite_code?: string | null;
  country?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  is_featured?: boolean | null;
  is_suspended?: boolean | null;
  monthly_leads_used?: number | null;
};

type Lead = {
  id: string;
  vendor_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  design_title?: string | null;
  design_summary?: string | null;
  jewelry_type?: string | null;
  metal?: string | null;
  stone?: string | null;
  budget?: number | null;
  timeline?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
  backend_mode?: string | null;
  assigned_vendor_name?: string | null;
};

type Quote = {
  id: string;
  lead_id?: string | null;
  vendor_id?: string | null;
  quote_amount?: number | null;
  currency?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type NotificationEvent = {
  id: string;
  event_type?: string | null;
  title?: string | null;
  body?: string | null;
  reference_id?: string | null;
  recipient_vendor_id?: string | null;
  recipient_email?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function sortByCreatedAtDesc<T extends { created_at?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });
}

function buildSyntheticLeadFromNotification(
  event: NotificationEvent,
  currentVendor: Vendor | null
): Lead | null {
  const meta = event.metadata || {};
  const isVendorLeadEvent =
    String(event.event_type || '').toLowerCase().includes('vendor_lead') ||
    String(event.title || '').toLowerCase().includes('new lead');

  if (!isVendorLeadEvent) return null;

  if (
    currentVendor?.id &&
    event.recipient_vendor_id &&
    String(event.recipient_vendor_id) !== String(currentVendor.id)
  ) {
    return null;
  }

  const leadId = meta.lead_id || event.reference_id || `notif-lead-${event.id}`;

  return {
    id: String(leadId),
    vendor_id: currentVendor?.id || null,
    customer_name: meta.customer_name || 'New customer',
    customer_email: meta.customer_email || event.recipient_email || '',
    customer_phone: meta.customer_phone || '',
    design_title: meta.design_title || meta.jewelry_type || 'Custom jewelry request',
    design_summary: meta.design_summary || event.body || '',
    jewelry_type: meta.jewelry_type || '',
    metal: meta.metal || '',
    stone: meta.stone || '',
    budget:
      meta.budget != null && !Number.isNaN(Number(meta.budget))
        ? Number(meta.budget)
        : null,
    timeline: meta.timeline || '',
    notes: meta.notes || '',
    status: meta.status || 'submitted',
    created_at: event.created_at || new Date().toISOString(),
    backend_mode: 'notification_fallback',
    assigned_vendor_name: currentVendor?.business_name || null,
  };
}

export default function VendorDashboardPage() {
  const { user, vendor, isAdmin, loading: authLoading } = useAuthRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [planPricing, setPlanPricing] = useState<any>(null);

  const currentVendor = (vendor as Vendor | null) || null;
  const inFlightRef = useRef(false);

  const loadDashboard = useCallback(
    async (options?: { silent?: boolean }) => {
      if (inFlightRef.current) return;

      try {
        inFlightRef.current = true;
        if (!options?.silent) setLoading(true);
        setError('');

        if (!user?.id || !currentVendor?.id) {
          setLeads([]);
          setQuotes([]);
          setInventoryCount(0);
          setOrdersCount(0);
          setPlanPricing(null);
          return;
        }

        const workflowStore = await getWorkflowStoreSnapshot();

        const localLeads = ((workflowStore.leads || []) as Lead[]).filter((lead) => {
          return (
            String(lead.vendor_id || '') === String(currentVendor.id) ||
            String(lead.assigned_vendor_name || '').trim().toLowerCase() ===
              String(currentVendor.business_name || '').trim().toLowerCase()
          );
        });

        const localQuotes = ((workflowStore.quotes || []) as Quote[]).filter((quote) => {
          return String(quote.vendor_id || '') === String(currentVendor.id);
        });

        const [
          vendorLeadsResult,
          leadsFallbackResult,
          quoteResult,
          inventoryResult,
          orderResult,
          notificationResult,
          pricing,
        ] = await Promise.all([
          supabase
            .from('vendor_leads')
            .select('*')
            .eq('vendor_id', currentVendor.id)
            .order('created_at', { ascending: false })
            .limit(50),

          supabase
            .from('leads')
            .select('*')
            .eq('vendor_id', currentVendor.id)
            .order('created_at', { ascending: false })
            .limit(50),

          supabase
            .from('vendor_quotes')
            .select('*')
            .eq('vendor_id', currentVendor.id)
            .order('created_at', { ascending: false })
            .limit(20),

          supabase
            .from('vendor_catalog')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', currentVendor.id)
            .eq('is_active', true)
            .eq('is_draft', false),

          supabase
            .from('vendor_orders')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', currentVendor.id),

          supabase
            .from('notification_events')
            .select('*')
            .eq('recipient_vendor_id', currentVendor.id)
            .order('created_at', { ascending: false })
            .limit(50),

          getLocalizedPlanPricing(currentVendor.subscription_plan, currentVendor.country),
        ]);

        let remoteLeads: Lead[] = [];
        const vendorLeadsError = vendorLeadsResult.error;
        const leadsFallbackError = leadsFallbackResult.error;

        if (!vendorLeadsError && vendorLeadsResult.data) {
          remoteLeads = [...remoteLeads, ...(vendorLeadsResult.data as Lead[])];
        }

        if (!leadsFallbackError && leadsFallbackResult.data) {
          remoteLeads = [...remoteLeads, ...(leadsFallbackResult.data as Lead[])];
        }

        const notificationLeads =
          !notificationResult.error && notificationResult.data
            ? (notificationResult.data as NotificationEvent[])
                .map((event) => buildSyntheticLeadFromNotification(event, currentVendor))
                .filter(Boolean) as Lead[]
            : [];

        let remoteQuotes: Quote[] = [];
        if (!quoteResult.error && quoteResult.data) {
          remoteQuotes = quoteResult.data as Quote[];
        }

        let orderCount = orderResult.count || 0;
        if (orderResult.error) {
          const fallbackOrderResult = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', currentVendor.id);

          orderCount = fallbackOrderResult.count || 0;
        }

        const mergedLeads = dedupeById(
          sortByCreatedAtDesc([...remoteLeads, ...notificationLeads, ...localLeads])
        );

        const mergedQuotes = dedupeById(
          sortByCreatedAtDesc([...remoteQuotes, ...localQuotes])
        );

        setLeads(mergedLeads);
        setQuotes(mergedQuotes);
        setInventoryCount(inventoryResult.count || 0);
        setOrdersCount(orderCount);
        setPlanPricing(pricing);

        const errors: string[] = [];
        if (vendorLeadsError && !String(vendorLeadsError.message || '').includes('relation')) {
          errors.push(vendorLeadsError.message);
        }
        if (inventoryResult.error) errors.push(inventoryResult.error.message);
        if (notificationResult.error) errors.push(notificationResult.error.message);

        if (errors.length) {
          setError(errors[0]);
        }
      } catch (dashboardError: any) {
        console.error('Vendor dashboard load failed:', dashboardError);
        setError(dashboardError?.message || 'Could not load vendor dashboard.');
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      currentVendor?.business_name,
      currentVendor?.country,
      currentVendor?.id,
      currentVendor?.subscription_plan,
      user?.id,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && currentVendor?.id) {
        loadDashboard({ silent: true });
      }
    }, [authLoading, currentVendor?.id, loadDashboard])
  );

  const onRefresh = async () => {
    if (inFlightRef.current) return;
    setRefreshing(true);
    await loadDashboard({ silent: true });
  };

  const submittedLeadCount = useMemo(
    () =>
      leads.filter((lead) =>
        ['submitted', 'new', 'pending', 'open'].includes(
          String(lead.status || '').toLowerCase()
        )
      ).length,
    [leads]
  );

  const latestLead = leads[0] || null;
  const latestQuote = quotes[0] || null;
  const inviteBaseUrl = process.env.EXPO_PUBLIC_APP_BASE_URL || 'https://aurra.us';
  const inviteLink =
    currentVendor?.invite_code ? `${inviteBaseUrl}/invite/${currentVendor.invite_code}` : '';
  const plan = getVendorPlanConfig(normalizePlan(currentVendor?.subscription_plan));

  const nav = async (path: any) => {
    await hapticTap();
    router.push(path);
  };

  const handleLogout = async () => {
    await hapticTap();
    await supabase.auth.signOut();
    router.replace('/vendor-login' as any);
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading vendor dashboard...</Text>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <View style={styles.guardContainer}>
        <Text style={styles.title}>Vendor login required</Text>
        <Text style={styles.subtitle}>Please sign in to view your dashboard.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/vendor-login' as any)}
        >
          <Text style={styles.primaryButtonText}>Go to Vendor Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isAdmin && !currentVendor) {
    return (
      <View style={styles.guardContainer}>
        <Text style={styles.title}>Admin account detected</Text>
        <Text style={styles.subtitle}>
          This account is marked as admin and does not need a vendor profile. Open the admin dashboard instead.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/admin-dashboard' as any)}
        >
          <Text style={styles.primaryButtonText}>Open Admin Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (user?.id && !currentVendor) {
    return (
      <View style={styles.guardContainer}>
        <Text style={styles.title}>Complete Vendor Setup</Text>
        <Text style={styles.subtitle}>
          Finish vendor signup so your dashboard, invite link, and inventory can activate.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/vendor-signup' as any)}
        >
          <Text style={styles.primaryButtonText}>Complete Vendor Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>VENDOR DASHBOARD</Text>
        <Text style={styles.heroTitle}>
          Welcome back, {currentVendor?.business_name || 'Vendor'}
        </Text>
        <Text style={styles.heroText}>
          Manage approved inventory, priority leads, quotes, subscriptions, and order activity from one dashboard.
        </Text>

        <View style={styles.inviteCard}>
          <Text style={styles.inviteText}>Invite link</Text>
          <Text style={styles.inviteText}>
            {inviteLink || 'Complete vendor setup to get your invite link.'}
          </Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.name} plan</Text>
          <Text style={styles.planText}>
            Status: {currentVendor?.subscription_status || 'trialing'} • Trial ends:{' '}
            {formatDate(currentVendor?.trial_ends_at)}
          </Text>
          <Text style={styles.planText}>
            Billing: {planPricing?.monthlyDisplay || 'Loading pricing...'} / month
          </Text>
          <Text style={styles.planText}>
            Leads: {currentVendor?.monthly_leads_used || 0} /{' '}
            {plan.leadLimit == null ? 'Unlimited' : plan.leadLimit}
          </Text>
          <Text style={styles.planText}>
            Inventory cap: {plan.inventoryLimit == null ? 'Unlimited' : plan.inventoryLimit} • Featured placement:{' '}
            {plan.featuredPlacement ? 'Yes' : 'No'}
          </Text>
          {currentVendor?.is_suspended ? (
            <Text style={styles.warnText}>
              Your vendor account is currently suspended. Contact admin for reactivation.
            </Text>
          ) : null}
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => nav('/vendor-inventory' as any)}
          >
            <Text style={styles.primaryButtonText}>Manage Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => nav('/vendor-catalog' as any)}
          >
            <Text style={styles.secondaryButtonText}>View Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => nav('/vendor-orders' as any)}
          >
            <Text style={styles.secondaryButtonText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => nav('/payment-center' as any)}
          >
            <Text style={styles.secondaryButtonText}>Payment Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => nav('/notifications-center' as any)}
          >
            <Text style={styles.secondaryButtonText}>Notifications</Text>
          </TouchableOpacity>

          {isAdmin ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => nav('/admin-dashboard' as any)}
            >
              <Text style={styles.secondaryButtonText}>Admin</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.smallLabel}>Leads</Text>
          <Text style={styles.bigNumber}>{leads.length}</Text>
          <Text style={styles.muted}>All customer requests</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.smallLabel}>Pending</Text>
          <Text style={styles.bigNumber}>{submittedLeadCount}</Text>
          <Text style={styles.muted}>Needs vendor action</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.smallLabel}>Quotes</Text>
          <Text style={styles.bigNumber}>{quotes.length}</Text>
          <Text style={styles.muted}>Sent to customers</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.smallLabel}>Orders</Text>
          <Text style={styles.bigNumber}>{ordersCount}</Text>
          <Text style={styles.muted}>Converted jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.smallLabel}>Inventory</Text>
          <Text style={styles.bigNumber}>{inventoryCount}</Text>
          <Text style={styles.muted}>Live catalog listings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Leads</Text>

        {latestLead ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Latest lead</Text>
            <Text style={styles.highlightTitle}>
              {latestLead.customer_name || 'New customer'} • {latestLead.status || 'submitted'}
            </Text>
            {!!latestLead.customer_email && (
              <Text style={styles.listMeta}>{latestLead.customer_email}</Text>
            )}
            {!!latestLead.design_title && (
              <Text style={styles.listMeta}>{latestLead.design_title}</Text>
            )}
            {latestLead.budget != null && (
              <Text style={styles.listMeta}>Budget: ${latestLead.budget}</Text>
            )}
          </View>
        ) : null}

        {leads.length === 0 ? (
          <Text style={styles.muted}>
            No leads yet. Share your invite link or upload inventory to start receiving requests.
          </Text>
        ) : (
          leads.map((lead) => (
            <TouchableOpacity
              key={lead.id}
              style={styles.listCard}
              onPress={() =>
                nav({
                  pathname: '/vendor-leads/[leadId]',
                  params: {
                    leadId: lead.id,
                    vendorId: currentVendor?.id || '',
                    customerName: lead.customer_name || '',
                    customerEmail: lead.customer_email || '',
                    customerPhone: lead.customer_phone || '',
                    designTitle: lead.design_title || '',
                    designSummary: lead.design_summary || '',
                    jewelryType: lead.jewelry_type || '',
                    metal: lead.metal || '',
                    stone: lead.stone || '',
                    budget: lead.budget != null ? String(lead.budget) : '',
                    timeline: lead.timeline || '',
                    notes: lead.notes || '',
                    status: lead.status || '',
                  },
                } as any)
              }
            >
              <Text style={styles.listTitle}>
                {lead.customer_name || 'New customer'} • {lead.status || 'submitted'}
              </Text>
              {!!lead.customer_email && <Text style={styles.listMeta}>{lead.customer_email}</Text>}
              {!!lead.customer_phone && <Text style={styles.listMeta}>{lead.customer_phone}</Text>}
              {!!lead.design_title && <Text style={styles.listMeta}>{lead.design_title}</Text>}
              {lead.budget != null && <Text style={styles.listMeta}>Budget: ${lead.budget}</Text>}
              <Text style={styles.linkText}>Open lead → build quote → create order</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Quotes</Text>

        {quotes.length === 0 ? (
          <Text style={styles.muted}>No quotes sent yet.</Text>
        ) : (
          quotes.map((quote) => (
            <TouchableOpacity
              key={quote.id}
              style={styles.listCard}
              onPress={() =>
                nav({
                  pathname: '/payment-center',
                  params: {
                    leadId: quote.lead_id || '',
                    quoteAmount: String(quote.quote_amount || 0),
                    depositPercent: '50',
                  },
                } as any)
              }
            >
              <Text style={styles.listTitle}>
                {quote.currency || '$'} {quote.quote_amount || 0} • {quote.status || 'draft'}
              </Text>
              <Text style={styles.listMeta}>Lead ID: {quote.lead_id}</Text>
              <Text style={styles.linkText}>Open payment center</Text>
            </TouchableOpacity>
          ))
        )}

        {latestQuote ? (
          <Text style={styles.muted}>
            Latest quote ready for payment collection: {latestQuote.currency || '$'}{' '}
            {latestQuote.quote_amount || 0}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  guardContainer: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },

  hero: { backgroundColor: '#17110c', borderRadius: 22, padding: 20, gap: 12 },
  heroLabel: { color: '#d8b06a', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '800' },
  heroText: { color: '#eee', fontSize: 15, lineHeight: 22 },

  inviteCard: { backgroundColor: '#2a2118', borderRadius: 16, padding: 14, gap: 10 },
  inviteText: { color: '#fff', fontSize: 14 },

  planCard: { backgroundColor: '#23180f', borderRadius: 16, padding: 14, gap: 6 },
  planTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  planText: { color: '#efe7da', lineHeight: 20 },
  warnText: { color: '#ffb4b4', fontWeight: '700' },

  heroActions: { gap: 10, marginTop: 6 },

  logoutButton: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#c9a15b',
  },
  logoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  statCard: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: '#e6d8bd',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
  },

  smallLabel: {
    fontSize: 13,
    color: '#8a6b2f',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  bigNumber: { fontSize: 34, fontWeight: '800', color: '#111' },

  section: { gap: 12 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#111' },

  highlightCard: {
    borderWidth: 1,
    borderColor: '#E5D2B0',
    backgroundColor: '#FFF7E8',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#8a6b2f',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  highlightTitle: { fontSize: 18, color: '#111', fontWeight: '800' },

  listCard: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    backgroundColor: '#fff',
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  listMeta: { fontSize: 14, color: '#555' },
  linkText: { fontSize: 13, color: '#8a6b2f', fontWeight: '700', marginTop: 4 },

  title: { fontSize: 32, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 16, color: '#555', lineHeight: 24 },
  muted: { color: '#666' },
  error: { color: '#b42318', fontSize: 14 },

  primaryButton: {
    backgroundColor: '#c9a15b',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#111', fontWeight: '700', fontSize: 16 },
});