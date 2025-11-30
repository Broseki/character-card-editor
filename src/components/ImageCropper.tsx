import { useRef, useState, useEffect, useCallback } from 'react';

interface ImageCropperProps {
  imageData: string;
  onCrop: (croppedDataUrl: string, blob: Blob) => void;
  onCancel: () => void;
}

const CROP_WIDTH = 400;
const CROP_HEIGHT = 600;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;
const ZOOM_LERP_SPEED = 0.15; // Smoothing factor (0-1, higher = faster)

export function ImageCropper({ imageData, onCrop, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [targetZoom, setTargetZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displayScale, setDisplayScale] = useState(1);

  // Track pinch gesture
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate display scale based on container size
  const updateDisplayScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 32; // padding
    const containerHeight = containerRef.current.clientHeight - 120; // buttons + padding
    const scaleX = containerWidth / CROP_WIDTH;
    const scaleY = containerHeight / CROP_HEIGHT;
    setDisplayScale(Math.min(scaleX, scaleY, 1));
  }, []);

  useEffect(() => {
    updateDisplayScale();
    window.addEventListener('resize', updateDisplayScale);
    return () => window.removeEventListener('resize', updateDisplayScale);
  }, [updateDisplayScale]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      // Calculate initial zoom to fit image in crop area (cover)
      const scaleX = CROP_WIDTH / img.width;
      const scaleY = CROP_HEIGHT / img.height;
      const initialZoom = Math.max(scaleX, scaleY);

      setZoom(initialZoom);
      setTargetZoom(initialZoom);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(true);
    };
    img.onerror = () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
    img.src = imageData;

    return () => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };
  }, [imageData]);

  // Smooth zoom animation
  useEffect(() => {
    const animate = () => {
      setZoom(currentZoom => {
        const diff = targetZoom - currentZoom;
        // Stop animating when close enough
        if (Math.abs(diff) < 0.001) {
          return targetZoom;
        }
        // Lerp toward target
        return currentZoom + diff * ZOOM_LERP_SPEED;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetZoom]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const scaledWidth = img.width * zoom;
    const scaledHeight = img.height * zoom;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

    // Draw image centered with offset
    const x = (CROP_WIDTH - scaledWidth) / 2 + position.x;
    const y = (CROP_HEIGHT - scaledHeight) / 2 + position.y;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }, [zoom, position, imageLoaded]);

  const handleZoomIn = () => {
    setTargetZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setTargetZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    } else if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch zoom - use direct zoom for responsive feel
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const scale = distance / lastTouchDistance.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scale));

      // Set both for immediate response during pinch
      setZoom(newZoom);
      setTargetZoom(newZoom);
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
    setTargetZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          onCrop(reader.result as string, blob);
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/png');
  };

  const displayWidth = CROP_WIDTH * displayScale;
  const displayHeight = CROP_HEIGHT * displayScale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        ref={containerRef}
        className="bg-gray-900 rounded-lg w-full max-w-lg max-h-full flex flex-col"
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Crop Image</h3>
          <p className="text-sm text-gray-400">Drag to reposition, pinch or use buttons to zoom</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="relative border-2 border-blue-500 rounded cursor-move touch-none"
            style={{ width: displayWidth, height: displayHeight }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={CROP_WIDTH}
              height={CROP_HEIGHT}
              className="w-full h-full rounded"
              style={{ imageRendering: 'auto' }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/50" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/50" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/50" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/50" />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-4 px-4 pb-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-xl font-bold transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
          <div className="text-gray-400 text-sm w-16 text-center">
            {Math.round(targetZoom * 100)}%
          </div>
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-xl font-bold transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
