import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  downloadBlob,
  downloadJson,
  cardToEditorData,
  detectCardVersion,
  extractCardFromPng,
  embedCardInPng,
  convertImageToPng,
  createPlaceholderImage,
} from '../../utils/pngUtils';
import { createEmptyEditorData, type EditorCardData, type TavernCardV1, type TavernCardV2, type TavernCardV3 } from '../../utils/types';

// Mock png-chunks modules
vi.mock('png-chunks-extract', () => ({
  default: vi.fn(),
}));

vi.mock('png-chunks-encode', () => ({
  default: vi.fn(),
}));

vi.mock('png-chunk-text', () => ({
  decode: vi.fn(),
  encode: vi.fn(),
}));

import extractChunks from 'png-chunks-extract';
import encodeChunks from 'png-chunks-encode';
import * as text from 'png-chunk-text';

// ============== Test Data Fixtures ==============

const sampleV1Card: TavernCardV1 = {
  name: 'Test Character',
  description: 'A test description',
  personality: 'Friendly',
  scenario: 'Test scenario',
  first_mes: 'Hello!',
  mes_example: 'Example',
};

const sampleV2Card: TavernCardV2 = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: 'V2 Character',
    description: 'V2 description',
    personality: 'V2 personality',
    scenario: 'V2 scenario',
    first_mes: 'V2 hello',
    mes_example: 'V2 example',
    creator_notes: 'V2 notes',
    system_prompt: 'V2 system',
    post_history_instructions: 'V2 instructions',
    alternate_greetings: [],
    tags: [],
    creator: 'V2 Creator',
    character_version: '2.0',
    extensions: {},
  },
};

const sampleV3Card: TavernCardV3 = {
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    ...sampleV2Card.data,
    group_only_greetings: ['Group hello'],
    nickname: 'V3Nick',
  },
};

const sampleEditorData: EditorCardData = {
  name: 'Editor Test',
  description: 'Editor description',
  personality: 'Editor personality',
  scenario: 'Editor scenario',
  first_mes: 'Editor hello',
  mes_example: 'Editor example',
  creator_notes: 'Editor notes',
  system_prompt: 'Editor system',
  post_history_instructions: 'Editor instructions',
  alternate_greetings: ['Alt 1', 'Alt 2'],
  tags: ['tag1', 'tag2'],
  creator: 'Editor Creator',
  character_version: '1.0',
  extensions: {},
  assets: [],
  nickname: 'EditorNick',
  creator_notes_multilingual: {},
  source: [],
  group_only_greetings: ['Group greeting'],
};

// ============== downloadBlob Tests ==============

describe('downloadBlob', () => {
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Happy path
  describe('Happy Path', () => {
    it('should create download link and trigger click', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });

      downloadBlob(blob, 'test-file.txt');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('test-file.txt');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should create blob URL from blob', () => {
      const blob = new Blob(['data'], { type: 'application/json' });

      downloadBlob(blob, 'data.json');

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });

  // Sad path
  describe('Sad Path', () => {
    it('should handle empty filename', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, '');

      expect(mockAnchor.download).toBe('');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle empty blob', () => {
      const blob = new Blob([], { type: 'text/plain' });

      downloadBlob(blob, 'empty.txt');

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  // Malicious path
  describe('Malicious Path', () => {
    it('should handle filename with path traversal attempt', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, '../../../etc/passwd');

      // Browser will handle sanitization, but we should pass the filename through
      expect(mockAnchor.download).toBe('../../../etc/passwd');
    });

    it('should handle filename with special characters', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, 'test<script>alert(1)</script>.txt');

      expect(mockAnchor.download).toBe('test<script>alert(1)</script>.txt');
    });

    it('should handle filename with null bytes', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, 'test\x00.txt');

      expect(mockAnchor.download).toBe('test\x00.txt');
    });

    it('should handle filename with unicode characters', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, '测试文件🎉.txt');

      expect(mockAnchor.download).toBe('测试文件🎉.txt');
    });

    it('should handle filename with RTL override characters', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadBlob(blob, '\u202Eevil.exe\u202C.txt');

      expect(mockAnchor.download).toBe('\u202Eevil.exe\u202C.txt');
    });
  });
});

