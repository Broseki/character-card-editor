import { describe, it, expect } from 'vitest';

import {
  createEmptyEditorData,
  createEmptyBookEntry,
  createEmptyAsset,
  editorDataToV1,
  editorDataToV2,
  editorDataToV3,
  cardToEditorData,
  detectCardVersion,
  type EditorCardData,
  type TavernCardV1,
  type TavernCardV2,
  type TavernCardV3,
} from '../../utils/types';

// ============== Test Data Fixtures ==============

const sampleEditorData: EditorCardData = {
  name: 'Test Character',
  description: 'A test character for unit testing',
  personality: 'Friendly and helpful',
  scenario: 'Testing scenario',
  first_mes: 'Hello, I am a test character!',
  mes_example: '<START>\n{{user}}: Hi\n{{char}}: Hello there!',
  creator_notes: 'Created for testing purposes',
  system_prompt: 'You are a helpful test character.',
  post_history_instructions: 'Remember to be helpful.',
  alternate_greetings: ['Hi there!', 'Greetings!'],
  tags: ['test', 'unit-test'],
  creator: 'TestCreator',
  character_version: '1.0',
  extensions: { custom_field: 'custom_value' },
  character_book: {
    name: 'Test Lorebook',
    description: 'A test lorebook',
    entries: [
      {
        keys: ['test', 'keyword'],
        content: 'This is test lore content',
        extensions: {},
        enabled: true,
        insertion_order: 0,
        id: 0,
        name: 'Test Entry',
        priority: 10,
      },
    ],
    extensions: {},
  },
  assets: [
    { type: 'icon', uri: 'data:image/png;base64,test', name: 'Main Icon', ext: 'png' },
  ],
  nickname: 'Testy',
  creator_notes_multilingual: { en: 'English notes', es: 'Notas en español' },
  source: ['https://example.com'],
  group_only_greetings: ['Group hello!'],
  creation_date: 1700000000,
  modification_date: 1700000001,
};

const sampleV1Card: TavernCardV1 = {
  name: 'V1 Character',
  description: 'A V1 format character',
  personality: 'Simple',
  scenario: 'V1 scenario',
  first_mes: 'Hello from V1!',
  mes_example: 'Example messages',
};

const sampleV2Card: TavernCardV2 = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: 'V2 Character',
    description: 'A V2 format character',
    personality: 'Complex',
    scenario: 'V2 scenario',
    first_mes: 'Hello from V2!',
    mes_example: 'V2 Example',
    creator_notes: 'V2 notes',
    system_prompt: 'V2 system prompt',
    post_history_instructions: 'V2 instructions',
    alternate_greetings: ['Alt greeting 1'],
    tags: ['v2', 'test'],
    creator: 'V2Creator',
    character_version: '2.0',
    extensions: {},
  },
};

const sampleV3Card: TavernCardV3 = {
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    name: 'V3 Character',
    description: 'A V3 format character',
    personality: 'Advanced',
    scenario: 'V3 scenario',
    first_mes: 'Hello from V3!',
    mes_example: 'V3 Example',
    creator_notes: 'V3 notes',
    system_prompt: 'V3 system prompt',
    post_history_instructions: 'V3 instructions',
    alternate_greetings: ['V3 Alt greeting'],
    tags: ['v3', 'test'],
    creator: 'V3Creator',
    character_version: '3.0',
    extensions: {},
    group_only_greetings: ['V3 Group greeting'],
    assets: [{ type: 'icon', uri: 'test-uri', name: 'icon', ext: 'png' }],
    nickname: 'V3Nick',
  },
};

// ============== Factory Functions Tests ==============

