import type { EditorCardData, SpecVersion } from './types';

const SAVED_CARDS_KEY = 'character-card-editor-saved-cards';

export interface SavedCard {
  id: string;
  name: string;
  cardData: EditorCardData;
  version: SpecVersion;
  imageData: string | null;
  savedAt: number;
}

export function loadSavedCards(): SavedCard[] {
  try {
    const saved = localStorage.getItem(SAVED_CARDS_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedCard[];
    }
  } catch (error) {
    console.error('Error loading saved cards:', error);
  }
  return [];
}

export function saveSavedCards(cards: SavedCard[]): void {
  try {
    localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving cards:', error);
  }
}