// ============== downloadJson Tests ==============

describe('downloadJson', () => {
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Happy path
  describe('Happy Path', () => {
    it('should download V1 card as JSON', () => {
      downloadJson(sampleEditorData, 'v1', 'character.json');

      expect(mockAnchor.download).toBe('character.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should download V2 card as JSON', () => {
      downloadJson(sampleEditorData, 'v2', 'character-v2.json');

      expect(mockAnchor.download).toBe('character-v2.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should download V3 card as JSON', () => {
      downloadJson(sampleEditorData, 'v3', 'character-v3.json');

      expect(mockAnchor.download).toBe('character-v3.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  // Sad path
  describe('Sad Path', () => {
    it('should handle empty editor data', () => {
      const emptyData = createEmptyEditorData();

      downloadJson(emptyData, 'v1', 'empty.json');

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  // Malicious path
  describe('Malicious Path', () => {
    it('should handle XSS content in editor data', () => {
      const xssData: EditorCardData = {
        ...sampleEditorData,
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
      };

      downloadJson(xssData, 'v1', 'xss.json');

      // Should still create the download
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle special characters in filename', () => {
      downloadJson(sampleEditorData, 'v1', '<script>alert(1)</script>.json');

      expect(mockAnchor.download).toBe('<script>alert(1)</script>.json');
    });
  });
});

// ============== Re-exported function Tests ==============

describe('Re-exported Functions', () => {
  describe('cardToEditorData', () => {
    // Happy path
    it('should convert V1 card to editor data', () => {
      const editorData = cardToEditorData(sampleV1Card);

      expect(editorData.name).toBe('Test Character');
      expect(editorData.description).toBe('A test description');
      expect(editorData.personality).toBe('Friendly');
    });

    it('should convert V2 card to editor data', () => {
      const editorData = cardToEditorData(sampleV2Card);

      expect(editorData.name).toBe('V2 Character');
      expect(editorData.creator_notes).toBe('V2 notes');
      expect(editorData.system_prompt).toBe('V2 system');
    });

    it('should convert V3 card to editor data', () => {
      const editorData = cardToEditorData(sampleV3Card);

      expect(editorData.name).toBe('V2 Character');
      expect(editorData.nickname).toBe('V3Nick');
      expect(editorData.group_only_greetings).toEqual(['Group hello']);
    });

    // Sad path
    it('should handle missing fields gracefully', () => {
      const minimalCard: TavernCardV1 = {
        name: '',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };

      const editorData = cardToEditorData(minimalCard);

      expect(editorData.name).toBe('');
      expect(editorData.description).toBe('');
    });

    // Malicious path
    it('should handle XSS content without sanitizing (sanitization at render)', () => {
      const xssCard: TavernCardV1 = {
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };

      const editorData = cardToEditorData(xssCard);

      // XSS should be preserved (not sanitized here - that happens at render)
      expect(editorData.name).toBe('<script>alert("xss")</script>');
      expect(editorData.description).toBe('<img src=x onerror=alert(1)>');
    });

    it('should handle prototype pollution attempts', () => {
      const pollutionCard = {
        name: 'test',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        __proto__: { isAdmin: true },
      };

      const editorData = cardToEditorData(pollutionCard as TavernCardV1);

      // Should not pollute prototype
      expect(({} as Record<string, unknown>)['isAdmin']).toBeUndefined();
      expect(editorData.name).toBe('test');
    });
  });

  describe('detectCardVersion', () => {
    // Happy path
    it('should detect V1 card', () => {
      expect(detectCardVersion(sampleV1Card)).toBe('v1');
    });

    it('should detect V2 card', () => {
      expect(detectCardVersion(sampleV2Card)).toBe('v2');
    });

    it('should detect V3 card', () => {
      expect(detectCardVersion(sampleV3Card)).toBe('v3');
    });

    // Sad path
    it('should default to V1 for null', () => {
      expect(detectCardVersion(null)).toBe('v1');
    });

    it('should default to V1 for undefined', () => {
      expect(detectCardVersion(undefined)).toBe('v1');
    });

    it('should default to V1 for empty object', () => {
      expect(detectCardVersion({})).toBe('v1');
    });

    it('should default to V1 for primitive values', () => {
      expect(detectCardVersion('string')).toBe('v1');
      expect(detectCardVersion(123)).toBe('v1');
      expect(detectCardVersion(true)).toBe('v1');
    });

    // Malicious path
    it('should handle card with malicious spec value', () => {
      const malicious = {
        spec: { toString: () => 'chara_card_v3' },
      };

      // Strict equality check should prevent this
      expect(detectCardVersion(malicious)).toBe('v1');
    });

    it('should handle array input', () => {
      expect(detectCardVersion([])).toBe('v1');
      expect(detectCardVersion([sampleV3Card])).toBe('v1');
    });
  });
});

// ============== Integration Tests for cardToEditorData ==============

describe('cardToEditorData Integration', () => {
  // Happy path - round-trip tests
  describe('Round-trip Tests', () => {
    it('should handle V2 card with character book', () => {
      const v2WithBook: TavernCardV2 = {
        ...sampleV2Card,
        data: {
          ...sampleV2Card.data,
          character_book: {
            entries: [
              {
                keys: ['key1', 'key2'],
                content: 'Entry content',
                extensions: {},
                enabled: true,
                insertion_order: 0,
                id: 1,
                name: 'Test Entry',
                priority: 10,
              },
            ],
            extensions: {},
          },
        },
      };

      const editorData = cardToEditorData(v2WithBook);

      expect(editorData.character_book).toBeDefined();
      expect(editorData.character_book?.entries).toHaveLength(1);
      expect(editorData.character_book?.entries[0].keys).toEqual(['key1', 'key2']);
    });

    it('should handle V3 card with all optional fields', () => {
      const fullV3: TavernCardV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          ...sampleV3Card.data,
          assets: [{ type: 'icon', uri: 'test-uri', name: 'icon', ext: 'png' }],
          creator_notes_multilingual: { en: 'English', de: 'Deutsch' },
          source: ['source1', 'source2'],
          creation_date: 1234567890,
          modification_date: 1234567899,
        },
      };

      const editorData = cardToEditorData(fullV3);

      expect(editorData.assets).toHaveLength(1);
      expect(editorData.creator_notes_multilingual).toEqual({ en: 'English', de: 'Deutsch' });
      expect(editorData.source).toEqual(['source1', 'source2']);
      expect(editorData.creation_date).toBe(1234567890);
      expect(editorData.modification_date).toBe(1234567899);
    });
  });

  // Malicious path - edge cases
  describe('Edge Cases', () => {
    it('should handle card with extremely long strings', () => {
      const longString = 'A'.repeat(1000000);
      const longCard: TavernCardV1 = {
        name: longString,
        description: longString,
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };

      const editorData = cardToEditorData(longCard);

      expect(editorData.name.length).toBe(1000000);
    });

    it('should handle card with null bytes', () => {
      const nullByteCard: TavernCardV1 = {
        name: 'Test\x00Name',
        description: 'Desc\x00ription',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };

      const editorData = cardToEditorData(nullByteCard);

      expect(editorData.name).toBe('Test\x00Name');
    });

    it('should handle card with unicode edge cases', () => {
      const unicodeCard: TavernCardV1 = {
        name: '𝕳𝖊𝖑𝖑𝖔 👋 مرحبا 你好',
        description: '\u202E\u0052\u0054\u004C', // RTL override
        personality: '🏳️‍🌈', // Multi-codepoint emoji
        scenario: '\uFEFF', // BOM
        first_mes: '\u200B\u200C\u200D', // Zero-width characters
        mes_example: '',
      };

      const editorData = cardToEditorData(unicodeCard);

      expect(editorData.name).toContain('👋');
      expect(editorData.personality).toBe('🏳️‍🌈');
    });

    it('should handle card with JSON injection attempt', () => {
      const injectionCard: TavernCardV1 = {
        name: '","malicious":"value","name":"',
        description: '{"injected": true}',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };

      const editorData = cardToEditorData(injectionCard);

      expect(editorData.name).toBe('","malicious":"value","name":"');
      expect(editorData.description).toBe('{"injected": true}');
    });
  });
});

// Helper to create a mock File with arrayBuffer method
function createMockFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  // Mock arrayBuffer since jsdom doesn't support it
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length));
  return file;
}

// Helper to create a mock Blob with arrayBuffer method
function createMockBlob(content: string, type: string): Blob {
  const blob = new Blob([content], { type });
  // Mock arrayBuffer since jsdom doesn't support it
  (blob as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length));
  return blob;
}

// ============== extractCardFromPng Tests ==============

describe('extractCardFromPng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Happy path
  describe('Happy Path', () => {
    it('should extract V3 card from PNG with ccv3 chunk', async () => {
      const v3Card: TavernCardV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          ...sampleV2Card.data,
          group_only_greetings: ['Hello group!'],
          nickname: 'TestNick',
        },
      };

      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(v3Card))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'tEXt', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockReturnValue({ keyword: 'ccv3', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).not.toBeNull();
      expect(result?.detectedVersion).toBe('v3');
      expect(result?.card).toEqual(v3Card);
    });

    it('should extract V2 card from PNG with chara chunk', async () => {
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(sampleV2Card))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'tEXt', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).not.toBeNull();
      expect(result?.detectedVersion).toBe('v2');
    });

    it('should extract V1 card from PNG with chara chunk', async () => {
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(sampleV1Card))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'tEXt', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).not.toBeNull();
      expect(result?.detectedVersion).toBe('v1');
    });

    it('should prefer V3 (ccv3) chunk over V2 (chara) chunk', async () => {
      const v3Card: TavernCardV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: { ...sampleV2Card.data, group_only_greetings: [], nickname: 'V3' },
      };
      const v3Base64 = btoa(unescape(encodeURIComponent(JSON.stringify(v3Card))));
      const v2Base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sampleV2Card))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([1]) },
        { name: 'tEXt', data: new Uint8Array([2]) },
      ]);

      // First chunk is ccv3, second is chara
      vi.mocked(text.decode)
        .mockReturnValueOnce({ keyword: 'ccv3', text: v3Base64 })
        .mockReturnValueOnce({ keyword: 'chara', text: v2Base64 });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result?.detectedVersion).toBe('v3');
    });
  });

  // Sad path
  describe('Sad Path', () => {
    it('should return null for PNG without character data', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).toBeNull();
    });

    it('should return null for PNG with non-chara/ccv3 tEXt chunks', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockReturnValue({ keyword: 'other', text: 'data' });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).toBeNull();
    });

    it('should return null when extractChunks throws', async () => {
      vi.mocked(extractChunks).mockImplementation(() => {
        throw new Error('Invalid PNG');
      });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON in chunk', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);

      // Return invalid base64 that will cause JSON parse error
      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: btoa('not json') });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).toBeNull();
    });

    it('should return null for invalid base64 in chunk', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: '!!!invalid-base64!!!' });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect(result).toBeNull();
    });
  });

  // Malicious path
  describe('Malicious Path', () => {
    it('should handle XSS content in card data', async () => {
      const xssCard: TavernCardV1 = {
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(xssCard))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      // XSS content should be preserved (sanitization happens at render)
      expect((result?.card as TavernCardV1).name).toBe('<script>alert("xss")</script>');
    });

    it('should handle prototype pollution attempt in card data', async () => {
      const pollutionCard = {
        name: 'test',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(pollutionCard))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      // Should not pollute prototype
      expect(({} as Record<string, unknown>)['isAdmin']).toBeUndefined();
      expect(result?.card).toBeDefined();
    });

    it('should handle extremely large card data', async () => {
      const largeCard: TavernCardV1 = {
        name: 'A'.repeat(1000000),
        description: 'B'.repeat(1000000),
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(largeCard))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect((result?.card as TavernCardV1).name.length).toBe(1000000);
    });

    it('should handle null bytes in card data', async () => {
      const nullCard: TavernCardV1 = {
        name: 'Test\x00Name',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(nullCard))));

      vi.mocked(extractChunks).mockReturnValue([
        { name: 'tEXt', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.decode).mockReturnValue({ keyword: 'chara', text: base64Data });

      const file = createMockFile('test', 'test.png', 'image/png');
      const result = await extractCardFromPng(file);

      expect((result?.card as TavernCardV1).name).toBe('Test\x00Name');
    });
  });
});