describe('Factory Functions', () => {
  describe('createEmptyEditorData', () => {
    // Happy path
    it('should create an empty editor data object with all required fields', () => {
      const data = createEmptyEditorData();

      expect(data.name).toBe('');
      expect(data.description).toBe('');
      expect(data.personality).toBe('');
      expect(data.scenario).toBe('');
      expect(data.first_mes).toBe('');
      expect(data.mes_example).toBe('');
      expect(data.creator_notes).toBe('');
      expect(data.system_prompt).toBe('');
      expect(data.post_history_instructions).toBe('');
      expect(data.alternate_greetings).toEqual([]);
      expect(data.tags).toEqual([]);
      expect(data.creator).toBe('');
      expect(data.character_version).toBe('1.0');
      expect(data.extensions).toEqual({});
      expect(data.assets).toEqual([]);
      expect(data.nickname).toBe('');
      expect(data.creator_notes_multilingual).toEqual({});
      expect(data.source).toEqual([]);
      expect(data.group_only_greetings).toEqual([]);
    });

    it('should return a new object each time', () => {
      const data1 = createEmptyEditorData();
      const data2 = createEmptyEditorData();

      expect(data1).not.toBe(data2);
      data1.name = 'Modified';
      expect(data2.name).toBe('');
    });
  });

  describe('createEmptyBookEntry', () => {
    // Happy path
    it('should create an empty book entry with given id', () => {
      const entry = createEmptyBookEntry(5);

      expect(entry.id).toBe(5);
      expect(entry.insertion_order).toBe(5);
      expect(entry.keys).toEqual([]);
      expect(entry.content).toBe('');
      expect(entry.enabled).toBe(true);
      expect(entry.priority).toBe(10);
      expect(entry.position).toBe('before_char');
    });

    // Sad path
    it('should handle zero id', () => {
      const entry = createEmptyBookEntry(0);
      expect(entry.id).toBe(0);
      expect(entry.insertion_order).toBe(0);
    });

    it('should handle negative id (edge case)', () => {
      const entry = createEmptyBookEntry(-1);
      expect(entry.id).toBe(-1);
    });

    it('should handle very large id', () => {
      const entry = createEmptyBookEntry(Number.MAX_SAFE_INTEGER);
      expect(entry.id).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('createEmptyAsset', () => {
    // Happy path
    it('should create an empty asset with default values', () => {
      const asset = createEmptyAsset();

      expect(asset.type).toBe('icon');
      expect(asset.uri).toBe('');
      expect(asset.name).toBe('');
      expect(asset.ext).toBe('png');
    });
  });
});

// ============== Conversion Functions Tests ==============

describe('Conversion Functions', () => {
  describe('editorDataToV1', () => {
    // Happy path
    it('should convert editor data to V1 format', () => {
      const v1 = editorDataToV1(sampleEditorData);

      expect(v1.name).toBe('Test Character');
      expect(v1.description).toBe('A test character for unit testing');
      expect(v1.personality).toBe('Friendly and helpful');
      expect(v1.scenario).toBe('Testing scenario');
      expect(v1.first_mes).toBe('Hello, I am a test character!');
      expect(v1.mes_example).toBe('<START>\n{{user}}: Hi\n{{char}}: Hello there!');
    });

    it('should only include V1 fields', () => {
      const v1 = editorDataToV1(sampleEditorData);
      const keys = Object.keys(v1);

      expect(keys).toEqual(['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example']);
      expect(v1).not.toHaveProperty('spec');
      expect(v1).not.toHaveProperty('creator_notes');
      expect(v1).not.toHaveProperty('assets');
    });

    // Sad path
    it('should handle empty editor data', () => {
      const emptyData = createEmptyEditorData();
      const v1 = editorDataToV1(emptyData);

      expect(v1.name).toBe('');
      expect(v1.description).toBe('');
    });
  });

  describe('editorDataToV2', () => {
    // Happy path
    it('should convert editor data to V2 format with correct spec', () => {
      const v2 = editorDataToV2(sampleEditorData);

      expect(v2.spec).toBe('chara_card_v2');
      expect(v2.spec_version).toBe('2.0');
      expect(v2.data.name).toBe('Test Character');
      expect(v2.data.creator_notes).toBe('Created for testing purposes');
      expect(v2.data.system_prompt).toBe('You are a helpful test character.');
      expect(v2.data.alternate_greetings).toEqual(['Hi there!', 'Greetings!']);
      expect(v2.data.tags).toEqual(['test', 'unit-test']);
      expect(v2.data.character_book).toBeDefined();
    });

    it('should not include V3-only fields', () => {
      const v2 = editorDataToV2(sampleEditorData);

      expect(v2.data).not.toHaveProperty('assets');
      expect(v2.data).not.toHaveProperty('nickname');
      expect(v2.data).not.toHaveProperty('group_only_greetings');
    });

    // Sad path
    it('should handle missing optional character book', () => {
      const dataWithoutBook = { ...sampleEditorData, character_book: undefined };
      const v2 = editorDataToV2(dataWithoutBook);

      expect(v2.data.character_book).toBeUndefined();
    });
  });

  describe('editorDataToV3', () => {
    // Happy path
    it('should convert editor data to V3 format with correct spec', () => {
      const v3 = editorDataToV3(sampleEditorData);

      expect(v3.spec).toBe('chara_card_v3');
      expect(v3.spec_version).toBe('3.0');
      expect(v3.data.name).toBe('Test Character');
      expect(v3.data.assets).toEqual(sampleEditorData.assets);
      expect(v3.data.nickname).toBe('Testy');
      expect(v3.data.group_only_greetings).toEqual(['Group hello!']);
      expect(v3.data.source).toEqual(['https://example.com']);
    });

    it('should exclude empty optional V3 fields', () => {
      const minimalData = createEmptyEditorData();
      minimalData.name = 'Minimal';
      const v3 = editorDataToV3(minimalData);

      expect(v3.data).not.toHaveProperty('assets');
      expect(v3.data).not.toHaveProperty('nickname');
      expect(v3.data).not.toHaveProperty('source');
      expect(v3.data).not.toHaveProperty('creator_notes_multilingual');
    });

    it('should include creation and modification dates when present', () => {
      const v3 = editorDataToV3(sampleEditorData);

      expect(v3.data.creation_date).toBe(1700000000);
      expect(v3.data.modification_date).toBe(1700000001);
    });

    // Sad path
    it('should handle zero timestamps', () => {
      const dataWithZeroTimestamps = {
        ...sampleEditorData,
        creation_date: 0,
        modification_date: 0,
      };
      const v3 = editorDataToV3(dataWithZeroTimestamps);

      // 0 is falsy, so these should not be included
      expect(v3.data).not.toHaveProperty('creation_date');
      expect(v3.data).not.toHaveProperty('modification_date');
    });
  });
});

// ============== cardToEditorData Tests ==============

describe('cardToEditorData', () => {
  // Happy path
  describe('V1 Card Conversion', () => {
    it('should convert V1 card to editor data', () => {
      const editorData = cardToEditorData(sampleV1Card);

      expect(editorData.name).toBe('V1 Character');
      expect(editorData.description).toBe('A V1 format character');
      expect(editorData.personality).toBe('Simple');
      expect(editorData.creator_notes).toBe(''); // V2+ field defaults
      expect(editorData.assets).toEqual([]); // V3 field defaults
    });
  });

  describe('V2 Card Conversion', () => {
    it('should convert V2 card to editor data', () => {
      const editorData = cardToEditorData(sampleV2Card);

      expect(editorData.name).toBe('V2 Character');
      expect(editorData.creator_notes).toBe('V2 notes');
      expect(editorData.system_prompt).toBe('V2 system prompt');
      expect(editorData.alternate_greetings).toEqual(['Alt greeting 1']);
      expect(editorData.assets).toEqual([]); // V3 field
    });

    it('should handle V2 card with character book', () => {
      const v2WithBook: TavernCardV2 = {
        ...sampleV2Card,
        data: {
          ...sampleV2Card.data,
          character_book: {
            entries: [{ keys: ['key'], content: 'content', extensions: {}, enabled: true, insertion_order: 0 }],
            extensions: {},
          },
        },
      };
      const editorData = cardToEditorData(v2WithBook);

      expect(editorData.character_book).toBeDefined();
      expect(editorData.character_book?.entries).toHaveLength(1);
    });
  });

  describe('V3 Card Conversion', () => {
    it('should convert V3 card to editor data', () => {
      const editorData = cardToEditorData(sampleV3Card);

      expect(editorData.name).toBe('V3 Character');
      expect(editorData.assets).toHaveLength(1);
      expect(editorData.nickname).toBe('V3Nick');
      expect(editorData.group_only_greetings).toEqual(['V3 Group greeting']);
    });

    it('should handle V3 card with all optional fields', () => {
      const fullV3: TavernCardV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          ...sampleV3Card.data,
          creator_notes_multilingual: { en: 'English', de: 'Deutsch' },
          source: ['source1', 'source2'],
          creation_date: 1234567890,
          modification_date: 1234567899,
        },
      };
      const editorData = cardToEditorData(fullV3);

      expect(editorData.creator_notes_multilingual).toEqual({ en: 'English', de: 'Deutsch' });
      expect(editorData.source).toEqual(['source1', 'source2']);
      expect(editorData.creation_date).toBe(1234567890);
      expect(editorData.modification_date).toBe(1234567899);
    });
  });

  // Sad path
  describe('Edge Cases', () => {
    it('should handle card with missing optional fields', () => {
      const minimalV2: TavernCardV2 = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
          name: '',
          description: '',
          personality: '',
          scenario: '',
          first_mes: '',
          mes_example: '',
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          alternate_greetings: [],
          tags: [],
          creator: '',
          character_version: '',
          extensions: {},
        },
      };
      const editorData = cardToEditorData(minimalV2);

      expect(editorData.name).toBe('');
      // Empty string is falsy, so defaults to '1.0'
      expect(editorData.character_version).toBe('1.0');
    });

    it('should handle V3 card missing V3-specific fields', () => {
      const minimalV3: TavernCardV3 = {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
          ...sampleV2Card.data,
          group_only_greetings: [],
        },
      };
      const editorData = cardToEditorData(minimalV3);

      expect(editorData.assets).toEqual([]);
      expect(editorData.nickname).toBe('');
      expect(editorData.source).toEqual([]);
    });

    it('should return empty editor data for unknown spec', () => {
      const unknownCard = {
        spec: 'chara_card_v99',
        spec_version: '99.0',
        data: { name: 'Unknown' },
      };
      const editorData = cardToEditorData(unknownCard as unknown as TavernCardV3);

      expect(editorData.name).toBe('');
    });
  });

  // Malicious path
  describe('Malicious Input Handling', () => {
    it('should handle card with XSS attempts in text fields', () => {
      const xssCard: TavernCardV1 = {
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert("xss")>',
        personality: '"><script>alert("xss")</script>',
        scenario: "javascript:alert('xss')",
        first_mes: '<svg onload=alert("xss")>',
        mes_example: '{{constructor.constructor("alert(1)")()}}',
      };
      const editorData = cardToEditorData(xssCard);

      // Data should be preserved as-is (sanitization happens at render time)
      expect(editorData.name).toBe('<script>alert("xss")</script>');
      expect(editorData.description).toBe('<img src=x onerror=alert("xss")>');
    });

    it('should handle card with prototype pollution attempts', () => {
      const pollutionCard = {
        name: 'Normal Name',
        description: 'Normal',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };
      const editorData = cardToEditorData(pollutionCard as TavernCardV1);

      expect(editorData.name).toBe('Normal Name');
      expect((editorData as unknown as Record<string, unknown>)['isAdmin']).toBeUndefined();
    });

    it('should handle card with extremely long strings', () => {
      const longString = 'A'.repeat(10000000); // 10MB string
      const longCard: TavernCardV1 = {
        name: longString,
        description: longString,
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const editorData = cardToEditorData(longCard);

      expect(editorData.name.length).toBe(10000000);
    });

    it('should handle card with null bytes and control characters', () => {
      const controlCard: TavernCardV1 = {
        name: 'Name\x00With\x00Nulls',
        description: 'Tab\there\nNewline\rCarriage',
        personality: '\x1B[31mANSI\x1B[0m',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const editorData = cardToEditorData(controlCard);

      expect(editorData.name).toBe('Name\x00With\x00Nulls');
      expect(editorData.description).toContain('\t');
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
      expect(editorData.description).toContain('\u202E');
    });

    it('should handle card with nested dangerous extensions', () => {
      const dangerousCard: TavernCardV2 = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
          ...sampleV2Card.data,
          extensions: {
            dangerous_key: '<script>evil()</script>',
            nested: {
              __proto__: { attack: true },
              deep: { value: '{{constructor.constructor("code")()}}' },
            },
          },
        },
      };
      const editorData = cardToEditorData(dangerousCard);

      // Extensions should be preserved but not executed
      expect(editorData.extensions).toHaveProperty('dangerous_key');
      expect(editorData.extensions['dangerous_key']).toBe('<script>evil()</script>');
    });

    it('should handle JSON injection in string fields', () => {
      const jsonInjectionCard: TavernCardV1 = {
        name: '","malicious":"value","name":"',
        description: '{"injected": true}',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
      };
      const editorData = cardToEditorData(jsonInjectionCard);

      expect(editorData.name).toBe('","malicious":"value","name":"');
    });
  });
});

