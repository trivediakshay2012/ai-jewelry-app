import * as FileSystem from 'expo-file-system/legacy';

export type ImagePayload = {
  base64: string;
  mimeType: string;
  extension: string;
};

function getMimeTypeFromUri(uri: string) {
  const lower = uri.toLowerCase();

  if (lower.endsWith('.png')) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  if (lower.endsWith('.webp')) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  return { mimeType: 'image/jpeg', extension: 'jpg' };
}

export async function imageUriToPayload(uri: string): Promise<ImagePayload> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { mimeType, extension } = getMimeTypeFromUri(uri);

  return {
    base64,
    mimeType,
    extension,
  };
}

export async function imageUriToDataUrl(uri: string): Promise<string> {
  const payload = await imageUriToPayload(uri);
  return `data:${payload.mimeType};base64,${payload.base64}`;
}