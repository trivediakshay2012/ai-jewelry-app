import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

function parseOptionalJson(value: any) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
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

  const designImages = useMemo(() => {
    const raw =
      Array.isArray(params.designImages) ? params.designImages[0] : params.designImages;
    const parsed = parseOptionalJson(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return designImage ? [designImage] : [];
  }, [params.designImages, designImage]);

  const selectedSpecs = useMemo(() => {
    const raw =
      Array.isArray(params.selectedSpecs) ? params.selectedSpecs[0] : params.selectedSpecs;
    return parseOptionalJson(raw);
  }, [params.selectedSpecs]);

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
  const [errorText, setErrorText] = useState('');

  const approvedManualVendors = useMemo(
    () =>
      vendorDirectory.filter(
        (vendor) => vendor.is_onboarded !== false && vendor.is_suspended !== true
      ),
    [vendorDirectory]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoadingVendors(true);

        const { data } = await supabase
          .from('vendors')
          .select(
            'id, business_name, invite_code, email, subscription_plan, is_onboarded, is_suspended, is_featured'
          );

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
      vendorDirectory.find(
        (vendor) => normalizeText(vendor.business_name) === normalizedVendorName
      ) || null;

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
      setErrorText('');
      console.log('Submit tapped');
  
      const normalizedEmail = customerEmail.trim().toLowerCase();
      const normalizedName = customerName.trim();
      const normalizedPhone = customerPhone.trim() || undefined;
      const resolvedTitle = designTitle || catalogItemTitle || 'Jewelry Quote Request';
  
      if (!normalizedName || !normalizedEmail) {
        setErrorText('Please enter your name and email.');
        showMessage('Missing details', 'Please enter your name and email.');
        return;
      }
  
      let finalVendorId = resolvedVendorId;
      let finalVendorName = resolvedVendorName;
      let finalInviteCode = resolvedInviteCode;
  
      if (!finalVendorId) {
        const ranked = rankVendorsForLead(vendorDirectory as any, { jewelryType });
        const fallbackVendor = ranked?.[0] || approvedManualVendors?.[0] || null;
  
        if (fallbackVendor) {
          finalVendorId = fallbackVendor.id;
          finalVendorName = fallbackVendor.business_name || '';
          finalInviteCode = fallbackVendor.invite_code || '';
        }
      }
  
      if (!finalVendorId) {
        showMessage('No vendor available', 'No vendor is available yet. Please create/select a vendor first.');
        return;
      }
  
      setSubmitting(true);
  
      const payload = {
        vendorId: finalVendorId,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        customerPhone: normalizedPhone,
        designTitle: resolvedTitle,
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
        assignedVendorName: finalVendorName || undefined,
        inviteCode: finalInviteCode || undefined,
        designImages,
        selectedSpecs,
      };
  
      console.log('Submitting payload:', payload);
  
      const savedLead = await saveLead(payload as any);
  
      try {
        await createLocalLead({
          vendor_id: finalVendorId || null,
          invite_code: finalInviteCode || null,
          customer_name: normalizedName,
          customer_email: normalizedEmail,
          customer_phone: normalizedPhone || null,
          design_title: resolvedTitle,
          design_summary: designSummary || null,
          design_image: designImage || designImages?.[0] || null,
          jewelry_type: jewelryType || null,
          metal: metal || null,
          stone: stone || null,
          budget: budget ? Number(budget) : null,
          timeline: timeline.trim() || null,
          notes: notes.trim() || null,
          status: 'submitted',
          source,
          assigned_vendor_name: finalVendorName || null,
          backend_mode: 'supabase',
        } as any);
      } catch (localError) {
        console.log('Local lead mirror skipped:', localError);
      }
  
      createNotificationEvent({
        audience: 'vendor',
        title: 'New lead received',
        body: `${normalizedName} submitted a quote request${resolvedTitle ? ` for ${resolvedTitle}` : ''}.`,
        recipientVendorId: finalVendorId,
        recipientEmail: null,
        referenceType: 'vendor_lead',
        referenceId: savedLead?.id || null,
        metadata: {
          lead_id: savedLead?.id || null,
          customer_name: normalizedName,
          customer_email: normalizedEmail,
          customer_phone: normalizedPhone || null,
          design_title: resolvedTitle,
          design_summary: designSummary || null,
          design_image: designImage || null,
          design_images: designImages?.length ? designImages : null,
          jewelry_type: jewelryType || null,
          metal: metal || null,
          stone: stone || null,
          budget: budget ? Number(budget) : null,
          timeline: timeline.trim() || null,
          notes: notes.trim() || null,
          source,
          routing_mode: routingMode,
          assigned_vendor_name: finalVendorName || null,
          invite_code: finalInviteCode || null,
          selected_specs: selectedSpecs || null,
          status: 'submitted',
        },
      }).catch((e) => console.log('vendor notification skipped', e));
  
      showMessage(
        'Quote request submitted',
        `Your request was submitted successfully${finalVendorName ? ` to ${finalVendorName}` : ''}.`,
        () =>
          router.replace({
            pathname: '/my-quotes',
            params: {
              customerEmail: normalizedEmail,
              customerName: normalizedName,
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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.eyebrow}>REQUEST A QUOTE</Text>
      <Text style={styles.title}>Send your design to a vendor</Text>
      <Text style={styles.subtitle}>
        Share your contact details, timeline, and any notes so the vendor can respond with pricing.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Design</Text>
        <Text style={styles.value}>{designTitle || catalogItemTitle || 'Custom jewelry request'}</Text>
        {!!designSummary && <Text style={styles.mutedText}>{designSummary}</Text>}
        <Text style={styles.meta}>
          Type: {jewelryType || 'Not specified'} • Metal: {metal || 'Not specified'} • Stone: {stone || 'Not specified'}
        </Text>
        {!!budget && <Text style={styles.meta}>Budget: ${budget}</Text>}
        {designImages.length > 0 ? (
          <Text style={styles.meta}>Reference images attached: {designImages.length}</Text>
        ) : null}
      </View>

      <View style={styles.vendorPickerCard}>
        <Text style={styles.label}>Vendor routing</Text>
        <Text style={styles.mutedText}>
          {routingMode === 'customer_selected'
            ? 'You selected a specific vendor.'
            : 'Aurra matched your request to the highest-priority vendor.'}
        </Text>

        <TouchableOpacity
          style={[
            styles.vendorChip,
            routingMode === 'platform_priority' && !vendorIdParam ? styles.vendorChipActive : null,
          ]}
          onPress={() => setRoutingMode('platform_priority')}
        >
          <Text style={styles.vendorChipTitle}>Aurra priority routing</Text>
          <Text style={styles.vendorChipText}>
            Best available vendor match for your jewelry type.
          </Text>
        </TouchableOpacity>

        {approvedManualVendors.map((vendor) => (
          <TouchableOpacity
            key={vendor.id}
            style={[
              styles.vendorChip,
              resolvedVendorId === vendor.id && routingMode === 'customer_selected'
                ? styles.vendorChipActive
                : null,
            ]}
            onPress={() => chooseSpecificVendor(vendor)}
          >
            <Text style={styles.vendorChipTitle}>{vendor.business_name}</Text>
            <Text style={styles.vendorChipText}>
              {vendor.is_featured ? 'Featured vendor' : 'Approved vendor'}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.meta}>
          Selected vendor: {resolvedVendorName || 'No vendor selected yet'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Your details</Text>

        <TextInput
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Your full name"
          style={styles.input}
        />

        <TextInput
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="Your email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Your phone number"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          value={timeline}
          onChangeText={setTimeline}
          placeholder="Preferred timeline"
          style={styles.input}
        />

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything the vendor should know?"
          multiline
          style={[styles.input, styles.multiline]}
        />
      </View>

      {!!errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.primaryButton, submitting && { opacity: 0.65 }]}
        onPress={() => {
          console.log('Submit button pressed');
          handleSubmit();
        }}
        onPressIn={() => console.log('Submit button press-in')}
        disabled={submitting}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Submitting...' : 'Submit Quote Request'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.back()}
        disabled={submitting}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    backgroundColor: '#fff',
  },
  eyebrow: {
    color: '#8a6b2f',
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    color: '#5D5248',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5D2B0',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: '800',
    color: '#111',
    fontSize: 18,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  mutedText: {
    color: '#5D5248',
    lineHeight: 20,
  },
  meta: {
    color: '#6d6258',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8C7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 120 },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    marginTop: 4,
  },
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