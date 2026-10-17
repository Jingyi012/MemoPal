export async function validateCompanionArtwork(file: File): Promise<void> {
  if (file.type !== 'image/png') {
    throw new Error('Companion layer artwork must be a PNG file.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('The PNG could not be decoded for validation.');
  }

  try {
    if (bitmap.width !== 1254 || bitmap.height !== 1254) {
      throw new Error(`Companion artwork must use the approved 1254 × 1254 canvas (received ${bitmap.width} × ${bitmap.height}).`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unable to inspect artwork transparency in this browser.');

    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    for (let alphaIndex = 3; alphaIndex < pixels.length; alphaIndex += 4) {
      if (pixels[alphaIndex] < 255) return;
    }

    throw new Error('Companion artwork must include transparent pixels around the character or layer.');
  } finally {
    bitmap.close();
  }
}
