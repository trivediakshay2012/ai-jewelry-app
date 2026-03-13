import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export type ImagePayload = {
  base64: string;
  mimeType: string;
  extension: string;
};

async function normalizeImageUri(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.PNG,
      base64: false,
    }
  );

  return result.uri;
}

export async function imageUriToPayload(uri: string): Promise<ImagePayload> {
  const normalizedUri = await normalizeImageUri(uri);

  const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    base64,
    mimeType: 'image/png',
    extension: 'png',
  };
}

export async function imageUriToDataUrl(uri: string): Promise<string> {
  const payload = await imageUriToPayload(uri);
  return `data:${payload.mimeType};base64,${payload.base64}`;
}
