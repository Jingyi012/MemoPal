const DEFAULT_MAX_BYTES = 1_200_000;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_INITIAL_QUALITY = 0.88;
const DEFAULT_MIN_QUALITY = 0.55;
const DEFAULT_QUALITY_STEP = 0.1;

interface CompressionOptions {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
  minQuality?: number;
  qualityStep?: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode image.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function replaceExtension(fileName: string, extension: string) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) return `${fileName}.${extension}`;
  return `${fileName.slice(0, dotIndex)}.${extension}`;
}

export async function compressImageForUpload(
  inputFile: File,
  options?: CompressionOptions
): Promise<File> {
  if (!inputFile.type.startsWith('image/')) {
    return inputFile;
  }

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  if (inputFile.size <= maxBytes) {
    return inputFile;
  }

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const initialQuality = options?.initialQuality ?? DEFAULT_INITIAL_QUALITY;
  const minQuality = options?.minQuality ?? DEFAULT_MIN_QUALITY;
  const qualityStep = options?.qualityStep ?? DEFAULT_QUALITY_STEP;

  try {
    const image = await loadImage(inputFile);
    const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return inputFile;
    }

    context.drawImage(image, 0, 0, width, height);

    let bestBlob: Blob | null = null;
    for (let quality = initialQuality; quality >= minQuality; quality -= qualityStep) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= maxBytes) {
        bestBlob = blob;
        break;
      }
    }

    if (!bestBlob || bestBlob.size >= inputFile.size) {
      return inputFile;
    }

    return new File([bestBlob], replaceExtension(inputFile.name, 'webp'), {
      type: bestBlob.type || 'image/webp',
      lastModified: Date.now(),
    });
  } catch {
    return inputFile;
  }
}
