import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/** Intrinsic pixel dimensions of a raster image. */
export interface ImageDimensions {
  width: number;
  height: number;
}

/** A client-optimized image together with its intrinsic dimensions. */
export interface ProcessedImage extends ImageDimensions {
  file: File;
}

/** A stored image: public download URL plus the dimensions persisted alongside it. */
export interface UploadedImage extends ImageDimensions {
  url: string;
}

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const WEBP_QUALITY = 0.8;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const MAX_SIZE_MB = 10;

/**
 * Reads a file's intrinsic size without decoding it into the DOM.
 * Falls back to an <img> probe on browsers without `createImageBitmap`
 * (or for formats it refuses), and to 0×0 when the file is undecodable —
 * callers must treat 0 as "unknown" and skip persisting it.
 */
export const readImageDimensions = async (file: File): Promise<ImageDimensions> => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      /* fall through to the <img> probe */
    }
  }

  return new Promise<ImageDimensions>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };
    probe.src = objectUrl;
  });
};

/**
 * Downscales an image to fit within MAX_WIDTH×MAX_HEIGHT and re-encodes it as WebP.
 * Always resolves: on any decode/encode failure the original file is returned with
 * its probed dimensions, so the upload path never depends on canvas succeeding.
 */
export const compressImageFile = (file: File): Promise<ProcessedImage> => {
  return new Promise<ProcessedImage>((resolve) => {
    const fallback = () => readImageDimensions(file).then(({ width, height }) => resolve({ file, width, height }));

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onerror = fallback;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = fallback;
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallback();
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              fallback();
              return;
            }
            const name = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            resolve({ file: new File([blob], name, { type: 'image/webp' }), width, height });
          },
          'image/webp',
          WEBP_QUALITY,
        );
      };
      img.src = event.target?.result as string;
    };
  });
};

const assertUploadable = (file: File): void => {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF are allowed.`);
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
  }
};

/**
 * Uploads an already-optimized image. Use this from callers that ran
 * `compressImageFile` at selection time — it avoids a second lossy re-encode.
 */
export const uploadProcessedImage = async (
  image: ProcessedImage,
  path: string = 'posts',
): Promise<UploadedImage> => {
  assertUploadable(image.file);
  const storageRef = ref(storage, `${path}/${Date.now()}_${image.file.name}`);
  await uploadBytes(storageRef, image.file);
  return { url: await getDownloadURL(storageRef), width: image.width, height: image.height };
};

/** Compresses and uploads a raw file picked from disk. */
export const uploadImageToStorage = async (file: File, path: string = 'posts'): Promise<UploadedImage> => {
  if (!file) return { url: '', width: 0, height: 0 };
  assertUploadable(file);
  return uploadProcessedImage(await compressImageFile(file), path);
};
