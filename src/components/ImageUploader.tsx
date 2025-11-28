import { useRef, useEffect, useState } from 'react';

import { createPlaceholderImage } from '../utils/pngUtils';

interface ImageUploaderProps {
  imageData: string | null;
  onImageChange: (dataUrl: string, file: File | Blob) => void;
}

export function ImageUploader({ imageData, onImageChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageChange(reader.result as string, file);
      };
      reader.readAsDataURL(file);
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
        {imageData ? (
          <img
            src={imageData}
            alt="Character card"
            className="w-full h-full object-cover"
          />
        ) : (
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
    </div>
  );
}
