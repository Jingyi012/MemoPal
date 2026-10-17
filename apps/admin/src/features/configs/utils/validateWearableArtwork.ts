export async function validateWearableArtwork(file: File): Promise<void> {
  if (file.type !== 'image/png') {
    throw new Error('Wearable artwork must be a PNG file.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('The PNG could not be decoded for validation.');
  }

  try {
    if (bitmap.width !== 1254 || bitmap.height !== 1254) {
      throw new Error(`Wearable artwork must be exactly 1254 × 1254 pixels (received ${bitmap.width} × ${bitmap.height}).`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unable to inspect wearable artwork transparency in this browser.');

    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let hasTransparentPixel = false;
    for (let alphaIndex = 3; alphaIndex < pixels.length; alphaIndex += 4) {
      if (pixels[alphaIndex] < 255) {
        hasTransparentPixel = true;
        break;
      }
    }

    if (!hasTransparentPixel) {
      throw new Error('Wearable artwork must contain transparent pixels (an alpha channel).');
    }
  } finally {
    bitmap.close();
  }
}
