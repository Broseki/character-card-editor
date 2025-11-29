import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  ellipse: vi.fn(),
  font: '',
  textAlign: '',
  fillText: vi.fn(),
  drawImage: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
  callback(new Blob(['mock-png-data'], { type: 'image/png' }));
}) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
