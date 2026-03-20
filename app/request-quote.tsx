import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rankVendorsForLead } from '../lib/leadPrioritization';
import { createLocalLead } from '../lib/localWorkflowStore';
import { createNotificationEvent } from '../lib/notificationEvents';
import { saveLead } from '../lib/saveLead';
import { supabase } from '../lib/supabase';

type VendorDirectoryRow = {
  id: string;
  business_name: string;
  invite_code: string;
  email?: string | null;
  is_featured?: boolean | null;
  subscription_plan?: string | null;
  is_onboarded?: boolean | null;
  is_suspended?: boolean | null;
};

type RoutingMode = 'customer_selected' | 'platform_priority';

function normalizeText(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function showMessage(title: string, message: string, onDone?: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onDone?.();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: () => onDone?.() }]);
}

export default function RequestQuoteScreen() {
  const params = useLocalSearchParams<any>();

  const vendorIdParam = useMemo(
    () => (Array.isArray(params.vendorId) ? params.vendorId[0] || '' : params.vendorId || ''),
    [params.vendorId]
  );
  const vendorName = useMemo(
    () => (Array.isArray(params.vendorName) ? params.vendorName[0] || '' : params.vendorName || ''),
    [params.vendorName]
  );
  const inviteCode = useMemo(
    () => (Array.isArray(params.inviteCode) ? params.inviteCode[0] || '' : params.inviteCode || ''),
    [params.inviteCode]
  );
  const designTitle = useMemo(
    () => (Array.isArray(params.designTitle) ? params.designTitle[0] || '' : params.designTitle || ''),
    [params.designTitle]
  );
  const designSummary = useMemo(
    () => (Array.isArray(params.designSummary) ? params.designSummary[0] || '' : params.designSummary || ''),
    [params.designSummary]
  );
  const designImage = useMemo(
    () => (Array.isArray(params.designImage) ? params.designImage[0] || '' : params.designImage || ''),
    [params.designImage]
  );
  const jewelryType = useMemo(
    () => (Array.isArray(params.jewelryType) ? params.jewelryType[0] || '' : params.jewelryType || ''),
    [params.jewelryType]
  );
  const metal = useMemo(
    () => (Array.isArray(params.metal) ? params.metal[0] || '' : params.metal || ''),
    [params.metal]
  );
  const stone = useMemo(
    () => (Array.isArray(params.stone) ? params.stone[0] || '' : params.stone || ''),
    [params.stone]
  );
  const budget = useMemo(
    () => (Array.isArray(params.budget) ? params.budget[0] || '' : params.budget || ''),
    [params.budget]
  );
  const source = useMemo(
    () => (Array.isArray(params.source) ? params.source[0] || '' : params.source || 'design_flow'),
    [params.source]
  );
  const catalogItemTitle = useMemo(
    () =>
      Array.isArray(params.catalogItemTitle)
        ? params.catalogItemTitle[0] || ''
        : params.catalogItemTitle || '',
    [params.catalogItemTitle]
  );

  const [vendorDirectory, setVendorDirectory] = useState<VendorDirectoryRow[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [routingMode, setRoutingMode] = useState<RoutingMode>(
    vendorIdParam ? 'customer_selected' : 'platform_priority'
  );

  const [resolvedVendorId, setResolvedVendorId] = useState(vendorIdParam);
  const [resolvedVendorName, setResolvedVendorName] = useState(vendorName);
  const [resolvedInviteCode, setResolvedInviteCode] = useState(inviteCode);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const approvedManualVendors = useMemo(
    () => vendorDirectory.filter((vendor) => vendor.is_onboarded !== false && vendor.is_suspended !== true),
    [vendorDirectory]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoadingVendors(true);

        const { data } = await supabase
          .from('vendors')
          .select('id, business_name, invite_code, email, subscription_plan, is_onboarded, is_suspended, is_featured');

        if (active) {
          setVendorDirectory((data || []) as VendorDirectoryRow[]);
        }
      } catch (error) {
        console.log('Vendor directory load error:', error);
      } finally {
        if (active) setLoadingVendors(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (routingMode !== 'customer_selected') return;

    if (vendorIdParam) {
      setResolvedVendorId(vendorIdParam);
      setResolvedVendorName(vendorName);
      setResolvedInviteCode(inviteCode);
      return;
    }

    if (!vendorName) return;

    const normalizedVendorName = normalizeText(vendorName);
    const matched =
      vendorDirectory.find((vendor) => normalizeText(vendor.business_name) === normalizedVendorName) || null;

    if (matched) {
      setResolvedVendorId(matched.id);
      setResolvedVendorName(matched.business_name);
      setResolvedInviteCode(matched.invite_code);
    }
  }, [routingMode, vendorIdParam, vendorName, inviteCode, vendorDirectory]);

  useEffect(() => {
    if (routingMode !== 'platform_priority' || loadingVendors) return;

    const rankedVendors = rankVendorsForLead(vendorDirectory as any, { jewelryType });
    const chosenVendor = rankedVendors[0] || null;

    if (chosenVendor) {
      setResolvedVendorId(chosenVendor.id);
      setResolvedVendorName(chosenVendor.business_name || 'Vendor');
      setResolvedInviteCode(chosenVendor.invite_code || '');
    } else {
      setResolvedVendorId('');
      setResolvedVendorName('');
      setResolvedInviteCode('');
    }
  }, [routingMode, vendorDirectory, loadingVendors, jewelryType]);

  const chooseSpecificVendor = (vendor: VendorDirectoryRow) => {
    setRoutingMode('customer_selected');
    setResolvedVendorId(vendor.id);
    setResolvedVendorName(vendor.business_name);
    setResolvedInviteCode(vendor.invite_code || '');
  };

  const handleSubmit = async () => {
    try {
      if (!customerName.trim() || !customerEmail.trim()) {
        showMessage('Missing details', 'Please enter your name and email.');
        return;
      }

      if (!resolvedVendorId) {
        showMessage('No vendor available', 'Choose a vendor before submitting.');
        return;
      }

      setSubmitting(true);

      const payload = {
        vendorId: resolvedVendorId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim() || undefined,
        designTitle: designTitle || catalogItemTitle || 'Jewelry Quote Request',
        designSummary: designSummary || undefined,
        designImage: designImage || undefined,
        budget: budget ? Number(budget) : null,
        notes: notes.trim() || undefined,
        timeline: timeline.trim() || undefined,
        jewelryType: jewelryType || undefined,
        metal: metal || undefined,
        stone: stone || undefined,
        source,
        routingMode,
        catalogItemTitle: catalogItemTitle || undefined,
        assignedVendorName: resolvedVendorName || undefined,
        inviteCode: resolvedInviteCode || undefined,
      };

      const savedLead = await saveLead(payload as any);

      try {
        await createLocalLead({
          vendor_id: resolvedVendorId || null,
          invite_code: resolvedInviteCode || null,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.trim() || null,
          design_title: designTitle || catalogItemTitle || 'Jewelry Quote Request',
          design_summary: designSummary || null,
          design_image: designImage || null,
          jewelry_type: jewelryType || null,
          metal: metal || null,
          stone: stone || null,
          budget: budget ? Number(budget) : null,
          timeline: timeline.trim() || null,
          notes: notes.trim() || null,
          status: 'submitted',
          source,
          routing_mode: routingMode,
          assigned_vendor_name: resolvedVendorName || null,
          backend_mode: 'supabase',
        });
      } catch (localError) {
        console.log('Local lead mirror skipped:', localError);
      }

      createNotificationEvent({
        audience: 'vendor',
        title: 'New lead received',
        body: `${customerName.trim()} submitted a quote request${designTitle ? ` for ${designTitle}` : ''}.`,
        recipientVendorId: resolvedVendorId,
        recipientEmail: null,
        referenceType: 'vendor_lead',
        referenceId: savedLead?.id || null,
        metadata: {
          routingMode,
          jewelryType: jewelryType || null,
          leadId: savedLead?.id || null,
        },
      }).catch((e) => console.log('vendor notification skipped', e));

      showMessage(
        'Quote request submitted',
        `Your request was submitted successfully${resolvedVendorName ? ` to ${resolvedVendorName}` : ''}.`,
        () =>
          router.replace({
            pathname: '/my-quotes',
            params: {
              customerEmail: customerEmail.trim().toLowerCase(),
              customerName: customerName.trim(),
            },
          } as any)
      );
    } catch (error: any) {
      console.log('Quote submit error:', error);
      showMessage('Could not submit quote', error?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Request Quote</Text>
      <Text style={styles.subtitle}>
        {resolvedVendorName ? `Send your design directly to ${resolvedVendorName}.` : 'Send your design to a jeweler for review and quote.'}
      </Text>

      <View style={styles.routingCard}>
        <Text style={styles.routingTitle}>How should this request be routed?</Text>

        <TouchableOpacity
          style={[styles.routingOption, routingMode === 'platform_priority' && styles.routingOptionActive]}
          onPress={() => setRoutingMode('platform_priority')}
        >
          <Text style={styles.routingOptionTitle}>Auto-route to priority vendor</Text>
          <Text style={styles.routingOptionText}>Best for platform-driven lead routing.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.routingOption, routingMode === 'customer_selected' && styles.routingOptionActive]}
          onPress={() => setRoutingMode('customer_selected')}
        >
          <Text style={styles.routingOptionTitle}>I want to choose the vendor myself</Text>
          <Text style={styles.routingOptionText}>Use when the customer wants a specific jeweler.</Text>
        </TouchableOpacity>
      </View>

      {routingMode === 'customer_selected' && approvedManualVendors.length > 0 ? (
        <View style={styles.vendorPickerCard}>
          <Text style={styles.routingTitle}>Approved vendors</Text>
          {approvedManualVendors.slice(0, 8).map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              style={[styles.vendorChip, resolvedVendorId === vendor.id && styles.vendorChipActive]}
              onPress={() => chooseSpecificVendor(vendor)}
            >
              <Text style={styles.vendorChipTitle}>{vendor.business_name}</Text>
              <Text style={styles.vendorChipText}>
                {vendor.subscription_plan || 'basic'}
                {vendor.is_featured ? ' • featured' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!!designTitle ? <Text style={styles.snapshot}>Design: {designTitle}</Text> : null}
      {!!catalogItemTitle ? <Text style={styles.snapshot}>Catalog Item: {catalogItemTitle}</Text> : null}
      {!!jewelryType ? <Text style={styles.snapshot}>Type: {jewelryType}</Text> : null}
      {!!metal ? <Text style={styles.snapshot}>Metal: {metal}</Text> : null}
      {!!stone ? <Text style={styles.snapshot}>Stone: {stone}</Text> : null}
      {!!budget ? <Text style={styles.snapshot}>Budget: {budget}</Text> : null}

      <TextInput style={styles.input} placeholder="Full name" value={customerName} onChangeText={setCustomerName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={customerEmail}
        onChangeText={setCustomerEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
      />
      <TextInput style={styles.input} placeholder="Preferred timeline" value={timeline} onChangeText={setTimeline} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notes"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity
        style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting || loadingVendors}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Send Quote Request'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-catalog' as any)}>
        <Text style={styles.secondaryButtonText}>Back to Vendor Catalog</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginTop: 10 },
  subtitle: { color: '#666', marginTop: 8, lineHeight: 22, marginBottom: 12 },
  routingCard: {
    backgroundColor: '#F8F3EA',
    borderWidth: 1,
    borderColor: '#E5D2B0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  routingTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  routingOption: {
    borderWidth: 1,
    borderColor: '#D8C7AA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  routingOptionActive: { borderColor: '#111', backgroundColor: '#FFF8EC' },
  routingOptionTitle: { color: '#111', fontWeight: '700', marginBottom: 6, fontSize: 15 },
  routingOptionText: { color: '#5D5248', lineHeight: 20 },
  snapshot: { color: '#5D5248', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 120 },
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: '#111', fontWeight: '700', fontSize: 15 },
  vendorPickerCard: {
    backgroundColor: '#F8F3EA',
    borderWidth: 1,
    borderColor: '#E5D2B0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  vendorChip: {
    borderWidth: 1,
    borderColor: '#D8C7AA',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  vendorChipActive: { borderColor: '#111', backgroundColor: '#FFF8EC' },
  vendorChipTitle: { fontWeight: '700', color: '#111', fontSize: 15 },
  vendorChipText: { marginTop: 4, color: '#5D5248' },
});