import { useRef, useEffect, useState, useId } from 'react';

import { createPlaceholderImage, convertImageToPng } from '../utils/pngUtils';
import { ImageCropper } from './ImageCropper';

interface ImageUploaderProps {
  imageData: string | null;
  onImageChange: (dataUrl: string, file: File | Blob) => void;
}

// Max dimensions for the preview box (matches the original fixed size)
const MAX_WIDTH_MOBILE = 160; // w-40
const MAX_HEIGHT_MOBILE = 240; // h-60
const MAX_WIDTH_DESKTOP = 192; // md:w-48
const MAX_HEIGHT_DESKTOP = 288; // md:h-72

export function ImageUploader({ imageData, onImageChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const instanceId = useId().replace(/:/g, '');

  // Load image to get dimensions
  useEffect(() => {
    if (!imageData || !imageData.startsWith('data:image/png;base64,')) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setImageDimensions(null));
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    if (!imageData) {
      createPlaceholderImage().then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          onImageChange(reader.result as string, blob);
        };
        reader.readAsDataURL(blob);
      });
    }
  }, [imageData, onImageChange]);

  // Calculate preview box size that fits within max area while maintaining aspect ratio
  const getPreviewSize = (maxWidth: number, maxHeight: number) => {
    if (!imageDimensions) {
      // Default to recommended 2:3 aspect ratio
      return { width: maxWidth, height: maxHeight };
    }

    const { width: imgWidth, height: imgHeight } = imageDimensions;
    const imgAspect = imgWidth / imgHeight;
    const maxAspect = maxWidth / maxHeight;

    if (imgAspect > maxAspect) {
      // Image is wider than max area - fit to width
      return { width: maxWidth, height: Math.round(maxWidth / imgAspect) };
    } else {
      // Image is taller than max area - fit to height
      return { width: Math.round(maxHeight * imgAspect), height: maxHeight };
    }
  };

  const mobileSize = getPreviewSize(MAX_WIDTH_MOBILE, MAX_HEIGHT_MOBILE);
  const desktopSize = getPreviewSize(MAX_WIDTH_DESKTOP, MAX_HEIGHT_DESKTOP);

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      // Convert to PNG (returns as-is if already PNG)
      const pngBlob = await convertImageToPng(file);

      const reader = new FileReader();
      reader.onload = () => {
        onImageChange(reader.result as string, pngBlob);
      };
      reader.readAsDataURL(pngBlob);
    } catch (err) {
      console.error('Image conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCropComplete = (croppedDataUrl: string, blob: Blob) => {
    onImageChange(croppedDataUrl, blob);
    setShowCropper(false);
  };

  const handleCropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageData && imageData.startsWith('data:image/png;base64,')) {
      setShowCropper(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4">
      <div className="relative">
        <div
          id={`preview-${instanceId}`}
          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          style={{
            width: mobileSize.width,
            height: mobileSize.height,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Apply desktop sizes via CSS media query */}
          <style>{`
            @media (min-width: 768px) {
              #preview-${instanceId} {
                width: ${desktopSize.width}px !important;
                height: ${desktopSize.height}px !important;
              }
            }
          `}</style>
          {imageData ? (
            // Only render image if data is a valid PNG data URL (the only format this app produces)
            imageData.startsWith('data:image/png;base64,') ? (
              <img
                src={imageData}
                alt="Character card"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-red-500">
                Invalid image data
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
              Loading...
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm">Click or drop to change</span>
          </div>
        </div>
        {/* Crop button */}
        {imageData && imageData.startsWith('data:image/png;base64,') && (
          <button
            type="button"
            onClick={handleCropClick}
            className="absolute -right-2 -top-2 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors"
            title="Crop to 400×600"
            aria-label="Crop image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
      <p className="text-xs text-gray-500 text-center">
        Recommended: 400×600px
      </p>
      {error && (
        <p className="text-xs text-red-400 text-center max-w-48">
          {error}
        </p>
      )}
      {/* Image Cropper Modal */}
      {showCropper && imageData && (
        <ImageCropper
          imageData={imageData}
          onCrop={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}
