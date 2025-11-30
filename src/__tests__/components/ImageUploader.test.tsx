import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { ImageUploader } from '../../components/ImageUploader';

// ============== Mocks ==============

// Create a valid minimal PNG data URL for testing
const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Mock the pngUtils module
vi.mock('../../utils/pngUtils', () => ({
  createPlaceholderImage: vi.fn(() => Promise.resolve(new Blob(['test'], { type: 'image/png' }))),
  convertImageToPng: vi.fn((file: File) => Promise.resolve(file)),
}));

// Mock canvas context for ImageCropper
const mockCanvasContext = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
};

const mockToBlob = vi.fn((callback: BlobCallback) => {
  const blob = new Blob(['cropped'], { type: 'image/png' });
  callback(blob);
});

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
let originalToBlob: typeof HTMLCanvasElement.prototype.toBlob;
let originalImage: typeof global.Image;

beforeEach(() => {
  // Mock canvas
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as typeof HTMLCanvasElement.prototype.getContext;

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
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    return setTimeout(() => callback(performance.now()), 0) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id));

  vi.clearAllMocks();
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toBlob = originalToBlob;
  global.Image = originalImage;
  vi.restoreAllMocks();
});

// ============== ImageUploader Tests ==============

describe('ImageUploader', () => {
  // Happy path - Crop Button Rendering
  describe('Crop Button Rendering', () => {
    it('should render crop button when valid PNG image is provided', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });
      expect(cropButton).toBeInTheDocument();
    });

    it('should have correct title on crop button', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });
      expect(cropButton).toHaveAttribute('title', 'Crop to 400×600');
    });

    it('should not render crop button when no image data', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={null} onImageChange={onImageChange} />);

      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should not render crop button for non-PNG data URL', () => {
      const onImageChange = vi.fn();
      const jpegDataUrl = 'data:image/jpeg;base64,abc123';

      render(<ImageUploader imageData={jpegDataUrl} onImageChange={onImageChange} />);

      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should not render crop button for invalid data URL', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData="not-a-data-url" onImageChange={onImageChange} />);

      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should render crop button with SVG icon', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });
      const svg = cropButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // Happy path - Crop Modal Behavior
  describe('Crop Modal Behavior', () => {
    it('should open cropper when crop button is clicked', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });
      fireEvent.click(cropButton);

      await waitFor(() => {
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });
    });

    it('should close cropper when Cancel is clicked', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      // Open cropper
      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });

      // Close cropper
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Crop Image')).not.toBeInTheDocument();
      });
    });

    it('should call onImageChange and close cropper when Apply Crop is clicked', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      // Open cropper
      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });

      // Wait for image to load in cropper
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Apply crop
      fireEvent.click(screen.getByRole('button', { name: 'Apply Crop' }));

      await waitFor(() => {
        expect(onImageChange).toHaveBeenCalled();
        expect(screen.queryByText('Crop Image')).not.toBeInTheDocument();
      });
    });

    it('should not open file picker when crop button is clicked', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const cropButton = screen.getByRole('button', { name: 'Crop image' });
      fireEvent.click(cropButton);

      // File input should not be clicked
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  // Happy path - Image Display
  describe('Image Display', () => {
    it('should display image when valid PNG data URL is provided', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const img = screen.getByAltText('Character card');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', VALID_PNG_DATA_URL);
    });

    it('should show "Invalid image data" for non-PNG data URL', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData="data:image/jpeg;base64,abc" onImageChange={onImageChange} />);

      expect(screen.getByText('Invalid image data')).toBeInTheDocument();
    });

    it('should show recommended size text', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      expect(screen.getByText('Recommended: 400×600px')).toBeInTheDocument();
    });
  });

  // Happy path - Drag and Drop
  describe('Drag and Drop', () => {
    it('should show drag state on dragover', () => {
      const onImageChange = vi.fn();

      const { container } = render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const dropZone = container.querySelector('.cursor-pointer');

      fireEvent.dragOver(dropZone!);

      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('should remove drag state on dragleave', () => {
      const onImageChange = vi.fn();

      const { container } = render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const dropZone = container.querySelector('.cursor-pointer');

      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(dropZone).toHaveClass('border-gray-700');
    });
  });

  // Sad path - Edge Cases
  describe('Edge Cases', () => {
    it('should handle crop button click when imageData becomes null', () => {
      const onImageChange = vi.fn();

      const { rerender } = render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      // Verify crop button exists initially
      expect(screen.getByRole('button', { name: 'Crop image' })).toBeInTheDocument();

      // Change imageData to null
      rerender(<ImageUploader imageData={null} onImageChange={onImageChange} />);

      // Crop button should no longer be in document
      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should handle rapid crop button clicks', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });

      // Rapid clicks
      fireEvent.click(cropButton);
      fireEvent.click(cropButton);
      fireEvent.click(cropButton);

      // Should only have one cropper open
      await waitFor(() => {
        const cropTitles = screen.getAllByText('Crop Image');
        expect(cropTitles.length).toBe(1);
      });
    });

    it('should handle imageData changing while cropper is open', async () => {
      const onImageChange = vi.fn();
      const newPngUrl = 'data:image/png;base64,differentbase64content';

      const { rerender } = render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      // Open cropper
      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });

      // Change imageData
      rerender(<ImageUploader imageData={newPngUrl} onImageChange={onImageChange} />);

      // Cropper should still be visible (uses original imageData)
      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    it('should position crop button correctly', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });

      // Check positioning classes
      expect(cropButton).toHaveClass('absolute');
      expect(cropButton).toHaveClass('-right-2');
      expect(cropButton).toHaveClass('-top-2');
    });
  });

  // Malicious path - Security
  describe('Malicious Input Handling', () => {
    it('should not render crop button for javascript: protocol', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData="javascript:alert(1)" onImageChange={onImageChange} />);

      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should not render crop button for data URL with wrong MIME', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData="data:text/html,<script>alert(1)</script>" onImageChange={onImageChange} />);

      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();
    });

    it('should handle XSS attempt in data URL', () => {
      const onImageChange = vi.fn();
      const xssDataUrl = 'data:image/png;base64,<script>alert("xss")</script>';

      // Should not throw - the component only checks the prefix
      // The actual XSS content would fail when loaded as an image
      render(<ImageUploader imageData={xssDataUrl} onImageChange={onImageChange} />);

      // Crop button shows because prefix matches, but image won't actually load
      expect(screen.getByRole('button', { name: 'Crop image' })).toBeInTheDocument();
    });

    it('should safely handle very long imageData', () => {
      const onImageChange = vi.fn();
      const longDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000000);

      // Should not throw
      render(<ImageUploader imageData={longDataUrl} onImageChange={onImageChange} />);

      // Should show crop button since it starts with valid prefix
      expect(screen.getByRole('button', { name: 'Crop image' })).toBeInTheDocument();
    });

    it('should handle null bytes in imageData', () => {
      const onImageChange = vi.fn();
      const nullByteUrl = 'data:image/png;base64,abc\x00def';

      // Should not throw
      render(<ImageUploader imageData={nullByteUrl} onImageChange={onImageChange} />);

      expect(screen.getByRole('button', { name: 'Crop image' })).toBeInTheDocument();
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should have accessible crop button', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const cropButton = screen.getByRole('button', { name: 'Crop image' });

      expect(cropButton).toHaveAttribute('aria-label', 'Crop image');
      expect(cropButton).toHaveAttribute('type', 'button');
    });

    it('should have alt text on image', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const img = screen.getByAltText('Character card');
      expect(img).toBeInTheDocument();
    });

    it('should have accessible file input', () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  // Integration with ImageCropper
  describe('Integration with ImageCropper', () => {
    it('should pass imageData to ImageCropper', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        // ImageCropper should receive and display the image
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });
    });

    it('should show zoom controls when cropper is open', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
      });
    });

    it('should update image after crop is applied', async () => {
      const onImageChange = vi.fn();

      render(<ImageUploader imageData={VALID_PNG_DATA_URL} onImageChange={onImageChange} />);

      // Open cropper
      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      await waitFor(() => {
        expect(screen.getByText('Crop Image')).toBeInTheDocument();
      });

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Apply crop
      fireEvent.click(screen.getByRole('button', { name: 'Apply Crop' }));

      await waitFor(() => {
        expect(onImageChange).toHaveBeenCalledWith(
          expect.stringContaining('data:'),
          expect.any(Blob)
        );
      });
    });
  });
});
