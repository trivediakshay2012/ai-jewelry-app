import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { VendorStockItem } from './vendorInventory';

type BaseRecord = { id: string; created_at: string; updated_at?: string };

export type LocalLeadRecord = BaseRecord & {
  vendor_id?: string | null;
  invite_code?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  design_title?: string | null;
  design_summary?: string | null;
  design_image?: string | null;
  jewelry_type?: string | null;
  metal?: string | null;
  stone?: string | null;
  budget?: number | null;
  timeline?: string | null;
  notes?: string | null;
  status?: string | null;
  source?: string | null;
  routing_mode?: string | null;
  catalog_item_title?: string | null;
  assigned_vendor_name?: string | null;
  lead_source_detail?: string | null;
  backend_mode?: 'supabase' | 'local_fallback';
};

export type LocalQuoteRecord = BaseRecord & {
  lead_id: string;
  vendor_id?: string | null;
  quote_amount?: number | null;
  currency?: string | null;
  timeline?: string | null;
  notes?: string | null;
  deposit_percent?: number | null;
  status?: string | null;
};

export type LocalOrderRecord = BaseRecord & {
  lead_id?: string | null;
  order_number: string;
  quote_amount?: number | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
  timeline?: string | null;
  status?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  shipping_name?: string | null;
  shipping_email?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  memo?: string | null;
  source?: 'local_checkout' | 'stripe_checkout' | 'manual';
  items?: VendorStockItem[];
};

type WorkflowStore = {
  leads: LocalLeadRecord[];
  quotes: LocalQuoteRecord[];
  orders: LocalOrderRecord[];
};

const EMPTY_STORE: WorkflowStore = { leads: [], quotes: [], orders: [] };

const WEB_KEY = 'ai-jewelry-workflow-store';
const documentDirectory = FileSystem.documentDirectory || 'file:///';
const DIR = `${documentDirectory}ai-jewelry/`;
const FILE = `${DIR}workflow-store.json`;

function normalizeStore(parsed: any): WorkflowStore {
  return {
    leads: Array.isArray(parsed?.leads) ? parsed.leads : [],
    quotes: Array.isArray(parsed?.quotes) ? parsed.quotes : [],
    orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
  };
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isWeb() {
  return Platform.OS === 'web';
}

async function readWebStore(): Promise<WorkflowStore> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return EMPTY_STORE;
    const raw = window.localStorage.getItem(WEB_KEY);
    if (!raw?.trim()) return EMPTY_STORE;
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.log('localWorkflowStore:readWebStore error', error);
    return EMPTY_STORE;
  }
}

async function writeWebStore(store: WorkflowStore) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(WEB_KEY, JSON.stringify(store));
}

async function ensureNativeDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

async function readNativeStore(): Promise<WorkflowStore> {
  try {
    await ensureNativeDir();
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return EMPTY_STORE;

    const raw = await FileSystem.readAsStringAsync(FILE);
    if (!raw?.trim()) return EMPTY_STORE;

    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.log('localWorkflowStore:readNativeStore error', error);
    return EMPTY_STORE;
  }
}

async function writeNativeStore(store: WorkflowStore) {
  await ensureNativeDir();
  await FileSystem.writeAsStringAsync(FILE, JSON.stringify(store, null, 2));
}

async function readStore(): Promise<WorkflowStore> {
  return isWeb() ? readWebStore() : readNativeStore();
}

async function writeStore(store: WorkflowStore) {
  if (isWeb()) {
    await writeWebStore(store);
    return;
  }
  await writeNativeStore(store);
}

export async function createLocalLead(
  input: Omit<LocalLeadRecord, 'id' | 'created_at' | 'updated_at'>,
) {
  const store = await readStore();
  const record: LocalLeadRecord = {
    id: createId('lead'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: input.status || 'submitted',
    backend_mode: input.backend_mode || 'local_fallback',
    ...input,
  };
  store.leads.unshift(record);
  await writeStore(store);
  return record;
}

export async function listLocalLeadsByEmail(email: string) {
  const store = await readStore();
  const normalized = email.trim().toLowerCase();
  return store.leads.filter(
    (lead) => String(lead.customer_email || '').trim().toLowerCase() === normalized,
  );
}

export async function getLocalLeadById(leadId: string) {
  const store = await readStore();
  return store.leads.find((lead) => lead.id === leadId) || null;
}

export async function createLocalQuote(
  input: Omit<LocalQuoteRecord, 'id' | 'created_at' | 'updated_at'>,
) {
  const store = await readStore();
  const record: LocalQuoteRecord = {
    id: createId('quote'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: input.status || 'sent',
    ...input,
  };
  store.quotes.unshift(record);
  await writeStore(store);
  return record;
}

export async function listLocalQuotesByLeadId(leadId: string) {
  const store = await readStore();
  return store.quotes.filter((quote) => quote.lead_id === leadId);
}

export async function createLocalOrder(
  input: Omit<LocalOrderRecord, 'id' | 'created_at' | 'updated_at'>,
) {
  const store = await readStore();
  const record: LocalOrderRecord = {
    id: createId('order'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: input.status || 'checkout_started',
    source: input.source || 'local_checkout',
    ...input,
  };
  store.orders.unshift(record);
  await writeStore(store);
  return record;
}

export async function listLocalOrdersByEmail(email: string) {
  const store = await readStore();
  const normalized = email.trim().toLowerCase();
  return store.orders.filter((order) => {
    const customerEmail = String(order.customer_email || order.shipping_email || '')
      .trim()
      .toLowerCase();
    return customerEmail === normalized;
  });
}

export async function updateLocalOrderStatus(orderId: string, status: string) {
  const store = await readStore();
  const idx = store.orders.findIndex((order) => order.id === orderId);
  if (idx < 0) return null;

  store.orders[idx] = {
    ...store.orders[idx],
    status,
    updated_at: new Date().toISOString(),
  };

  await writeStore(store);
  return store.orders[idx];
}

export async function getWorkflowStoreSnapshot() {
  return readStore();
}