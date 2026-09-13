import { Env } from '../env';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  folder: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export const cloudinaryService = {
  /**
   * Validates if a folder path is strictly within the giftagram namespace.
   * Do NOT allow uploads to purefumes/ or root.
   */
  validateNamespace(folder: string): boolean {
    // Cloudinary folders don't strictly need leading/trailing slashes, but we check the prefix.
    const normalized = folder.replace(/^\/+|\/+$/g, '');
    return normalized.startsWith('giftagram/');
  },

  /**
   * Generates a SHA-1 signature required by Cloudinary for authenticated REST API calls.
   * Required for Edge environments like Cloudflare Workers (replaces Node 'crypto' module).
   */
  async generateSignature(paramsToSign: Record<string, string>, apiSecret: string): Promise<string> {
    // 1. Sort params alphabetically by key
    const sortedKeys = Object.keys(paramsToSign).sort();
    
    // 2. Create the string to sign: key1=value1&key2=value2...
    const stringToSign = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    // 3. Append the API Secret
    const finalString = stringToSign + apiSecret;

    // 4. Hash using WebCrypto SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(finalString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    
    // 5. Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Uploads an image to Cloudinary using the authenticated REST API.
   * NOTE: Admin authentication must be verified by the calling route before using this!
   */
  async uploadImage(file: File, folder: string, env: Env): Promise<CloudinaryUploadResult> {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables are missing.');
    }

    if (!this.validateNamespace(folder)) {
      throw new Error('Invalid folder namespace. All uploads must be placed under "giftagram/".');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Params that must be signed
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = await this.generateSignature(paramsToSign, env.CLOUDINARY_API_SECRET);

    // Build form data for the REST API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudinary Upload Error]:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      folder: data.folder,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  },

  /**
   * Deletes an image from Cloudinary using the authenticated REST API.
   */
  async deleteImage(publicId: string, env: Env): Promise<void> {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables are missing.');
    }

    if (!this.validateNamespace(publicId)) {
      throw new Error('Invalid asset namespace. Only assets under "giftagram/" can be deleted.');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const paramsToSign = {
      public_id: publicId,
      timestamp,
    };

    const signature = await this.generateSignature(paramsToSign, env.CLOUDINARY_API_SECRET);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`;

    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudinary Destroy Error]:', errorText);
      throw new Error(`Cloudinary deletion failed: ${response.statusText}`);
    }
  },
};
