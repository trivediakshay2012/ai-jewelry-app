import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthRole } from '../components/AuthRoleContext';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '../lib/haptics';
import { createNotificationEvent } from '../lib/notificationEvents';
import {
  deleteRemoteVendorProduct,
  deleteVendorProduct,
  getStoredVendorProducts,
  listRemoteVendorProducts,
  setRemoteProductApproval,
  upsertRemoteVendorProduct,
  upsertVendorProduct,
  VendorCatalogProduct,
} from '../lib/vendorCatalogStore';
import { uploadVendorProductImage } from '../lib/vendorImageUpload';
import { getVendorPlanConfig, planAllowsInventory } from '../lib/vendorSubscriptions';

const emptyForm = {
  title: '',
  price: '',
  category: 'ring' as VendorCatalogProduct['category'],
  metal: 'yellow gold',
  metalPurity: '18K',
  stone: 'diamond',
  shape: 'round',
  imageUrl: '',
  description: '',
  styleMood: 'luxury',
  inventoryCount: '1',
  market: 'usa' as VendorCatalogProduct['market'],
  isActive: true,
};

const currencyByMarket = { usa: 'USD', india: 'INR', dubai: 'AED' } as const;

export default function VendorInventoryScreen() {
  const { user, vendor } = useAuthRole();
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<VendorCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const loadLock = useRef(false);

  const currentVendor = useMemo(() => {
    if (!vendor?.id) return null;
    return {
      id: String(vendor.id),
      business_name: String(vendor.business_name || 'Vendor'),
      invite_code: String(vendor.invite_code || ''),
      is_onboarded: vendor.is_onboarded !== false,
      subscription_plan: String(vendor.subscription_plan || 'basic'),
      subscription_status: String(vendor.subscription_status || 'trialing'),
      is_suspended: vendor.is_suspended === true,
    };
  }, [vendor]);

  const planConfig = getVendorPlanConfig(currentVendor?.subscription_plan);
  const visibleItems = useMemo(
    () => items.filter((item) => String(item.vendorId || '') === String(currentVendor?.id || '')),
    [items, currentVendor?.id]
  );
  const productCount = visibleItems.length;
  const liveCount = visibleItems.filter((item) => item.isApproved && item.isActive && !item.isDraft).length;
  const draftCount = visibleItems.filter((item) => item.isDraft).length;
  const pendingApprovalCount = visibleItems.filter((item) => !item.isApproved && !item.isDraft).length;
  const canSaveDraft = !!currentVendor?.id && !currentVendor?.is_suspended;
  const canPublish = !!currentVendor?.id && !currentVendor?.is_suspended;
  const saveModeLabel = canPublish ? 'live and approved' : 'draft only';
  const selectedMarketCurrency = useMemo(() => currencyByMarket[form.market], [form.market]);

  const setField = (key: keyof typeof emptyForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeProduct = (item: any): VendorCatalogProduct => ({
    id: String(item.id),
    vendorId: String(item.vendorId || item.vendor_id || ''),
    vendorName: String(item.vendorName || item.vendor_name || ''),
    inviteCode: String(item.inviteCode || item.invite_code || ''),
    title: String(item.title || ''),
    category: (item.category || 'ring') as VendorCatalogProduct['category'],
    price: Number(item.price || 0),
    currency: (item.currency || 'USD') as VendorCatalogProduct['currency'],
    metal: String(item.metal || ''),
    metalPurity: String(item.metalPurity || item.metal_purity || ''),
    stone: String(item.stone || ''),
    shape: String(item.shape || ''),
    imageUrl: String(item.imageUrl || item.image_url || ''),
    description: String(item.description || ''),
    styleMood: String(item.styleMood || item.style_mood || 'luxury'),
    inventoryCount: Number(item.inventoryCount || item.inventory_count || 1),
    market: (item.market || 'usa') as VendorCatalogProduct['market'],
    specs: item.specs || {},
    source: (item.source || 'vendor_upload') as any,
    createdAt: String(item.createdAt || item.created_at || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.updated_at || new Date().toISOString()),
    isApproved: item.isApproved ?? item.is_approved ?? true,
    approvalStatus: String(item.approvalStatus || item.approval_status || 'approved'),
    isActive: item.isActive ?? item.is_active ?? true,
    isDraft: item.isDraft ?? item.is_draft ?? false,
  });

  const load = async (options?: { silent?: boolean }) => {
    if (loadLock.current) return;
    try {
      loadLock.current = true;
      if (!options?.silent) setLoading(true);
      if (!options?.silent) setStatusMessage('');
      if (!user?.id || !currentVendor?.id) {
        setItems([]);
        return;
      }

      let remote: VendorCatalogProduct[] = [];
      try {
        const remoteRows = await listRemoteVendorProducts(currentVendor.id);
        remote = (remoteRows || []).map(normalizeProduct).filter((item) => item.vendorId === currentVendor.id);
      } catch (remoteError) {
        console.log('vendor-inventory remote load fallback', remoteError);
      }

      const stored = (await getStoredVendorProducts())
        .map(normalizeProduct)
        .filter((item) => item.vendorId === currentVendor.id);

      const mergedMap = new Map<string, VendorCatalogProduct>();
      for (const localItem of stored) mergedMap.set(localItem.id, localItem);
      for (const remoteItem of remote) mergedMap.set(remoteItem.id, remoteItem);

      const merged = Array.from(mergedMap.values()).sort((a, b) =>
        String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
      );
      setItems(merged);
    } catch (error: any) {
      Alert.alert('Inventory unavailable', error?.message || 'Could not load inventory.');
    } finally {
      loadLock.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, currentVendor?.id]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const pickAndUploadImage = async () => {
    await hapticTap();
    try {
      if (!currentVendor?.id) throw new Error('Please log in as a vendor first.');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library to upload product images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setUploadingImage(true);
      setStatusMessage('Uploading product image...');

      const uploaded = await uploadVendorProductImage({
        vendorId: currentVendor.id,
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });

      setField('imageUrl', uploaded.publicUrl);
      setStatusMessage('Product image uploaded successfully.');
      await hapticSuccess();
    } catch (error: any) {
      console.log('vendor image upload error', error);
      await hapticError();
      Alert.alert('Image upload failed', error?.message || 'Could not upload product image.');
      setStatusMessage(error?.message || 'Could not upload product image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveItem = async () => {
    await hapticTap();
    try {
      if (saving) return;
      if (!user?.id || !currentVendor?.id) throw new Error('Please log in as a vendor first.');
      if (!form.title.trim() || !form.price.trim()) throw new Error('Title and price are required.');
      if (!editingId && !planAllowsInventory(currentVendor?.subscription_plan, visibleItems.length)) {
        throw new Error(`${planConfig.name} plan inventory limit reached. Upgrade your subscription to add more products.`);
      }
      if (!canSaveDraft) throw new Error('Your vendor account is suspended or unavailable.');

      setSaving(true);
      setStatusMessage(editingId ? `Updating product (${saveModeLabel})...` : `Saving product (${saveModeLabel})...`);
      const product: VendorCatalogProduct = {
        id: editingId || `vendor-${currentVendor.id}-${Date.now()}`,
        vendorId: currentVendor.id,
        vendorName: currentVendor.business_name || 'Vendor',
        inviteCode: currentVendor.invite_code || '',
        title: form.title.trim(),
        category: form.category,
        price: Number(form.price),
        currency: selectedMarketCurrency,
        metal: form.metal.trim(),
        metalPurity: form.metalPurity.trim(),
        stone: form.stone.trim(),
        shape: form.shape.trim(),
        imageUrl: form.imageUrl.trim() || '',
        description: form.description.trim() || `${form.title.trim()} by ${currentVendor.business_name}`,
        styleMood: form.styleMood.trim() || 'luxury',
        inventoryCount: Number(form.inventoryCount) || 1,
        market: form.market,
        source: 'vendor_upload',
        isActive: form.isActive,
        isApproved: true,
        approvalStatus: 'approved',
        isDraft: false,
      };

      await upsertVendorProduct(product);

      try {
        await upsertRemoteVendorProduct(product);
        try {
          await createNotificationEvent({
            audience: 'admin',
            title: 'New product uploaded',
            body: `${currentVendor.business_name || 'Vendor'} uploaded ${product.title}.`,
            referenceType: 'vendor_catalog',
            referenceId: product.id,
            recipientVendorId: currentVendor.id,
            metadata: { vendorId: currentVendor.id, plan: currentVendor.subscription_plan || 'basic' },
          });
        } catch {}
        setStatusMessage('Product saved and synced live.');
        await hapticSuccess();
      } catch (remoteError: any) {
        setStatusMessage(`Saved locally. Remote sync needs DB table/policies: ${remoteError?.message || 'sync failed'}`);
        await hapticWarning();
      }

      resetForm();
      await load({ silent: true });
    } catch (error: any) {
      await hapticError();
      Alert.alert('Could not save product', error?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: VendorCatalogProduct) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      price: String(item.price),
      category: item.category,
      metal: item.metal,
      metalPurity: item.metalPurity,
      stone: item.stone,
      shape: item.shape,
      imageUrl: item.imageUrl,
      description: item.description,
      styleMood: item.styleMood,
      inventoryCount: String(item.inventoryCount || 1),
      market: item.market,
      isActive: item.isActive ?? true,
    });
  };

  const removeItem = async (id: string) => {
    await hapticTap();
    try {
      await deleteVendorProduct(id);
      try {
        await deleteRemoteVendorProduct(id);
      } catch (error) {
        console.log('remote delete fallback', error);
      }
      if (editingId === id) resetForm();
      await load({ silent: true });
    } catch (error: any) {
      Alert.alert('Could not remove product', error?.message || 'Try again.');
    }
  };

  const toggleListing = async (item: VendorCatalogProduct) => {
    await hapticTap();
    const next = { ...item, isActive: !(item.isActive ?? true) };
    await upsertVendorProduct(next);
    try {
      await setRemoteProductApproval(item.id, {
        isApproved: true,
        approvalStatus: 'approved',
        isActive: next.isActive,
        isDraft: false,
      });
    } catch (error) {
      console.log('toggleListing remote fallback', error);
    }
    await load({ silent: true });
  };

  if (!user?.id || !currentVendor?.id) {
    return (
      <View style={styles.guardCard}>
        <Text style={styles.title}>Vendor login required</Text>
        <Text style={styles.subtitle}>Sign in first to manage your catalog and publish real jewelry.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vendor Inventory</Text>
      <Text style={styles.subtitle}>Products save live by default for the current signed-in vendor only. Hidden items stay in your dashboard until you make them visible again.</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Vendor: {currentVendor.business_name}</Text>
        <Text style={styles.infoText}>Invite code: {currentVendor.invite_code || '—'}</Text>
        <Text style={styles.infoText}>Onboarding: {currentVendor.is_onboarded ? 'Approved' : 'Pending admin approval'}</Text>
        <Text style={styles.infoText}>Draft mode: {canPublish ? 'Disabled — products publish live' : 'Enabled until approval'}</Text>
        <Text style={styles.infoText}>Subscription: {planConfig.name} • {currentVendor.subscription_status || 'trialing'}</Text>
        <Text style={styles.infoText}>Inventory limit: {planConfig.inventoryLimit == null ? 'Unlimited' : planConfig.inventoryLimit}</Text>
        <Text style={styles.infoText}>Products: {productCount} total • {liveCount} live • {pendingApprovalCount} pending • {draftCount} drafts</Text>
      </View>

      {!!statusMessage ? <View style={styles.statusBox}><Text style={styles.statusText}>{statusMessage}</Text></View> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text>
        <TextInput style={styles.input} placeholder="Product title" value={form.title} onChangeText={(t) => setField('title', t)} />
        <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={(t) => setField('price', t)} />
        <View style={styles.uploadCard}>
          <Text style={styles.uploadLabel}>Product image</Text>
          {form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.helperText}>No image uploaded yet</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.secondaryButton, uploadingImage && styles.disabledButton]}
            onPress={pickAndUploadImage}
            disabled={uploadingImage}
          >
            <Text style={styles.secondaryButtonText}>{uploadingImage ? 'Uploading Image...' : form.imageUrl ? 'Replace Image' : 'Upload Product Image'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Metal" value={form.metal} onChangeText={(t) => setField('metal', t)} />
        <TextInput style={styles.input} placeholder="Metal purity" value={form.metalPurity} onChangeText={(t) => setField('metalPurity', t)} />
        <TextInput style={styles.input} placeholder="Stone" value={form.stone} onChangeText={(t) => setField('stone', t)} />
        <TextInput style={styles.input} placeholder="Shape" value={form.shape} onChangeText={(t) => setField('shape', t)} />
        <TextInput style={styles.input} placeholder="Inventory count" keyboardType="numeric" value={form.inventoryCount} onChangeText={(t) => setField('inventoryCount', t)} />
        <TextInput style={styles.input} placeholder="Category (ring, necklace, pendant...)" value={form.category} onChangeText={(t) => setField('category', t as any)} />
        <TextInput style={styles.input} placeholder="Market (usa, india, dubai)" value={form.market} onChangeText={(t) => setField('market', t as any)} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description" value={form.description} onChangeText={(t) => setField('description', t)} multiline />
        <TextInput style={styles.input} placeholder="Style mood" value={form.styleMood} onChangeText={(t) => setField('styleMood', t)} />
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Listing active</Text><Switch value={form.isActive} onValueChange={(value) => setField('isActive', value)} /></View>
        <TouchableOpacity style={[styles.primaryButton, (!canSaveDraft || saving || uploadingImage) && styles.disabledButton]} onPress={saveItem} disabled={!canSaveDraft || saving || uploadingImage}>
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : editingId ? 'Update Product' : canPublish ? 'Save Product' : 'Save Draft'}</Text>
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryButtonText}>Cancel Editing</Text></TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Uploaded Inventory</Text>
        {loading ? <Text style={styles.helperText}>Loading...</Text> : null}
        {!loading && visibleItems.length === 0 ? <Text style={styles.helperText}>No products saved yet.</Text> : null}
        {visibleItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} /> : null}
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.helperText}>{item.currency} {Number(item.price || 0).toLocaleString()} • {item.category}</Text>
            <Text style={styles.helperText}>Status: {item.isApproved ? 'Approved' : currentVendor?.is_onboarded ? 'Pending admin approval' : 'Draft (local only until approval)'}</Text>
            <Text style={styles.helperText}>Visibility: {item.isActive ? 'Active' : 'Hidden'}</Text>
            <View style={styles.itemActions}>
              <TouchableOpacity style={styles.secondaryButtonSmall} onPress={() => startEdit(item)}><Text style={styles.secondaryButtonText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButtonSmall} onPress={() => toggleListing(item)}><Text style={styles.secondaryButtonText}>{item.isActive ? 'Hide' : 'Show'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerButtonSmall} onPress={() => removeItem(item.id)}><Text style={styles.dangerButtonText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F4EE' },
  content: { padding: 18, paddingBottom: 30 },
  guardCard: { flex: 1, justifyContent: 'center', padding: 24, gap: 10, backgroundColor: '#F8F4EE' },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { color: '#675B51', lineHeight: 22, marginTop: 8 },
  infoCard: { backgroundColor: '#FFFDF9', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDE2D0', marginTop: 14 },
  infoText: { color: '#675B51', lineHeight: 22 },
  statusBox: { borderWidth: 1, borderColor: '#E5D2B0', backgroundColor: '#FFF7E8', borderRadius: 14, padding: 14, marginTop: 14 },
  statusText: { color: '#5D5248', lineHeight: 20 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDE2D0', marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 12, backgroundColor: '#fff' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  uploadCard: { marginBottom: 12 },
  uploadLabel: { fontWeight: '600', color: '#111', marginBottom: 8 },
  previewImage: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12, backgroundColor: '#F1ECE4' },
  previewPlaceholder: { width: '100%', height: 140, borderRadius: 14, marginBottom: 12, backgroundColor: '#F6F1EA', borderWidth: 1, borderColor: '#EDE2D0', alignItems: 'center', justifyContent: 'center', padding: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontWeight: '600', color: '#111' },
  primaryButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#111', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  helperText: { color: '#675B51', lineHeight: 20 },
  itemCard: { borderWidth: 1, borderColor: '#EDE2D0', borderRadius: 14, padding: 14, marginTop: 10, backgroundColor: '#fff' },
  itemImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10, backgroundColor: '#F1ECE4' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButtonSmall: { borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  dangerButtonSmall: { borderWidth: 1, borderColor: '#B42318', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFF3F2' },
  dangerButtonText: { color: '#B42318', fontWeight: '700' },
});