// ============== detectCardVersion Tests ==============

describe('detectCardVersion', () => {
  // Happy path
  it('should detect V1 card (no spec field)', () => {
    expect(detectCardVersion(sampleV1Card)).toBe('v1');
  });

  it('should detect V2 card by spec field', () => {
    expect(detectCardVersion(sampleV2Card)).toBe('v2');
  });

  it('should detect V3 card by spec field', () => {
    expect(detectCardVersion(sampleV3Card)).toBe('v3');
  });

  // Sad path
  it('should default to V1 for null input', () => {
    expect(detectCardVersion(null)).toBe('v1');
  });

  it('should default to V1 for undefined input', () => {
    expect(detectCardVersion(undefined)).toBe('v1');
  });

  it('should default to V1 for primitive input', () => {
    expect(detectCardVersion('string')).toBe('v1');
    expect(detectCardVersion(123)).toBe('v1');
    expect(detectCardVersion(true)).toBe('v1');
  });

  it('should default to V1 for empty object', () => {
    expect(detectCardVersion({})).toBe('v1');
  });

  // Edge cases for wrapped data detection
  it('should detect V3 from wrapped data with group_only_greetings', () => {
    const wrappedV3 = {
      data: { group_only_greetings: [] },
    };
    expect(detectCardVersion(wrappedV3)).toBe('v3');
  });

  it('should detect V3 from wrapped data with assets', () => {
    const wrappedV3 = {
      data: { assets: [] },
    };
    expect(detectCardVersion(wrappedV3)).toBe('v3');
  });

  it('should detect V2 from wrapped data with creator_notes', () => {
    const wrappedV2 = {
      data: { creator_notes: 'notes' },
    };
    expect(detectCardVersion(wrappedV2)).toBe('v2');
  });

  it('should detect V2 from wrapped data with system_prompt', () => {
    const wrappedV2 = {
      data: { system_prompt: 'prompt' },
    };
    expect(detectCardVersion(wrappedV2)).toBe('v2');
  });

  // Malicious path
  it('should handle object with circular reference gracefully', () => {
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;

    // Should not throw
    expect(() => detectCardVersion(circular)).not.toThrow();
    expect(detectCardVersion(circular)).toBe('v1');
  });

  it('should handle object with malicious spec value', () => {
    const malicious = {
      spec: { toString: () => 'chara_card_v3' },
    };
    expect(detectCardVersion(malicious)).toBe('v1'); // Strict equality fails
  });

  it('should handle array input', () => {
    expect(detectCardVersion([])).toBe('v1');
    expect(detectCardVersion([sampleV3Card])).toBe('v1');
  });
});

