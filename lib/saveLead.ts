import { createLocalLead } from './localWorkflowStore';
import { supabase } from './supabase';

export type SaveLeadInput = {
  vendorId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  designTitle?: string;
  designSummary?: string;
  designImage?: string;
  designImages?: string[];
  budget?: number | null;
  notes?: string;
  timeline?: string;
  jewelryType?: string;
  metal?: string;
  stone?: string;
  source?: string;
  routingMode?: 'customer_selected' | 'platform_priority' | 'invite_link' | 'catalog_quote' | string;
  catalogItemTitle?: string;
  assignedVendorName?: string;
  leadSourceDetail?: string;
  inviteCode?: string;
  selectedSpecs?: Record<string, any> | any | null;
};

function normalizeOptionalText(value?: string | null) {
  const trimmed = String(value || '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBudget(value?: number | null) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function normalizeStringArray(value?: string[] | null) {
  if (!Array.isArray(value)) return null;
  const cleaned = value.map((entry) => String(entry || '').trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function normalizeJsonValue(value: any) {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return value;
}

function buildLeadPayload(input: SaveLeadInput) {
  return {
    vendor_id: input.vendorId,
    invite_code: normalizeOptionalText(input.inviteCode),
    customer_name: input.customerName.trim(),
    customer_email: input.customerEmail.trim().toLowerCase(),
    customer_phone: normalizeOptionalText(input.customerPhone),
    design_title: normalizeOptionalText(input.designTitle),
    design_summary: normalizeOptionalText(input.designSummary),
    design_image: normalizeOptionalText(input.designImage),
    design_images: normalizeStringArray(input.designImages),
    jewelry_type: normalizeOptionalText(input.jewelryType),
    metal: normalizeOptionalText(input.metal),
    stone: normalizeOptionalText(input.stone),
    budget: normalizeBudget(input.budget),
    timeline: normalizeOptionalText(input.timeline),
    notes: normalizeOptionalText(input.notes),
    status: 'submitted',
    source: normalizeOptionalText(input.source) || 'design_flow',
    routing_mode: normalizeOptionalText(input.routingMode),
    catalog_item_title: normalizeOptionalText(input.catalogItemTitle),
    assigned_vendor_name: normalizeOptionalText(input.assignedVendorName),
    lead_source_detail: normalizeOptionalText(input.leadSourceDetail),
    selected_specs: normalizeJsonValue(input.selectedSpecs),
    created_at: new Date().toISOString(),
  };
}

export async function saveLead(input: SaveLeadInput) {
  const payload = buildLeadPayload(input);

  const primary = await supabase.from('vendor_leads').insert([payload]).select('*').single();
  if (!primary.error && primary.data) {
    await createLocalLead({
      ...payload,
      backend_mode: 'supabase',
    });
    return primary.data;
  }

  console.log('vendor_leads insert failed:', primary.error);

  const fallback = await supabase.from('leads').insert([payload]).select('*').single();
  if (!fallback.error && fallback.data) {
    await createLocalLead({
      ...payload,
      backend_mode: 'supabase',
    });
    return fallback.data;
  }

  console.log('leads fallback insert failed:', fallback.error);

  const localLead = await createLocalLead({
    ...payload,
    backend_mode: 'local_fallback',
  });

  return localLead;
}
