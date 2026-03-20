import { DesignData } from "../context/DesignContext";
import { normalizeJewelryType } from "./jewelryFlow";

export type LockedDesign = {
  lockId: string;
  createdAt: string;
  designVersion: number;
  category: string;
  primaryShape: string;
  silhouetteKey: string;
  settingKey: string;
  designLanguage: string;
  lockedData: DesignData;
  immutableRules: string[];
  budgetMutableRules: string[];
};

function safe(value?: string) {
  return String(value || '').trim();
}

export function createLockedDesign(designData: DesignData): LockedDesign {
  const category = normalizeJewelryType(designData.jewelryType || 'custom');
  const primaryShape = safe(designData.shape) || 'not-specified';
  const settingKey = [designData.settingStyle, designData.bandStyle, designData.pendantStyle, designData.chainStyle, designData.braceletStyle, designData.bangleStyle, designData.earringStyle]
    .map(safe)
    .filter(Boolean)
    .join(' | ') || 'not-specified';
  const designLanguage = [designData.styleMood, designData.luxuryTone, designData.referenceInspiration]
    .map(safe)
    .filter(Boolean)
    .join(' | ') || 'luxury-custom';
  const silhouetteKey = [category, primaryShape, settingKey].join('::');

  return {
    lockId: `lock-${Date.now()}`,
    createdAt: new Date().toISOString(),
    designVersion: 1,
    category,
    primaryShape,
    silhouetteKey,
    settingKey,
    designLanguage,
    lockedData: { ...designData },
    immutableRules: [
      'overall silhouette',
      'setting style',
      'main design language',
      'jewelry category',
      'primary shape',
    ],
    budgetMutableRules: [
      'hollow interior',
      'lower gold weight',
      'thinner shank',
      'smaller side stones',
      'smaller center stone',
      'lower diamond total carat',
      'lower purity',
      'lab instead of natural',
      'fewer accent stones',
    ],
  };
}

export function createBudgetOptimizationNote(lockedDesign: LockedDesign, budget?: string | number | null) {
  const budgetText = budget ? String(budget) : 'not provided';
  return `Budget-aware optimization must preserve ${lockedDesign.immutableRules.join(', ')}. Allowed cost-saving levers: ${lockedDesign.budgetMutableRules.join(', ')}. Customer budget target: ${budgetText}.`;
}
