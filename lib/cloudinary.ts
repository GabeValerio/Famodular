import { v2 as cloudinary } from 'cloudinary';

try {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Missing environment variable: CLOUDINARY_CLOUD_NAME');
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error('Missing environment variable: CLOUDINARY_API_KEY');
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing environment variable: CLOUDINARY_API_SECRET');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (error) {
  // During build time or when Cloudinary is not configured
  // Cloudinary not configured
}

export { cloudinary };

export const uploadToCloudinary = async (
  file: string,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw';
    transformation?: any[];
  } = {}
) => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: options.folder || 'uploads',
      public_id: options.public_id,
      resource_type: options.resource_type || 'image',
      transformation: options.transformation,
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error: any) {
    // Provide more specific error messages
    if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed. Please check your API credentials.');
    } else if (error.http_code === 400) {
      throw new Error(`Invalid upload request: ${error.message || 'Please check your file format and size.'}`);
    } else if (error.message) {
      throw new Error(`Upload failed: ${error.message}`);
    } else {
      throw new Error('Failed to upload file to Cloudinary. Please try again.');
    }
  }
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    throw error;
  }
};
