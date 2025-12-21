# Image Storage Guide

This document explains how images (including profile images and images from URLs) are saved and stored in the Dreamyhaus application.

## Overview

Dreamyhaus uses **Cloudinary** as the primary image storage and CDN service. All images are uploaded to Cloudinary and stored with public access, allowing them to be served directly from Cloudinary's CDN.

## Architecture

### Storage Service: Cloudinary

Cloudinary is configured in `/lib/cloudinary.ts` and requires the following environment variables:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Main Upload Function

The core upload function is `uploadToCloudinary()` located in `/lib/cloudinary.ts`. This function:
- Accepts a file as a base64 string or URL
- Uploads to Cloudinary with configurable options
- Returns metadata including the secure URL, public_id, dimensions, and file size
- Handles both images and raw files (like PDFs)

## Image Upload Methods

### 1. File Upload (Form Data)

**Use Case**: User uploads an image file from their device (profile images, identity documents, etc.)

**API Endpoint**: `/api/upload`

**Flow**:
1. Client sends a `FormData` request with:
   - `file`: The image file
   - `folder`: The Cloudinary folder name (e.g., `'profile-images'`, `'identity-documents'`)

2. Server (`/app/api/upload/route.ts`):
   - Validates user session (authentication required)
   - Converts file to base64 string
   - Strips file extension from filename for `public_id` (to avoid double extensions)
   - Determines resource type (image or raw for PDFs)
   - Uploads to Cloudinary with:
     - Folder organization
     - Unique `public_id` using timestamp and filename
     - Public access mode
   - Returns the Cloudinary URL and metadata

**Example Usage** (Profile Image Upload):
```typescript
// From StepUser.tsx
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'profile-images');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
const imageUrl = result.data.url; // Cloudinary URL
```

**File Validation**:
- Profile images: Max 5MB, must be image type
- Identity documents: Max 10MB, must be image type
- General uploads: File type validation varies by use case

### 2. URL-Based Image Upload

**Use Case**: Saving images from external URLs (e.g., property images scraped from Redfin)

**Flow**:
1. An image URL is obtained (from scraping, external APIs, etc.)
2. The URL is passed directly to `uploadToCloudinary()`
3. Cloudinary fetches the image from the URL and stores it
4. The Cloudinary URL is returned and saved to the database

**Example Usage** (Property Image Scraping):
```typescript
// From scrape-image/route.ts
const imageUrl = 'https://example.com/property-image.jpg';

const cloudinaryResult = await uploadToCloudinary(imageUrl, {
  folder: 'property-images',
  public_id: `redfin-${Date.now()}-${Math.random().toString(36).substring(7)}`,
});

const cloudinaryUrl = cloudinaryResult.url; // Saved to database
```

**Error Handling**: If the Cloudinary upload fails, the system falls back to using the original URL.

## Cloudinary Folder Organization

Images are organized into folders based on their purpose:

- **`profile-images`**: User profile pictures
- **`identity-documents`**: Identity verification documents (front/back)
- **`property-images`**: Property listing images
- **`uploads`**: General uploads (default folder)

## Database Storage

After upload, only the **Cloudinary URL** is stored in the database. The database does not store the actual image files.

**Common Database Fields**:
- `profile_image_url`: User profile images
- `image_url`: Property images
- `document_front_url` / `document_back_url`: Identity documents
- `imageUrls`: Arrays of image URLs (for multiple images)

## Image Access

### Direct Cloudinary URLs

Once uploaded, images are accessed directly via their Cloudinary URLs:
- Format: `https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}`
- All images are stored with `access_mode: 'public'` for direct access
- Cloudinary provides automatic CDN delivery and optimization

### Image Proxying

For security and CORS handling, some images are proxied through API routes:

**`/api/properties/image-proxy`**: 
- Proxies Google Maps images
- Only allows `https://maps.googleapis.com/` URLs for security
- Returns image with proper headers and caching

**`/api/properties/proxy-image`**:
- General image proxy for external URLs
- Handles CORS issues
- Returns images with cache headers

## Special Cases

### PDF Files

PDFs are uploaded as `resource_type: 'raw'` to Cloudinary:
- The URL is adjusted to use `/raw/upload/` instead of `/image/upload/`
- Stored in appropriate folders (e.g., `documents`)

### Identity Documents

Identity documents have a dual upload process:
1. **Cloudinary**: For persistent storage and display
2. **Stripe**: For identity verification (via `/api/stripe/upload-identity-document`)

The Cloudinary URL is used for display, while Stripe handles verification.

## Code Examples

### Uploading a Profile Image

```typescript
// Client-side (React component)
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'profile-images');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  const imageUrl = result.data.url; // Use this URL in your database
};
```

### Uploading from URL

```typescript
// Server-side
import { uploadToCloudinary } from '@/lib/cloudinary';

const imageUrl = 'https://external-site.com/image.jpg';

const result = await uploadToCloudinary(imageUrl, {
  folder: 'property-images',
  public_id: `property-${Date.now()}`,
});

// result.url is the Cloudinary URL to save
```

### Using the Cloudinary Library Directly

```typescript
import { uploadToCloudinary } from '@/lib/cloudinary';

// Upload with options
const result = await uploadToCloudinary(base64String, {
  folder: 'custom-folder',
  public_id: 'my-custom-id',
  resource_type: 'image', // or 'raw' for PDFs
  access_mode: 'public',
  transformation: [
    { width: 800, height: 600, crop: 'fill' }
  ]
});

// Result contains:
// - public_id: Cloudinary public ID
// - url: Secure URL for accessing the image
// - format: File format (jpg, png, etc.)
// - width, height: Image dimensions
// - bytes: File size
```

## Best Practices

1. **Always validate file types and sizes** before upload
2. **Use appropriate folders** to organize images by purpose
3. **Generate unique public_ids** using timestamps or UUIDs to avoid conflicts
4. **Store only URLs in the database**, not file data
5. **Handle upload errors gracefully** with fallback options when possible
6. **Use Cloudinary transformations** for image optimization when needed
7. **Set appropriate access modes** (public for most images)

## Error Handling

- Upload failures should be caught and handled with user-friendly error messages
- For URL-based uploads, consider falling back to the original URL if Cloudinary upload fails
- Always validate user authentication before allowing uploads
- Check file types and sizes before processing

## Security Considerations

1. **Authentication**: All upload endpoints require user authentication
2. **File Validation**: File types and sizes are validated before upload
3. **URL Validation**: Image proxy endpoints validate allowed URL sources
4. **Public Access**: Images are stored with public access for CDN delivery, but access is controlled through authentication on upload endpoints

## Environment Setup

Ensure these environment variables are set:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Related Files

- `/lib/cloudinary.ts` - Cloudinary configuration and upload functions
- `/app/api/upload/route.ts` - Main file upload API endpoint
- `/app/api/properties/scrape-image/route.ts` - Example of URL-based image upload
- `/app/dashboard/onboarding/components/StepUser.tsx` - Profile image upload example
- `/app/dashboard/onboarding/components/StepIdentity.tsx` - Identity document upload example
