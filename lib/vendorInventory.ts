import {
  getStoredVendorProducts,
  listRemoteVendorProducts,
  VendorCatalogProduct,
} from './vendorCatalogStore';

export type VendorStockItem = VendorCatalogProduct;

const enableDemoCatalog = String(process.env.EXPO_PUBLIC_ENABLE_DEMO_CATALOG || 'false').toLowerCase() === 'true';

export const vendorStock: VendorStockItem[] = enableDemoCatalog
  ? [
      {
        id: 'stock-1', vendorId: 'demo-maison-aurum', vendorName: 'Maison Aurum', inviteCode: 'maison-aurum', title: 'Oval Halo Pendant', category: 'pendant', price: 2480, currency: 'USD', metal: 'white gold', metalPurity: '18K', stone: 'diamond', shape: 'oval', imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80', description: 'An elegant oval halo pendant with delicate micro pavé framing and a refined hidden bail.', styleMood: 'soft luxury', inventoryCount: 4, market: 'usa', source: 'demo', isActive: true, isApproved: true, specs: { pendantStyle: 'halo pendant', necklaceLength: '18 inch', chainStyle: 'box chain', settingStyle: 'halo bezel hybrid' },
      },
    ]
  : [];

function dedupe(items: VendorStockItem[]) {
  const seen = new Map<string, VendorStockItem>();
  for (const item of items) seen.set(item.id, item);
  return Array.from(seen.values());
}

export async function getCatalogInventory(): Promise<VendorStockItem[]> {
  const stored = (await getStoredVendorProducts()).filter((item) => item.isActive !== false && item.isApproved !== false && item.source !== 'demo');
  let remote: VendorStockItem[] = [];
  try {
    remote = await listRemoteVendorProducts({ onlyPublic: true });
  } catch (error) {
    console.log('vendorInventory:getCatalogInventory remote fallback', error);
  }
  return dedupe([...stored, ...remote, ...vendorStock]).sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );
}
