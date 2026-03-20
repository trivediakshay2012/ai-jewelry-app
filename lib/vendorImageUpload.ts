import { supabase } from './supabase';

const BUCKET = 'vendor-product-images';

function guessExtension(uri?: string | null, mimeType?: string | null) {
  if (mimeType) {
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  }
  const match = String(uri || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() || 'jpg';
}

function guessContentType(ext: string, mimeType?: string | null) {
  if (mimeType) return mimeType;
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function uploadVendorProductImage(params: {
  vendorId: string;
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}) {
  const ext = guessExtension(params.fileName || params.uri, params.mimeType);
  const contentType = guessContentType(ext, params.mimeType);
  const safeVendorId = String(params.vendorId || 'vendor').replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = `${safeVendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(params.uri);
  if (!response.ok) {
    throw new Error('Could not read the selected image file.');
  }
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Image uploaded but public URL could not be created.');
  }

  return {
    bucket: BUCKET,
    filePath,
    publicUrl: data.publicUrl,
  };
}
