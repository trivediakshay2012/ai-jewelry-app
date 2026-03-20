import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const WEB_STORAGE_KEY = 'ai_jewelry_vendor_products';

export type VendorCatalogProduct = {
  id: string;
  vendorId: string;
  vendorName: string;
  inviteCode?: string;
  title: string;
  category: 'ring' | 'necklace' | 'pendant' | 'bracelet' | 'bangle' | 'earrings';
  price: number;
  currency: 'USD' | 'INR' | 'AED';
  metal: string;
  metalPurity: string;
  stone: string;
  shape: string;
  imageUrl: string;
  description: string;
  styleMood: string;
  inventoryCount: number;
  market: 'usa' | 'india' | 'dubai';
  specs?: Partial<Record<string, string>>;
  source?: 'demo' | 'vendor_upload' | 'supabase';
  isActive?: boolean;
  isApproved?: boolean;
  approvalStatus?: string;
  isDraft?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const documentDirectory = (FileSystem as any).documentDirectory || 'file:///';
const DIR = `${documentDirectory}ai-jewelry/`;
const FILE = `${DIR}vendor-products.json`;

function isWebStorageAvailable() {
  try {
    return typeof globalThis !== 'undefined' && 'localStorage' in globalThis && !!globalThis.localStorage;
  } catch {
    return false;
  }
}

function readWebProducts(): VendorCatalogProduct[] {
  if (!isWebStorageAvailable()) return [];
  try {
    const raw = globalThis.localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : [];
  } catch (error) {
    console.log('vendorCatalogStore:readWebProducts error', error);
    return [];
  }
}

function writeWebProducts(products: VendorCatalogProduct[]) {
  if (!isWebStorageAvailable()) return;
  globalThis.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(products.map(normalizeProduct)));
}

async function ensureDir() {
  if (isWebStorageAvailable()) return;
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

function normalizeProduct(product: VendorCatalogProduct): VendorCatalogProduct {
  return {
    ...product,
    source: product.source || 'vendor_upload',
    isActive: product.isActive ?? true,
    isApproved: product.isApproved ?? false,
    approvalStatus: product.approvalStatus || (product.isApproved === false ? 'pending' : 'approved'),
    isDraft: product.isDraft ?? false,
    updatedAt: product.updatedAt || new Date().toISOString(),
    createdAt: product.createdAt || new Date().toISOString(),
  };
}

export async function getStoredVendorProducts(): Promise<VendorCatalogProduct[]> {
  try {
    if (isWebStorageAvailable()) return readWebProducts();
    await ensureDir();
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(FILE);
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : [];
  } catch (error) {
    console.log('vendorCatalogStore:getStoredVendorProducts error', error);
    return [];
  }
}

export async function saveStoredVendorProducts(products: VendorCatalogProduct[]) {
  if (isWebStorageAvailable()) {
    writeWebProducts(products);
    return;
  }
  await ensureDir();
  await FileSystem.writeAsStringAsync(FILE, JSON.stringify(products.map(normalizeProduct), null, 2));
}

export async function upsertVendorProduct(product: VendorCatalogProduct) {
  const products = await getStoredVendorProducts();
  const idx = products.findIndex((entry) => entry.id === product.id);
  const next = [...products];
  const normalized = normalizeProduct(product);
  if (idx >= 0) next[idx] = normalized;
  else next.unshift(normalized);
  await saveStoredVendorProducts(next);
  return normalized;
}

export async function deleteVendorProduct(productId: string) {
  const products = await getStoredVendorProducts();
  const next = products.filter((entry) => entry.id !== productId);
  await saveStoredVendorProducts(next);
}

function mapMarketToCurrency(market?: string | null): VendorCatalogProduct['currency'] {
  if (market === 'india') return 'INR';
  if (market === 'dubai') return 'AED';
  return 'USD';
}

function mapRowToProduct(row: any): VendorCatalogProduct {
  return normalizeProduct({
    id: String(row.id),
    vendorId: String(row.vendor_id || ''),
    vendorName: row.vendor_name || 'Vendor',
    inviteCode: row.invite_code || undefined,
    title: row.title || 'Untitled product',
    category: row.category || 'ring',
    price: Number(row.price || 0),
    currency: row.currency || mapMarketToCurrency(row.market),
    metal: row.metal || '',
    metalPurity: row.metal_purity || '',
    stone: row.stone || '',
    shape: row.shape || '',
    imageUrl: row.image_url || '',
    description: row.description || '',
    styleMood: row.style_mood || 'luxury',
    inventoryCount: Number(row.inventory_count || 0),
    market: row.market || 'usa',
    specs: row.specs || {},
    source: 'supabase',
    isActive: row.is_active,
    isApproved: row.is_approved,
    approvalStatus: row.approval_status || (row.is_approved === false ? 'pending' : 'approved'),
    isDraft: row.is_draft ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapProductToRow(product: VendorCatalogProduct) {
  return {
    id: product.id,
    vendor_id: product.vendorId,
    vendor_name: product.vendorName,
    invite_code: product.inviteCode || null,
    title: product.title,
    category: product.category,
    price: Number(product.price || 0),
    currency: product.currency,
    metal: product.metal,
    metal_purity: product.metalPurity,
    stone: product.stone,
    shape: product.shape,
    image_url: product.imageUrl,
    description: product.description,
    style_mood: product.styleMood,
    inventory_count: Number(product.inventoryCount || 0),
    market: product.market,
    specs: product.specs || {},
    is_active: product.isActive ?? true,
    is_approved: product.isApproved ?? false,
    approval_status: product.approvalStatus || (product.isApproved === false ? 'pending' : 'approved'),
    is_draft: product.isDraft ?? false,
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function listRemoteVendorProducts(options?: { vendorId?: string; onlyPublic?: boolean } | string) {
  const normalizedOptions = typeof options === 'string' ? { vendorId: options } : (options || {});
  let query = supabase.from('vendor_catalog').select('*').order('created_at', { ascending: false });
  if (normalizedOptions.vendorId) query = query.eq('vendor_id', normalizedOptions.vendorId);
  if (normalizedOptions.onlyPublic) query = query.eq('is_active', true).eq('is_approved', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRowToProduct);
}

export async function upsertRemoteVendorProduct(product: VendorCatalogProduct) {
  const payload = mapProductToRow(normalizeProduct(product));
  const { data, error } = await supabase.from('vendor_catalog').upsert(payload).select('*').single();
  if (error) throw error;
  return mapRowToProduct(data);
}

export async function deleteRemoteVendorProduct(productId: string) {
  const { error } = await supabase.from('vendor_catalog').delete().eq('id', productId);
  if (error) throw error;
}

export async function setRemoteProductApproval(productId: string, updates: { isApproved?: boolean; isActive?: boolean; approvalStatus?: string; isDraft?: boolean }) {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof updates.isApproved === 'boolean') payload.is_approved = updates.isApproved;
  if (typeof updates.isActive === 'boolean') payload.is_active = updates.isActive;
  if (typeof updates.approvalStatus === 'string') payload.approval_status = updates.approvalStatus;
  if (typeof updates.isDraft === 'boolean') payload.is_draft = updates.isDraft;
  const { data, error } = await supabase.from('vendor_catalog').update(payload).eq('id', productId).select('*').single();
  if (error) throw error;
  return mapRowToProduct(data);
}
