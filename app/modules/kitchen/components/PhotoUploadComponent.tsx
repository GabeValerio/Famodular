"use client";

import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';

interface PhotoUploadComponentProps {
  onPhotoTaken: (imageData: string[]) => void | Promise<void>;
  onCancel?: () => void;
}

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    console.log('compressImage: Starting compression for', file.name, 'size:', file.size);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      console.log('compressImage: File loaded as data URL');
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        console.log('compressImage: Image loaded, dimensions:', img.width, 'x', img.height);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        console.log('compressImage: Resizing to', width, 'x', height);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          console.log('compressImage: Blob created, size:', blob.size);
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (error) => {
        console.error('compressImage: Image load error', error);
        reject(error);
      };
    };
    reader.onerror = (error) => {
      console.error('compressImage: FileReader error', error);
      reject(error);
    };
  });
};

export function PhotoUploadComponent({ onPhotoTaken, onCancel }: PhotoUploadComponentProps) {
  console.log('PhotoUploadComponent: Component rendered');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('PhotoUploadComponent: handleFileUpload called');
    const files = e.target.files;
    console.log('PhotoUploadComponent: files selected:', files?.length || 0);
    if (!files || files.length === 0) {
      console.log('PhotoUploadComponent: No files selected, returning');
      return;
    }

    setIsProcessing(true);
    try {
      const fileArray = Array.from(files);
      const processedImages: string[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) {
          continue; // Skip non-image files
        }

        try {
          // Compress image before processing
          let fileToProcess = file;
          if (file.size > 1 * 1024 * 1024) { // If larger than 1MB
            try {
              console.log('PhotoUploadComponent: Compressing image', file.name);
              fileToProcess = await compressImage(file);
              console.log('PhotoUploadComponent: Compressed from', file.size, 'to', fileToProcess.size);
            } catch (compressError) {
              console.error('PhotoUploadComponent: Compression failed for', file.name, compressError);
              // Continue with original file if compression fails
            }
          }

          // Check file size after compression
          if (fileToProcess.size > 4.5 * 1024 * 1024) { // 4.5MB safe limit
            console.warn(`Image ${file.name} is too large, skipping`);
            continue;
          }

          // Convert file to base64
          const reader = new FileReader();
          const base64String = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fileToProcess);
          });

          console.log('PhotoUploadComponent: Converted to base64, length:', base64String.length);
          processedImages.push(base64String);
        } catch (error) {
          console.error(`Error processing image ${file.name}:`, error);
          // Continue with other images even if one fails
        }
      }

      setCapturedImages(prev => [...prev, ...processedImages]);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Failed to process some images. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset input to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (capturedImages.length > 0) {
      console.log('PhotoUploadComponent: Analyzing', capturedImages.length, 'images');
      onPhotoTaken(capturedImages);
      setCapturedImages([]);
    }
  };

  const handleCancel = () => {
    setCapturedImages([]);
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button - Simple like Plants module */}
      {capturedImages.length === 0 && (
        <div className="space-y-4">
          <Button
            onClick={() => {
              console.log('PhotoUploadComponent: Upload button clicked');
              fileInputRef.current?.click();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload from Gallery
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Select multiple photos from your camera roll
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Image Gallery */}
      {capturedImages.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium">
              {capturedImages.length} photo{capturedImages.length !== 1 ? 's' : ''} ready for analysis
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {capturedImages.map((imageData, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={imageData}
                    alt={`Kitchen inventory ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add more photos button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <Upload className="h-6 w-6 mb-2" />
              <span className="text-xs">Add More</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                console.log('PhotoUploadComponent: Analyze button clicked');
                handleConfirm();
              }}
              className="flex-1"
              disabled={capturedImages.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Analyze {capturedImages.length} Photo{capturedImages.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            AI will analyze all photos and identify food items automatically
          </p>
        </div>
      )}
    </div>
  );
}
