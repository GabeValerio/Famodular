import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'File upload service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(base64String, {
      folder,
      public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      resource_type: file.type.startsWith('video/') ? 'video' : 'image',
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
