import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
}

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i;

function parseDataUrl(image: string): { mime: string; buffer: Buffer } {
  const match = image.match(DATA_URL_PATTERN);
  if (!match?.[1] || !match[2]) {
    throw new AppError(400, 'Invalid image format. Expected a base64 data URL.', 'VALIDATION_ERROR');
  }

  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) {
    throw new AppError(400, 'Invalid image data', 'VALIDATION_ERROR');
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError(400, 'Image must be 5 MB or smaller', 'VALIDATION_ERROR');
  }

  return { mime, buffer };
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

async function uploadToLocalStorage(image: string): Promise<{ url: string }> {
  const { mime, buffer } = parseDataUrl(image);
  const filename = `${randomUUID()}.${extensionForMime(mime)}`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = env.API_PUBLIC_URL ?? `http://localhost:${env.API_PORT}`;
  return { url: `${baseUrl}/uploads/avatars/${filename}` };
}

export async function uploadAvatarImage(image: string): Promise<{ url: string }> {
  if (isCloudinaryConfigured()) {
    try {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'avatars',
        transformation: [{ width: 256, height: 256, crop: 'fill' }],
      });
      return { url: uploadRes.secure_url };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cloudinary upload failed';
      throw new AppError(502, message, 'UPLOAD_FAILED');
    }
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError(
      503,
      'Avatar upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      'SERVICE_UNAVAILABLE',
    );
  }

  return uploadToLocalStorage(image);
}