// ============== embedCardInPng Tests ==============

describe('embedCardInPng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encodeChunks).mockReturnValue(new Uint8Array([137, 80, 78, 71])); // PNG magic bytes
  });

  // Happy path
  describe('Happy Path', () => {
    it('should embed V1 card with chara keyword', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, sampleEditorData, 'v1');

      expect(text.encode).toHaveBeenCalledWith('chara', expect.any(String));
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });

    it('should embed V2 card with chara keyword', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, sampleEditorData, 'v2');

      expect(text.encode).toHaveBeenCalledWith('chara', expect.any(String));
      expect(result).toBeInstanceOf(Blob);
    });

    it('should embed V3 card with ccv3 keyword', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, sampleEditorData, 'v3');

      expect(text.encode).toHaveBeenCalledWith('ccv3', expect.any(String));
      expect(result).toBeInstanceOf(Blob);
    });

    it('should remove existing chara and ccv3 chunks before embedding', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'tEXt', data: new Uint8Array([1]) },
        { name: 'tEXt', data: new Uint8Array([2]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode)
        .mockReturnValueOnce({ keyword: 'chara', text: 'old' })
        .mockReturnValueOnce({ keyword: 'ccv3', text: 'old' });

      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      await embedCardInPng(blob, sampleEditorData, 'v2');

      // encodeChunks should be called with filtered chunks + new chunk
      expect(encodeChunks).toHaveBeenCalled();
      const calledChunks = vi.mocked(encodeChunks).mock.calls[0][0];
      // Should have IHDR, new tEXt, IEND (2 old tEXt removed, 1 new added)
      expect(calledChunks.length).toBe(3);
    });

    it('should insert chunk before IEND', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([99]) });

      const blob = createMockBlob('test', 'image/png');
      await embedCardInPng(blob, sampleEditorData, 'v1');

      const calledChunks = vi.mocked(encodeChunks).mock.calls[0][0];
      expect(calledChunks[calledChunks.length - 1].name).toBe('IEND');
      expect(calledChunks[calledChunks.length - 2].name).toBe('tEXt');
    });
  });

  // Sad path
  describe('Sad Path', () => {
    it('should handle PNG without IEND chunk', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, sampleEditorData, 'v1');

      // Should append to end when no IEND
      expect(result).toBeInstanceOf(Blob);
      const calledChunks = vi.mocked(encodeChunks).mock.calls[0][0];
      expect(calledChunks[calledChunks.length - 1].name).toBe('tEXt');
    });

    it('should handle decode throwing error for existing chunks', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'tEXt', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);

      vi.mocked(text.decode).mockImplementation(() => {
        throw new Error('Decode error');
      });
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, sampleEditorData, 'v1');

      // Should still work, keeping the chunk that couldn't be decoded
      expect(result).toBeInstanceOf(Blob);
    });
  });

  // Malicious path
  describe('Malicious Path', () => {
    it('should handle XSS content in editor data', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const xssData: EditorCardData = {
        ...sampleEditorData,
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
      };

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, xssData, 'v1');

      expect(result).toBeInstanceOf(Blob);
      // Verify text.encode was called with base64-encoded data containing XSS
      expect(text.encode).toHaveBeenCalled();
      const call = vi.mocked(text.encode).mock.calls[0];
      expect(call[0]).toBe('chara');
      // The base64 string when decoded should contain 'script'
      const decoded = decodeURIComponent(escape(atob(call[1])));
      expect(decoded).toContain('script');
    });

    it('should handle unicode in editor data', async () => {
      vi.mocked(extractChunks).mockReturnValue([
        { name: 'IHDR', data: new Uint8Array([]) },
        { name: 'IEND', data: new Uint8Array([]) },
      ]);
      vi.mocked(text.encode).mockReturnValue({ name: 'tEXt', data: new Uint8Array([]) });

      const unicodeData: EditorCardData = {
        ...sampleEditorData,
        name: '你好世界 🎉 مرحبا',
        description: '𝕳𝖊𝖑𝖑𝖔',
      };

      const blob = createMockBlob('test', 'image/png');
      const result = await embedCardInPng(blob, unicodeData, 'v1');

      expect(result).toBeInstanceOf(Blob);
    });
  });
});