// ============== Round-trip Conversion Tests ==============

describe('Round-trip Conversions', () => {
  it('should preserve data through V1 round-trip', () => {
    const original = createEmptyEditorData();
    original.name = 'Test';
    original.description = 'Description';
    original.personality = 'Personality';

    const v1 = editorDataToV1(original);
    const restored = cardToEditorData(v1);

    expect(restored.name).toBe(original.name);
    expect(restored.description).toBe(original.description);
    expect(restored.personality).toBe(original.personality);
  });

  it('should preserve data through V2 round-trip', () => {
    const original = createEmptyEditorData();
    original.name = 'Test';
    original.creator_notes = 'Notes';
    original.system_prompt = 'System';
    original.tags = ['tag1', 'tag2'];

    const v2 = editorDataToV2(original);
    const restored = cardToEditorData(v2);

    expect(restored.name).toBe(original.name);
    expect(restored.creator_notes).toBe(original.creator_notes);
    expect(restored.system_prompt).toBe(original.system_prompt);
    expect(restored.tags).toEqual(original.tags);
  });

  it('should preserve data through V3 round-trip', () => {
    const original = createEmptyEditorData();
    original.name = 'Test';
    original.nickname = 'Nick';
    original.assets = [{ type: 'icon', uri: 'uri', name: 'name', ext: 'png' }];
    original.group_only_greetings = ['Hello group!'];

    const v3 = editorDataToV3(original);
    const restored = cardToEditorData(v3);

    expect(restored.name).toBe(original.name);
    expect(restored.nickname).toBe(original.nickname);
    expect(restored.assets).toEqual(original.assets);
    expect(restored.group_only_greetings).toEqual(original.group_only_greetings);
  });

  it('should preserve character book through V2 round-trip', () => {
    const original = createEmptyEditorData();
    original.character_book = {
      name: 'Test Book',
      description: 'Book description',
      entries: [
        {
          keys: ['key1', 'key2'],
          content: 'Entry content',
          extensions: {},
          enabled: true,
          insertion_order: 0,
          id: 1,
          name: 'Entry Name',
          priority: 5,
        },
      ],
      extensions: {},
    };

    const v2 = editorDataToV2(original);
    const restored = cardToEditorData(v2);

    expect(restored.character_book?.name).toBe('Test Book');
    expect(restored.character_book?.entries).toHaveLength(1);
    expect(restored.character_book?.entries[0].keys).toEqual(['key1', 'key2']);
  });
});

