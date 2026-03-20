import { getVendorPlanConfig, normalizePlan } from './vendorSubscriptions';

export type VendorPriorityCandidate = {
  id: string;
  business_name?: string | null;
  invite_code?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  is_onboarded?: boolean | null;
  is_suspended?: boolean | null;
  is_featured?: boolean | null;
  country?: string | null;
  city?: string | null;
  specialization?: string[] | null;
  average_response_hours?: number | null;
  monthly_leads_used?: number | null;
  lead_limit_override?: number | null;
  stripe_onboarding_complete?: boolean | null;
  payouts_enabled?: boolean | null;
};

export type LeadPriorityInput = {
  jewelryType?: string | null;
  customerCountry?: string | null;
  customerCity?: string | null;
};

function normalizeText(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function includesSpecialization(specialization?: string[] | null, jewelryType?: string | null) {
  const type = normalizeText(jewelryType);
  if (!type) return false;
  return Array.isArray(specialization) && specialization.some((entry) => normalizeText(entry).includes(type));
}

function locationScore(candidate: VendorPriorityCandidate, input: LeadPriorityInput) {
  let score = 0;
  if (normalizeText(candidate.country) && normalizeText(candidate.country) === normalizeText(input.customerCountry)) score += 20;
  if (normalizeText(candidate.city) && normalizeText(candidate.city) === normalizeText(input.customerCity)) score += 8;
  return score;
}

function responseScore(hours?: number | null) {
  const value = Number(hours || 0);
  if (!Number.isFinite(value) || value <= 0) return 5;
  if (value <= 2) return 15;
  if (value <= 8) return 10;
  if (value <= 24) return 6;
  return 2;
}

function rotationScore(index: number) {
  return Math.max(0, 8 - index);
}

export function rankVendorsForLead(candidates: VendorPriorityCandidate[], input: LeadPriorityInput) {
  const eligible = candidates.filter((candidate) => {
    const status = normalizeText(candidate.subscription_status);
    const allowedStatus = ['active', 'trialing', 'pending', ''].includes(status);
    const onboarded = candidate.is_onboarded !== false;
    const notSuspended = candidate.is_suspended !== true;
    return onboarded && notSuspended && allowedStatus;
  });

  return eligible
    .map((candidate, index) => {
      const plan = normalizePlan(candidate.subscription_plan);
      const planConfig = getVendorPlanConfig(plan);
      const score =
        planConfig.priorityWeight * 100 +
        (candidate.is_featured ? 25 : 0) +
        (includesSpecialization(candidate.specialization, input.jewelryType) ? 30 : 0) +
        locationScore(candidate, input) +
        responseScore(candidate.average_response_hours) +
        rotationScore(index) +
        (candidate.stripe_onboarding_complete === false ? -3 : 0) +
        (candidate.payouts_enabled === false ? -2 : 0);
      return {
        ...candidate,
        computed_score: score,
        computed_plan: plan,
      };
    })
    .sort((a, b) => b.computed_score - a.computed_score || String(a.business_name || '').localeCompare(String(b.business_name || '')));
}
