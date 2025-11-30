import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { ImageCropper } from '../../components/ImageCropper';

// ============== Mocks ==============

// Create a valid minimal PNG data URL for testing
const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Mock canvas context
const mockCanvasContext = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
};

// Mock canvas toBlob
const mockToBlob = vi.fn((callback: BlobCallback) => {
  const blob = new Blob(['test'], { type: 'image/png' });
  callback(blob);
});

// Store original methods
let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
let originalToBlob: typeof HTMLCanvasElement.prototype.toBlob;
let originalImage: typeof global.Image;
let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

beforeEach(() => {
  // Mock canvas getContext
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as typeof HTMLCanvasElement.prototype.getContext;

  // Mock canvas toBlob
  originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = mockToBlob;

  // Mock Image
  originalImage = global.Image;
  class MockImage {
    width = 800;
    height = 600;
    src = '';
    onload: (() => void) | null = null;

    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }
  global.Image = MockImage as unknown as typeof Image;

  // Mock requestAnimationFrame
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    rafCallbacks.push(callback);
    return ++rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toBlob = originalToBlob;
  global.Image = originalImage;
  vi.restoreAllMocks();
});

// ============== ImageCropper Tests ==============

describe('ImageCropper', () => {
  // Happy path - Rendering
  describe('Rendering', () => {
    it('should render modal with title', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should render instructions text', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Drag to reposition, pinch or use buttons to zoom')).toBeInTheDocument();
    });

    it('should render zoom in button', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });

    it('should render zoom out button', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render Apply Crop button', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: 'Apply Crop' })).toBeInTheDocument();
    });

    it('should render canvas element', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('should show loading state before image loads', () => {
      // Override Image mock to not auto-load
      class SlowMockImage {
        width = 800;
        height = 600;
        src = '';
        onload: (() => void) | null = null;
      }
      global.Image = SlowMockImage as unknown as typeof Image;

      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render corner indicators', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Check for corner indicator divs (4 corners)
      const corners = container.querySelectorAll('.border-white\\/50');
      expect(corners.length).toBe(4);
    });
  });

  // Happy path - Zoom Controls
  describe('Zoom Controls', () => {
    it('should increase zoom when zoom in button is clicked', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });

      // Get initial zoom display
      const initialZoomText = screen.getByText(/%$/);
      const initialZoom = parseInt(initialZoomText.textContent || '0');

      fireEvent.click(zoomInButton);

      // Zoom should increase by 20% (ZOOM_STEP = 0.2)
      await waitFor(() => {
        const newZoomText = screen.getByText(/%$/);
        const newZoom = parseInt(newZoomText.textContent || '0');
        expect(newZoom).toBeGreaterThan(initialZoom);
      });
    });

    it('should decrease zoom when zoom out button is clicked', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });
      const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });

      // First zoom in to have room to zoom out
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomText = screen.getByText(/%$/);
      const zoomBeforeOut = parseInt(zoomText.textContent || '0');

      fireEvent.click(zoomOutButton);

      await waitFor(() => {
        const newZoomText = screen.getByText(/%$/);
        const newZoom = parseInt(newZoomText.textContent || '0');
        expect(newZoom).toBeLessThan(zoomBeforeOut);
      });
    });

    it('should display zoom percentage', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should show a percentage
      expect(screen.getByText(/%$/)).toBeInTheDocument();
    });

    it('should handle wheel scroll for zooming', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const cropArea = container.querySelector('.cursor-move');
      expect(cropArea).toBeInTheDocument();

      const initialZoomText = screen.getByText(/%$/);
      const initialZoom = parseInt(initialZoomText.textContent || '0');

      // Scroll up to zoom in
      fireEvent.wheel(cropArea!, { deltaY: -100 });

      await waitFor(() => {
        const newZoomText = screen.getByText(/%$/);
        const newZoom = parseInt(newZoomText.textContent || '0');
        expect(newZoom).toBeGreaterThan(initialZoom);
      });
    });
  });

  // Happy path - Action Buttons
  describe('Action Buttons', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCrop with data URL and blob when Apply Crop is clicked', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      fireEvent.click(screen.getByRole('button', { name: 'Apply Crop' }));

      await waitFor(() => {
        expect(onCrop).toHaveBeenCalledTimes(1);
        expect(onCrop).toHaveBeenCalledWith(
          expect.stringContaining('data:'),
          expect.any(Blob)
        );
      });
    });
  });

  // Happy path - Mouse Interactions
  describe('Mouse Interactions', () => {
    it('should handle mouse down on crop area', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const cropArea = container.querySelector('.cursor-move');
      expect(cropArea).toBeInTheDocument();

      // Should not throw
      fireEvent.mouseDown(cropArea!, { clientX: 100, clientY: 100 });
    });

    it('should handle mouse move for dragging', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const cropArea = container.querySelector('.cursor-move');

      // Start drag
      fireEvent.mouseDown(cropArea!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(cropArea!, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(cropArea!);

      // Should not throw and canvas should be redrawn
      expect(mockCanvasContext.drawImage).toHaveBeenCalled();
    });

    it('should stop dragging on mouse leave', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const cropArea = container.querySelector('.cursor-move');

      fireEvent.mouseDown(cropArea!, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(cropArea!);

      // Should not throw
      fireEvent.mouseMove(cropArea!, { clientX: 200, clientY: 200 });
    });
  });

  // Happy path - Touch Interactions
  describe('Touch Interactions', () => {
    it('should handle single touch for dragging', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const cropArea = container.querySelector('.cursor-move');

      const touch = { clientX: 100, clientY: 100 };

      fireEvent.touchStart(cropArea!, {
        touches: [touch],
      });

      fireEvent.touchMove(cropArea!, {
        touches: [{ clientX: 150, clientY: 150 }],
      });

      fireEvent.touchEnd(cropArea!);

      // Should not throw
      expect(cropArea).toBeInTheDocument();
    });

    it('should handle two-finger pinch for zooming', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const cropArea = container.querySelector('.cursor-move');

      const initialZoomText = screen.getByText(/%$/);
      const initialZoom = parseInt(initialZoomText.textContent || '0');

      // Start pinch with two fingers close together
      fireEvent.touchStart(cropArea!, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 110, clientY: 100 },
        ],
      });

      // Spread fingers apart (zoom in)
      fireEvent.touchMove(cropArea!, {
        touches: [
          { clientX: 50, clientY: 100 },
          { clientX: 160, clientY: 100 },
        ],
      });

      fireEvent.touchEnd(cropArea!);

      await waitFor(() => {
        const newZoomText = screen.getByText(/%$/);
        const newZoom = parseInt(newZoomText.textContent || '0');
        expect(newZoom).toBeGreaterThan(initialZoom);
      });
    });

    it('should handle touch end', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const cropArea = container.querySelector('.cursor-move');

      fireEvent.touchStart(cropArea!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(cropArea!);

      // Should not throw
      expect(cropArea).toBeInTheDocument();
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should not zoom beyond maximum', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });

      // Click many times to try to exceed max (500%)
      for (let i = 0; i < 50; i++) {
        fireEvent.click(zoomInButton);
      }

      await waitFor(() => {
        const zoomText = screen.getByText(/%$/);
        const zoom = parseInt(zoomText.textContent || '0');
        expect(zoom).toBeLessThanOrEqual(500);
      });
    });

    it('should not zoom below minimum', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });

      // Click many times to try to go below min (10%)
      for (let i = 0; i < 50; i++) {
        fireEvent.click(zoomOutButton);
      }

      await waitFor(() => {
        const zoomText = screen.getByText(/%$/);
        const zoom = parseInt(zoomText.textContent || '0');
        expect(zoom).toBeGreaterThanOrEqual(10);
      });
    });

    it('should handle rapid zoom button clicks', async () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
      const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });

      // Rapid alternating clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton);
        fireEvent.click(zoomOutButton);
      }

      // Should not throw and component should still be functional
      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle toBlob returning null', async () => {
      // Override toBlob to return null
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
        callback(null);
      });

      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      fireEvent.click(screen.getByRole('button', { name: 'Apply Crop' }));

      // onCrop should not be called if blob is null
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(onCrop).not.toHaveBeenCalled();
    });

    it('should handle image that fails to load', async () => {
      // Override Image mock to trigger error
      class FailingMockImage {
        width = 0;
        height = 0;
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }
      global.Image = FailingMockImage as unknown as typeof Image;

      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Should still show loading since image never loads
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle very small image', async () => {
      class SmallMockImage {
        width = 10;
        height = 10;
        src = '';
        onload: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      global.Image = SmallMockImage as unknown as typeof Image;

      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should calculate large initial zoom to cover crop area
      const zoomText = screen.getByText(/%$/);
      const zoom = parseInt(zoomText.textContent || '0');
      // For 10x10 image to cover 400x600, zoom should be 6000% (60x)
      expect(zoom).toBeGreaterThan(100);
    });

    it('should handle very large image', async () => {
      class LargeMockImage {
        width = 10000;
        height = 10000;
        src = '';
        onload: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      global.Image = LargeMockImage as unknown as typeof Image;

      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should calculate small initial zoom
      const zoomText = screen.getByText(/%$/);
      const zoom = parseInt(zoomText.textContent || '0');
      expect(zoom).toBeLessThan(100);
    });
  });

  // Malicious path - Security
  describe('Malicious Input Handling', () => {
    it('should handle malicious data URL', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const maliciousDataUrl = 'data:image/png;base64,<script>alert("xss")</script>';

      // Should not throw
      render(<ImageCropper imageData={maliciousDataUrl} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle javascript: protocol in image data', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const jsProtocol = 'javascript:alert(1)';

      // Should not throw
      render(<ImageCropper imageData={jsProtocol} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle extremely long data URL', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const longDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000000);

      // Should not throw
      render(<ImageCropper imageData={longDataUrl} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle null bytes in data URL', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const nullByteUrl = 'data:image/png;base64,abc\x00def';

      // Should not throw
      render(<ImageCropper imageData={nullByteUrl} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle unicode in data URL', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const unicodeUrl = 'data:image/png;base64,你好世界🎉';

      // Should not throw
      render(<ImageCropper imageData={unicodeUrl} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle empty data URL', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      // Should not throw
      render(<ImageCropper imageData="" onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should handle data URL with wrong MIME type', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      const wrongMimeUrl = 'data:text/html,<script>alert(1)</script>';

      // Should not throw
      render(<ImageCropper imageData={wrongMimeUrl} onCrop={onCrop} onCancel={onCancel} />);

      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should have accessible zoom buttons', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
      const zoomOut = screen.getByRole('button', { name: 'Zoom out' });

      expect(zoomIn).toHaveAttribute('aria-label', 'Zoom in');
      expect(zoomOut).toHaveAttribute('aria-label', 'Zoom out');
    });

    it('should have type="button" on all buttons to prevent form submission', () => {
      const onCrop = vi.fn();
      const onCancel = vi.fn();

      render(<ImageCropper imageData={VALID_PNG_DATA_URL} onCrop={onCrop} onCancel={onCancel} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
