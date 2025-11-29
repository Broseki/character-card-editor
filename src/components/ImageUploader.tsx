import { useRef, useEffect, useState } from 'react';

import { createPlaceholderImage, convertImageToPng } from '../utils/pngUtils';

interface ImageUploaderProps {
  imageData: string | null;
  onImageChange: (dataUrl: string, file: File | Blob) => void;
}

export function ImageUploader({ imageData, onImageChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4">
      <div
        className={`relative w-40 h-60 md:w-48 md:h-72 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {imageData && (
          // Only render image if data is a valid image data URL or HTTP(S) URL
          (typeof imageData === 'string' && (
            imageData.startsWith('data:image/') ||
            imageData.startsWith('https://') ||
            imageData.startsWith('http://')
          )) ? (
            <img
              src={imageData}
              alt="Character card"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-red-500">
              Invalid image data
            </div>
          )
        )}
        {!imageData && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
            Loading...
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-sm">Click or drop to change</span>
        </div>
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
    </div>
  );
}
