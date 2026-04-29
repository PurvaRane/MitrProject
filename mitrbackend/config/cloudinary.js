import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
