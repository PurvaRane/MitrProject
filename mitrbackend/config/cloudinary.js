import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImagePayload(value) {
  if (!value || typeof value !== 'string') {
    return { ok: false, message: 'An image is required.' };
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return { ok: true, kind: 'url' };
  }
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,/i);
  if (!match) {
    return { ok: false, message: 'Unsupported image format. Use JPG, PNG or WebP.' };
  }
  const mime = match[1].toLowerCase();
  if (!ALLOWED_TYPES.has(mime) && mime !== 'image/jpg') {
    return { ok: false, message: 'Unsupported image format. Use JPG, PNG or WebP.' };
  }
  const b64 = value.split(',')[1] || '';
  const bytes = Math.ceil((b64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'Image is too large. Maximum size is 8 MB.' };
  }
  return { ok: true, kind: 'base64' };
}

export async function resolveImage(value, folder = 'mitr') {
  const check = validateImagePayload(value);
  if (!check.ok) {
    const err = new Error(check.message);
    err.status = 400;
    throw err;
  }
  if (check.kind === 'url') return value;
  const uploaded = await uploadImage(value, folder);
  if (!uploaded) {
    const err = new Error('Image storage is not configured. Please try again later.');
    err.status = 503;
    throw err;
  }
  return uploaded;
}

/**
 * Upload a base64 image string to Cloudinary.
 * Returns the secure URL.
 *
 * @param {string} base64String — the data:image/...;base64,... string
 * @param {string} folder       — Cloudinary folder (e.g. 'mitr/events')
 */
export async function uploadImage(base64String, folder = 'mitr') {
  if (!base64String) return null;

  // If Cloudinary isn't configured, return null gracefully
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return null;
  }

  const result = await cloudinary.uploader.upload(base64String, {
    folder,
    resource_type: 'image',
    // Auto-quality and format for smaller file sizes
    quality:       'auto',
    fetch_format:  'auto',
    // Limit dimensions for safety
    width:  1200,
    crop:   'limit',
  });

  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Safe no-op if Cloudinary isn't configured.
 */
export async function deleteImage(imageUrl) {
  if (!imageUrl || !process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return;
  }

  // Extract public_id from URL: .../upload/v123456/mitr/events/abc.jpg → mitr/events/abc
  const parts = imageUrl.split('/upload/');
  if (parts.length < 2) return;
  const withVersion = parts[1]; // e.g. v1234567/mitr/events/abc.jpg
  const withoutVersion = withVersion.replace(/^v\d+\//, ''); // mitr/events/abc.jpg
  const publicId = withoutVersion.replace(/\.[^/.]+$/, '');  // mitr/events/abc

  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
