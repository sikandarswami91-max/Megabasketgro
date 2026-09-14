import { v2 as cloudinary } from 'cloudinary';

// Track Cloudinary configuration state
let cloudinaryConfigured = false;

// Configure Cloudinary if all required credentials are present
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryConfigured = true;
}

/**
 * Check if Cloudinary is properly configured and ready to use
 * @returns {boolean}
 */
export const isCloudinaryReady = () => cloudinaryConfigured;

/**
 * Get the current image hosting mode
 * @returns {'cloudinary' | 'fallback'}
 */
export const getImageHostingMode = () => cloudinaryConfigured ? 'cloudinary' : 'fallback';

// Detect MIME type from buffer magic bytes
const detectMimeType = (buffer) => {
  if (buffer.length < 4) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return 'image/jpeg'; // default
};

/**
 * Upload an image buffer to Cloudinary (or fallback to base64 data URI)
 * @param {Buffer} buffer - Image file buffer from multer
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadToCloudinary = (buffer, folder = 'megabasket/products') => {
  return new Promise((resolve, reject) => {
    if (cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error.message);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    } else {
      // Fallback: convert buffer to base64 data URI
      // Detect correct MIME type from buffer content for accurate rendering
      const mimeType = detectMimeType(buffer);
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      resolve({
        url: dataUri,
        public_id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      });
    }
  });
};

/**
 * Delete image from Cloudinary by public_id
 * @param {string} public_id
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (public_id) => {
  if (cloudinaryConfigured && public_id && !public_id.startsWith('fallback_') && !public_id.startsWith('mock_')) {
    return await cloudinary.uploader.destroy(public_id);
  }
  return { result: 'ok' };
};
