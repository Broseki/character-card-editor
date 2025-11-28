// Spec version type
export type SpecVersion = 'v1' | 'v2' | 'v3';

// ============== Character Book Types ==============

export interface CharacterBookEntry {
  keys: string[];
  content: string;
  extensions: Record<string, unknown>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
  // V3 addition
  use_regex?: boolean;
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, unknown>;
  entries: CharacterBookEntry[];
}

// ============== V3 Asset Types ==============

export interface CharacterAsset {
  type: 'icon' | 'background' | 'user_icon' | 'emotion' | string;
  uri: string;
  name: string;
  ext: string;
}

// ============== V1 Card ==============

export interface TavernCardV1 {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
}

// ============== V2 Card ==============

export interface CharacterCardDataV2 {
  // V1 Legacy Fields
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;

  // V2 Fields
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown>;

  // Optional
  character_book?: CharacterBook;
}

export interface TavernCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterCardDataV2;
}

// ============== V3 Card ==============

export interface CharacterCardDataV3 {
  // V1 Legacy Fields
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;

  // V2 Fields
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown>;

  // V2 Optional
  character_book?: CharacterBook;

  // V3 New Fields
  assets?: CharacterAsset[];
  nickname?: string;
  creator_notes_multilingual?: Record<string, string>;
  source?: string[];
  group_only_greetings: string[];
  creation_date?: number;
  modification_date?: number;
}

export interface TavernCardV3 {
  spec: 'chara_card_v3';
  spec_version: '3.0';
  data: CharacterCardDataV3;
}

// ============== Union Types ==============

export type CharacterCard = TavernCardV1 | TavernCardV2 | TavernCardV3;

// ============== Internal Editor State ==============
// This is the unified state we use internally, with all possible fields

export interface EditorCardData {
  // V1 Fields
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;

  // V2 Fields
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown>;
  character_book?: CharacterBook;

  // V3 Fields
  assets: CharacterAsset[];
  nickname: string;
  creator_notes_multilingual: Record<string, string>;
  source: string[];
  group_only_greetings: string[];
  creation_date?: number;
  modification_date?: number;
}

// ============== Factory Functions ==============

export function createEmptyEditorData(): EditorCardData {
  return {
    // V1
    name: '',
    description: '',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    // V2
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: [],
    creator: '',
    character_version: '1.0',
    extensions: {},
    // V3
    assets: [],
    nickname: '',
    creator_notes_multilingual: {},
    source: [],
    group_only_greetings: [],
  };
}

export function createEmptyBookEntry(id: number): CharacterBookEntry {
  return {
    keys: [],
    content: '',
    extensions: {},
    enabled: true,
    insertion_order: id,
    id,
    name: '',
    priority: 10,
    position: 'before_char',
  };
}

export function createEmptyAsset(): CharacterAsset {
  return {
    type: 'icon',
    uri: '',
    name: '',
    ext: 'png',
  };
}

// ============== Conversion Functions ==============

export function editorDataToV1(data: EditorCardData): TavernCardV1 {
  return {
    name: data.name,
    description: data.description,
    personality: data.personality,
    scenario: data.scenario,
    first_mes: data.first_mes,
    mes_example: data.mes_example,
  };
}

export function editorDataToV2(data: EditorCardData): TavernCardV2 {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      first_mes: data.first_mes,
      mes_example: data.mes_example,
      creator_notes: data.creator_notes,
      system_prompt: data.system_prompt,
      post_history_instructions: data.post_history_instructions,
      alternate_greetings: data.alternate_greetings,
      tags: data.tags,
      creator: data.creator,
      character_version: data.character_version,
      extensions: data.extensions,
      character_book: data.character_book,
    },
  };
}

