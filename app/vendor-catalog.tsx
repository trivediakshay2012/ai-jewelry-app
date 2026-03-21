import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesign } from '../context/DesignContext';
import { hapticSuccess, hapticTap, hapticWarning } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import { getCatalogInventory, VendorStockItem } from '../lib/vendorInventory';

type VendorDirectoryRow = {
  id: string;
  business_name: string;
  invite_code: string;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  stripe_onboarding_complete?: boolean | null;
  payouts_enabled?: boolean | null;
  is_onboarded?: boolean | null;
};

function normalizeText(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}


function showMessage(title: string, message: string) {
  if (typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function VendorCatalogScreen() {
  const router = useRouter();
  const { addToCart, applyVendorInspiration, cartItems } = useDesign();
  const params = useLocalSearchParams<any>();
  const quoteContext = useMemo(() => ({
    returnToQuote: Array.isArray(params.returnToQuote) ? params.returnToQuote[0] : params.returnToQuote,
    vendorId: Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId,
    vendorName: Array.isArray(params.vendorName) ? params.vendorName[0] : params.vendorName,
    inviteCode: Array.isArray(params.inviteCode) ? params.inviteCode[0] : params.inviteCode,
    designTitle: Array.isArray(params.designTitle) ? params.designTitle[0] : params.designTitle,
    designSummary: Array.isArray(params.designSummary) ? params.designSummary[0] : params.designSummary,
    designImage: Array.isArray(params.designImage) ? params.designImage[0] : params.designImage,
    jewelryType: Array.isArray(params.jewelryType) ? params.jewelryType[0] : params.jewelryType,
    metal: Array.isArray(params.metal) ? params.metal[0] : params.metal,
    stone: Array.isArray(params.stone) ? params.stone[0] : params.stone,
    budget: Array.isArray(params.budget) ? params.budget[0] : params.budget,
    source: Array.isArray(params.source) ? params.source[0] : params.source,
    leadSourceDetail: Array.isArray(params.leadSourceDetail) ? params.leadSourceDetail[0] : params.leadSourceDetail,
    designImages: Array.isArray(params.designImages) ? params.designImages[0] : params.designImages,
    selectedSpecs: Array.isArray(params.selectedSpecs) ? params.selectedSpecs[0] : params.selectedSpecs,
  }), [params]);

  const isChoosingVendorForQuote = quoteContext.returnToQuote === '1';
  const scopedVendorId = String(quoteContext.vendorId || '').trim();
  const scopedInviteCode = String(quoteContext.inviteCode || '').trim();
  const [vendorDirectory, setVendorDirectory] = useState<VendorDirectoryRow[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [inventory, setInventory] = useState<VendorStockItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingVendors(true);
        const { data } = await supabase
          .from('vendors')
          .select('id, business_name, invite_code, subscription_plan, subscription_status, stripe_onboarding_complete, payouts_enabled, is_onboarded')
          .eq('is_onboarded', true);
        if (active) setVendorDirectory((data || []) as VendorDirectoryRow[]);
      } catch (error) {
        console.log('Vendor directory load error:', error);
      } finally {
        if (active) setLoadingVendors(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingInventory(true);
        const items = await getCatalogInventory();
        const liveItems = items.filter((item) => item.isActive !== false && item.isApproved !== false && !String(item.vendorId || '').startsWith('demo-'));
        if (active) setInventory(liveItems);
      } finally {
        if (active) setLoadingInventory(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const findLiveVendorForItem = (item: VendorStockItem) => {
    const normalizedVendorId = String(item.vendorId || '').trim();
    if (normalizedVendorId) {
      const byId = vendorDirectory.find((vendor) => String(vendor.id || '').trim() === normalizedVendorId);
      if (byId) return byId;
    }

    const normalizedInviteCode = normalizeText(item.inviteCode);
    if (normalizedInviteCode) {
      const byInviteCode = vendorDirectory.find(
        (vendor) => normalizeText(vendor.invite_code) === normalizedInviteCode
      );
      if (byInviteCode) return byInviteCode;
    }

    const normalizedVendorName = normalizeText(item.vendorName);
    if (normalizedVendorName) {
      const byName = vendorDirectory.find(
        (vendor) => normalizeText(vendor.business_name) === normalizedVendorName
      );
      if (byName) return byName;
    }

    return null;
  };

  const filteredInventory = useMemo(() => {
    if (isChoosingVendorForQuote) return inventory;

    if (scopedVendorId) {
      return inventory.filter((item) => String(item.vendorId || '') === scopedVendorId);
    }

    if (scopedInviteCode) {
      const normalizedInviteCode = normalizeText(scopedInviteCode);
      return inventory.filter((item) => normalizeText(item.inviteCode || '') === normalizedInviteCode);
    }

    return inventory;
  }, [inventory, isChoosingVendorForQuote, scopedVendorId, scopedInviteCode]);

  const scopedVendor = useMemo(() => {
    if (!scopedVendorId && !scopedInviteCode) return null;
    return vendorDirectory.find((vendor) => {
      if (scopedVendorId && vendor.id === scopedVendorId) return true;
      if (scopedInviteCode && normalizeText(vendor.invite_code) === normalizeText(scopedInviteCode)) return true;
      return false;
    }) || null;
  }, [vendorDirectory, scopedVendorId, scopedInviteCode]);

  const handleAddToCart = async (item: VendorStockItem) => {
    await hapticSuccess();
    addToCart(item);
    Alert.alert('Added to cart', `${item.title} has been added to your cart.`);
  };

  const handleBuyNow = async (item: VendorStockItem) => {
    await hapticTap();
    addToCart(item);
    router.push('/cart' as any);
  };

  const handleUseAsInspiration = async (item: VendorStockItem) => {
    await hapticTap();
    applyVendorInspiration(item);
    router.push('/chat' as any);
  };

  const buildQuoteParamsForItem = (item: VendorStockItem, matchedVendor?: VendorDirectoryRow | null) => ({
    vendorId: matchedVendor?.id || quoteContext.vendorId || item.vendorId || '',
    vendorName: matchedVendor?.business_name || quoteContext.vendorName || item.vendorName,
    inviteCode: matchedVendor?.invite_code || quoteContext.inviteCode || item.inviteCode || '',
    designTitle: quoteContext.designTitle || item.title,
    designSummary: quoteContext.designSummary || item.description,
    designImage: quoteContext.designImage || item.imageUrl,
    designImages: quoteContext.designImages || JSON.stringify([quoteContext.designImage, item.imageUrl].filter(Boolean)),
    selectedSpecs: quoteContext.selectedSpecs || null,
    jewelryType: quoteContext.jewelryType || item.category,
    metal: quoteContext.metal || `${item.metalPurity} ${item.metal}`,
    stone: quoteContext.stone || `${item.shape} ${item.stone}`,
    budget: quoteContext.budget || String(item.price),
    source: isChoosingVendorForQuote ? 'customer_selected' : 'vendor_catalog',
    leadSourceDetail: quoteContext.leadSourceDetail || (isChoosingVendorForQuote ? 'catalog_vendor_selection' : 'catalog_product_quote'),
    catalogItemTitle: item.title,
  });

  const handleRequestQuoteFromCatalogItem = async (item: VendorStockItem) => {
    await hapticTap();
    const matchedVendor = findLiveVendorForItem(item);
    if (!matchedVendor) {
      console.log('Vendor catalog quote mapping failed', {
        itemId: item.id,
        title: item.title,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        inviteCode: item.inviteCode,
        vendorDirectorySize: vendorDirectory.length,
      });
      showMessage('Vendor not ready', 'This product is not linked to an approved live vendor account yet.');
      return;
    }
    console.log('Opening request-quote from vendor catalog', { itemId: item.id, vendorId: matchedVendor.id, vendorName: matchedVendor.business_name });
    router.push({ pathname: '/request-quote', params: buildQuoteParamsForItem(item, matchedVendor) } as any);
  };

  const handleChooseVendorForCustomDesign = async (item: VendorStockItem) => {
    await hapticTap();
    const matchedVendor = findLiveVendorForItem(item);
    if (!matchedVendor) {
      console.log('Vendor catalog custom-design mapping failed', {
        itemId: item.id,
        title: item.title,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        inviteCode: item.inviteCode,
        vendorDirectorySize: vendorDirectory.length,
      });
      showMessage('Vendor mapping missing', 'This catalog item is not linked to a live vendor account yet.');
      return;
    }
    console.log('Opening request-quote from vendor catalog', { itemId: item.id, vendorId: matchedVendor.id, vendorName: matchedVendor.business_name });
    router.push({ pathname: '/request-quote', params: buildQuoteParamsForItem(item, matchedVendor) } as any);
  };

  const handlePlatformPriority = async () => {
    await hapticWarning();
    router.push({
      pathname: '/request-quote',
      params: {
        designTitle: quoteContext.designTitle || `${quoteContext.jewelryType || 'Custom Jewelry'} Design`,
        designSummary: quoteContext.designSummary || 'Customer completed a custom design flow and wants the platform to auto-route the lead to a priority vendor.',
        designImage: quoteContext.designImage || '',
        designImages: quoteContext.designImages || JSON.stringify([quoteContext.designImage].filter(Boolean)),
        selectedSpecs: quoteContext.selectedSpecs || null,
        jewelryType: quoteContext.jewelryType || '',
        metal: quoteContext.metal || '',
        stone: quoteContext.stone || '',
        budget: quoteContext.budget || '',
        source: 'platform_priority',
        leadSourceDetail: 'platform_priority_from_catalog',
      },
    } as any);
  };

  const showLoader = loadingVendors || loadingInventory;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{isChoosingVendorForQuote ? 'Choose jeweler for quote' : scopedVendor ? `${scopedVendor.business_name} catalog` : 'Vendor catalog'}</Text>
        <Text style={styles.title}>{isChoosingVendorForQuote ? 'Choose which vendor should quote your custom design' : scopedVendor ? `Shop ${scopedVendor.business_name} inventory` : 'Shop real live vendor inventory'}</Text>
        <Text style={styles.subtitle}>
          {isChoosingVendorForQuote
            ? 'Only approved, onboarded vendors with live catalog items are shown here.'
            : scopedVendor
              ? 'This catalog is scoped to the selected vendor only, so products from other vendors will not appear here.'
              : 'Demo vendors are disabled in the production path. Customers only see approved products from real onboarded vendors.'}
        </Text>
        <Text style={styles.debugBanner}>VENDOR CATALOG DEBUG BUILD</Text>
        <View style={styles.heroRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/cart' as any)}>
            <Text style={styles.primaryButtonText}>Open Cart ({cartItems.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/chat' as any)}>
            <Text style={styles.secondaryButtonText}>Start Custom Design</Text>
          </TouchableOpacity>
          {isChoosingVendorForQuote ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={handlePlatformPriority}>
              <Text style={styles.secondaryButtonText}>Auto-Route to Priority Vendor</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showLoader ? <View style={styles.loadingBox}><ActivityIndicator /><Text style={styles.loadingText}>Loading catalog...</Text></View> : null}

      {!showLoader && filteredInventory.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No live products yet</Text>
          <Text style={styles.emptyText}>{scopedVendor ? `${scopedVendor.business_name} does not have any approved live products yet.` : 'Once real vendors are onboarded and their products are approved, they will appear here automatically.'}</Text>
        </View>
      ) : null}

      {filteredInventory.map((item) => {
        const matchedVendor = findLiveVendorForItem(item);
        return (
          <View key={item.id} style={styles.card}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImage} /> : <View style={[styles.productImage, styles.imageFallback]}><Text style={styles.imageFallbackText}>No image</Text></View>}
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.vendorName}>{matchedVendor?.business_name || item.vendorName}</Text>
            <Text style={styles.price}>{item.currency} {Number(item.price || 0).toLocaleString()}</Text>
            <Text style={styles.meta}>{item.metalPurity} {item.metal} • {item.shape} {item.stone}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.stock}>Inventory available: {item.inventoryCount}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAddToCart(item)}><Text style={styles.actionButtonText}>Add to Cart</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleBuyNow(item)}><Text style={styles.actionButtonText}>Buy Now</Text></TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => handleUseAsInspiration(item)}><Text style={styles.actionButtonSecondaryText}>Use as Inspiration</Text></TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionButtonSecondary}
                onPress={() => {
                  console.log('Vendor catalog secondary quote button pressed', {
                    itemId: item.id,
                    mode: isChoosingVendorForQuote ? 'choose_vendor' : 'request_quote',
                  });
                  if (isChoosingVendorForQuote) {
                    handleChooseVendorForCustomDesign(item);
                  } else {
                    handleRequestQuoteFromCatalogItem(item);
                  }
                }}
              ><Text style={styles.actionButtonSecondaryText}>{isChoosingVendorForQuote ? 'Choose Vendor' : 'Request Quote'}</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F4EE' },
  content: { padding: 18, paddingBottom: 30 },
  heroCard: { backgroundColor: '#FFFDF9', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EDE2D0', marginBottom: 18 },
  eyebrow: { color: '#8a6b2f', fontWeight: '700', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#1B1714', marginTop: 10 },
  subtitle: { color: '#675B51', marginTop: 8, lineHeight: 22 },
  debugBanner: { color: '#b00020', fontWeight: '800', marginTop: 12 },
  heroRow: { gap: 10, marginTop: 16 },
  primaryButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFFDF9' },
  secondaryButtonText: { color: '#111', fontWeight: '700' },
  loadingBox: { padding: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: '#5D5248' },
  emptyCard: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EDE2D0' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1B1714' },
  emptyText: { color: '#675B51', marginTop: 10, lineHeight: 22 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDE2D0', marginBottom: 16 },
  productImage: { width: '100%', height: 240, borderRadius: 16, backgroundColor: '#EFE7DA', marginBottom: 12 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: '#6D6157', fontWeight: '700' },
  productTitle: { fontSize: 20, fontWeight: '700', color: '#1B1714' },
  vendorName: { color: '#8a6b2f', marginTop: 4, fontWeight: '600' },
  price: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#111' },
  meta: { color: '#675B51', marginTop: 6 },
  description: { color: '#4F463F', marginTop: 8, lineHeight: 22 },
  stock: { color: '#675B51', marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, backgroundColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  actionButtonSecondary: { flex: 1, borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionButtonSecondaryText: { color: '#111', fontWeight: '700' },
});
