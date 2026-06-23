import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const compressImageFile = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const newFile = new File([blob], newFileName, {
            type: 'image/webp',
          });
          resolve(newFile);
        }, 'image/webp', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const uploadImageToStorage = async (file: File, path: string = 'posts'): Promise<string> => {
  if (!file) return '';

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE_MB = 10;
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF are allowed.`);
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
  }

  try {
    const optimizedFile = await compressImageFile(file);
    const storageRef = ref(storage, `${path}/${Date.now()}_${optimizedFile.name}`);
    await uploadBytes(storageRef, optimizedFile);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error optimizing/uploading image:', error);
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};