export function editorDataToV3(data: EditorCardData): TavernCardV3 {
  const v3Data: CharacterCardDataV3 = {
    name: data.name,
    description: data.description,
    personality: data.personality,
    scenario: data.scenario,
    first_mes: data.first_mes,
    mes_example: data.mes_example,
    creator_notes: data.creator_notes,
    system_prompt: data.system_prompt,
    post_history_instructions: data.post_history_instructions,
    alternate_greetings: data.alternate_greetings,
    tags: data.tags,
    creator: data.creator,
    character_version: data.character_version,
    extensions: data.extensions,
    character_book: data.character_book,
    group_only_greetings: data.group_only_greetings,
  };

  // Only include optional V3 fields if they have values
  if (data.assets.length > 0) {
    v3Data.assets = data.assets;
  }
  if (data.nickname) {
    v3Data.nickname = data.nickname;
  }
  if (Object.keys(data.creator_notes_multilingual).length > 0) {
    v3Data.creator_notes_multilingual = data.creator_notes_multilingual;
  }
  if (data.source.length > 0) {
    v3Data.source = data.source;
  }
  if (data.creation_date) {
    v3Data.creation_date = data.creation_date;
  }
  if (data.modification_date) {
    v3Data.modification_date = data.modification_date;
  }

  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: v3Data,
  };
}

export function cardToEditorData(card: CharacterCard): EditorCardData {
  const base = createEmptyEditorData();

  // Check if it's V1 (no spec field)
  if (!('spec' in card)) {
    const v1 = card as TavernCardV1;
    return {
      ...base,
      name: v1.name || '',
      description: v1.description || '',
      personality: v1.personality || '',
      scenario: v1.scenario || '',
      first_mes: v1.first_mes || '',
      mes_example: v1.mes_example || '',
    };
  }

  // V2 or V3
  if (card.spec === 'chara_card_v2') {
    const v2 = card as TavernCardV2;
    return {
      ...base,
      name: v2.data.name || '',
      description: v2.data.description || '',
      personality: v2.data.personality || '',
      scenario: v2.data.scenario || '',
      first_mes: v2.data.first_mes || '',
      mes_example: v2.data.mes_example || '',
      creator_notes: v2.data.creator_notes || '',
      system_prompt: v2.data.system_prompt || '',
      post_history_instructions: v2.data.post_history_instructions || '',
      alternate_greetings: v2.data.alternate_greetings || [],
      tags: v2.data.tags || [],
      creator: v2.data.creator || '',
      character_version: v2.data.character_version || '1.0',
      extensions: v2.data.extensions || {},
      character_book: v2.data.character_book,
    };
  }

  if (card.spec === 'chara_card_v3') {
    const v3 = card as TavernCardV3;
    return {
      ...base,
      name: v3.data.name || '',
      description: v3.data.description || '',
      personality: v3.data.personality || '',
      scenario: v3.data.scenario || '',
      first_mes: v3.data.first_mes || '',
      mes_example: v3.data.mes_example || '',
      creator_notes: v3.data.creator_notes || '',
      system_prompt: v3.data.system_prompt || '',
      post_history_instructions: v3.data.post_history_instructions || '',
      alternate_greetings: v3.data.alternate_greetings || [],
      tags: v3.data.tags || [],
      creator: v3.data.creator || '',
      character_version: v3.data.character_version || '1.0',
      extensions: v3.data.extensions || {},
      character_book: v3.data.character_book,
      assets: v3.data.assets || [],
      nickname: v3.data.nickname || '',
      creator_notes_multilingual: v3.data.creator_notes_multilingual || {},
      source: v3.data.source || [],
      group_only_greetings: v3.data.group_only_greetings || [],
      creation_date: v3.data.creation_date,
      modification_date: v3.data.modification_date,
    };
  }

  return base;
}

export function detectCardVersion(card: unknown): SpecVersion {
  if (!card || typeof card !== 'object') return 'v1';

  const obj = card as Record<string, unknown>;

  if (obj.spec === 'chara_card_v3') return 'v3';
  if (obj.spec === 'chara_card_v2') return 'v2';

  // Check if it's wrapped data (V2/V3 style but missing spec)
  if ('data' in obj && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if ('group_only_greetings' in data || 'assets' in data) return 'v3';
    if ('creator_notes' in data || 'system_prompt' in data) return 'v2';
  }

  return 'v1';
}
