import extractChunks from 'png-chunks-extract';
import encodeChunks from 'png-chunks-encode';
import * as text from 'png-chunk-text';

import type {
  SpecVersion,
  CharacterCard,
  TavernCardV1,
  TavernCardV2,
  TavernCardV3,
  EditorCardData,
} from './types';
import {
  editorDataToV1,
  editorDataToV2,
  editorDataToV3,
  cardToEditorData,
  detectCardVersion,
} from './types';

interface PngChunk {
  name: string;
  data: Uint8Array;
}

interface ExtractedCard {
  card: CharacterCard;
  detectedVersion: SpecVersion;
}

export async function extractCardFromPng(file: File): Promise<ExtractedCard | null> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  try {
    const chunks = extractChunks(uint8Array);

    // First try V3 (ccv3 chunk)
    for (const chunk of chunks) {
      if (chunk.name === 'tEXt') {
        const decoded = text.decode(chunk.data);
        if (decoded.keyword === 'ccv3') {
          const jsonString = decodeURIComponent(escape(atob(decoded.text)));
          const parsed = JSON.parse(jsonString) as TavernCardV3;
          return { card: parsed, detectedVersion: 'v3' };
        }
      }
    }

    // Then try V1/V2 (chara chunk)
    for (const chunk of chunks) {
      if (chunk.name === 'tEXt') {
        const decoded = text.decode(chunk.data);
        if (decoded.keyword === 'chara') {
          const jsonString = decodeURIComponent(escape(atob(decoded.text)));
          const parsed = JSON.parse(jsonString);
          const version = detectCardVersion(parsed);

          if (version === 'v2' || parsed.spec === 'chara_card_v2') {
            return { card: parsed as TavernCardV2, detectedVersion: 'v2' };
          }

          // V1 card
          return { card: parsed as TavernCardV1, detectedVersion: 'v1' };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting card from PNG:', error);
    return null;
  }
}

export async function embedCardInPng(
  imageFile: File | Blob,
  data: EditorCardData,
  version: SpecVersion
): Promise<Blob> {
  const buffer = await imageFile.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  const chunks = extractChunks(uint8Array);

  // Remove existing chara and ccv3 chunks
  const filteredChunks = chunks.filter((chunk: PngChunk) => {
    if (chunk.name === 'tEXt') {
      try {
        const decoded = text.decode(chunk.data);
        return decoded.keyword !== 'chara' && decoded.keyword !== 'ccv3';
      } catch {
        return true;
      }
    }
    return true;
  });

  // Create the appropriate chunk based on version
  let cardJson: string;
  let chunkKeyword: string;

  if (version === 'v1') {
    cardJson = JSON.stringify(editorDataToV1(data));
    chunkKeyword = 'chara';
  } else if (version === 'v2') {
    cardJson = JSON.stringify(editorDataToV2(data));
    chunkKeyword = 'chara';
  } else {
    cardJson = JSON.stringify(editorDataToV3(data));
    chunkKeyword = 'ccv3';
  }

  const base64Data = btoa(unescape(encodeURIComponent(cardJson)));
  const cardChunk = text.encode(chunkKeyword, base64Data);

  // Insert before IEND (last chunk)
  const iendIndex = filteredChunks.findIndex((c: PngChunk) => c.name === 'IEND');
  if (iendIndex !== -1) {
    filteredChunks.splice(iendIndex, 0, cardChunk);
  } else {
    filteredChunks.push(cardChunk);
  }

  const newPngBuffer = encodeChunks(filteredChunks);
  return new Blob([new Uint8Array(newPngBuffer)], { type: 'image/png' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(data: EditorCardData, version: SpecVersion, filename: string): void {
  let card: CharacterCard;

  if (version === 'v1') {
    card = editorDataToV1(data);
  } else if (version === 'v2') {
    card = editorDataToV2(data);
  } else {
    card = editorDataToV3(data);
  }

  const jsonString = JSON.stringify(card, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, filename);
}

// Create a simple placeholder image
export async function createPlaceholderImage(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Dark gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#1f2937');
  gradient.addColorStop(1, '#111827');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 600);

  // Add a subtle pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 30; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 20, j * 20, 20, 20);
      }
    }
  }

  // Character icon placeholder
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.arc(200, 250, 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(200, 230, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(200, 320, 55, 35, 0, Math.PI, 0);
  ctx.fill();

  // Text
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Character Card', 200, 420);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

/**
 * Converts any image file to PNG format using canvas.
 * Throws an error if the file cannot be loaded as an image.
 */
export async function convertImageToPng(file: File | Blob): Promise<Blob> {
  // If already a PNG, return as-is
  if (file.type === 'image/png') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        },
        'image/png'
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. The file may be corrupted or not a valid image.'));
    };

    img.src = url;
  });
}

// Re-export for convenience
export { cardToEditorData, detectCardVersion };