// ============== convertImageToPng Tests ==============

describe('convertImageToPng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Happy path
  describe('Happy Path', () => {
    it('should return PNG files as-is', async () => {
      const pngBlob = new Blob(['test'], { type: 'image/png' });
      const result = await convertImageToPng(pngBlob);

      expect(result).toBe(pngBlob);
    });

    it('should convert non-PNG images', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        naturalWidth: 100,
        naturalHeight: 100,
      };

      vi.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const jpegBlob = new Blob(['test'], { type: 'image/jpeg' });

      const resultPromise = convertImageToPng(jpegBlob);

      // Trigger onload
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await resultPromise;

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });
  });

  // Sad path
  describe('Sad Path', () => {
    it('should reject when image fails to load', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const badBlob = new Blob(['not an image'], { type: 'image/jpeg' });

      const resultPromise = convertImageToPng(badBlob);

      // Trigger onerror
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(resultPromise).rejects.toThrow('Failed to load image');
    });

    it('should reject when canvas context is null', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        naturalWidth: 100,
        naturalHeight: 100,
      };

      vi.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      // Mock canvas to return null context
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;

      const jpegBlob = new Blob(['test'], { type: 'image/jpeg' });
      const resultPromise = convertImageToPng(jpegBlob);

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await expect(resultPromise).rejects.toThrow('Failed to get canvas context');

      // Restore
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should reject when toBlob returns null', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        naturalWidth: 100,
        naturalHeight: 100,
      };

      vi.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      // Mock canvas.toBlob to return null
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
        callback(null);
      }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

      const jpegBlob = new Blob(['test'], { type: 'image/jpeg' });
      const resultPromise = convertImageToPng(jpegBlob);

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await expect(resultPromise).rejects.toThrow('Failed to convert image to PNG');
    });
  });

  // Malicious path
  describe('Malicious Path', () => {
    it('should handle file with spoofed MIME type', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      vi.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      // File claims to be JPEG but isn't
      const spoofedBlob = new Blob(['not a real image'], { type: 'image/jpeg' });
      const resultPromise = convertImageToPng(spoofedBlob);

      // Image.onerror should fire for invalid image
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(resultPromise).rejects.toThrow();
    });
  });
});

// ============== createPlaceholderImage Tests ==============

describe('createPlaceholderImage', () => {
  beforeEach(() => {
    // Ensure toBlob is properly mocked to return a valid blob
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['mock-png-data'], { type: 'image/png' }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
  });

  // Happy path
  describe('Happy Path', () => {
    it('should create a PNG blob', async () => {
      const result = await createPlaceholderImage();

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });

    it('should create canvas with correct dimensions', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      await createPlaceholderImage();

      expect(createElementSpy).toHaveBeenCalledWith('canvas');
    });
  });
});