// ============== Type Safety Tests ==============

describe('Type Safety', () => {
  it('should maintain proper typing for V1 output', () => {
    const v1 = editorDataToV1(sampleEditorData);

    // TypeScript compile-time check - these should all exist
    const _name: string = v1.name;
    const _desc: string = v1.description;
    const _personality: string = v1.personality;
    const _scenario: string = v1.scenario;
    const _firstMes: string = v1.first_mes;
    const _mesExample: string = v1.mes_example;

    expect(_name).toBeDefined();
    expect(_desc).toBeDefined();
    expect(_personality).toBeDefined();
    expect(_scenario).toBeDefined();
    expect(_firstMes).toBeDefined();
    expect(_mesExample).toBeDefined();
  });

  it('should maintain proper typing for V2 output', () => {
    const v2 = editorDataToV2(sampleEditorData);

    expect(v2.spec).toBe('chara_card_v2');
    expect(v2.spec_version).toBe('2.0');
    expect(typeof v2.data.name).toBe('string');
    expect(Array.isArray(v2.data.alternate_greetings)).toBe(true);
  });

  it('should maintain proper typing for V3 output', () => {
    const v3 = editorDataToV3(sampleEditorData);

    expect(v3.spec).toBe('chara_card_v3');
    expect(v3.spec_version).toBe('3.0');
    expect(Array.isArray(v3.data.group_only_greetings)).toBe(true);
  });
});
