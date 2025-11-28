import { useState, useRef, useEffect } from 'react';

import type { EditorCardData, SpecVersion } from '../utils/types';

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

interface SavedCardsMenuProps {
  currentCardData: EditorCardData;
  currentVersion: SpecVersion;
  currentImageData: string | null;
  onLoad: (card: SavedCard) => void;
  onStatusChange: (status: string) => void;
}

export function SavedCardsMenu({
  currentCardData,
  currentVersion,
  currentImageData,
  onLoad,
  onStatusChange,
}: SavedCardsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedCards(loadSavedCards());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSaveDialogOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    const name = saveName.trim() || currentCardData.name || 'Unnamed Card';
    const newCard: SavedCard = {
      id: Date.now().toString(),
      name,
      cardData: currentCardData,
      version: currentVersion,
      imageData: currentImageData,
      savedAt: Date.now(),
    };

    const updated = [...savedCards, newCard];
    setSavedCards(updated);
    saveSavedCards(updated);
    setSaveDialogOpen(false);
    setSaveName('');
    setIsOpen(false);
    onStatusChange(`Saved "${name}"`);
  };

  const handleLoad = (card: SavedCard) => {
    onLoad(card);
    setIsOpen(false);
    onStatusChange(`Loaded "${card.name}"`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const card = savedCards.find((c) => c.id === id);
    if (card && window.confirm(`Delete "${card.name}"?`)) {
      const updated = savedCards.filter((c) => c.id !== id);
      setSavedCards(updated);
      saveSavedCards(updated);
      onStatusChange(`Deleted "${card.name}"`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <span>Cards</span>
        <span className="text-xs bg-purple-700 px-1.5 py-0.5 rounded">
          {savedCards.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Save Section */}
          <div className="p-3 border-b border-gray-700">
            {saveDialogOpen ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={currentCardData.name || 'Card name...'}
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setSaveDialogOpen(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSaveDialogOpen(false)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSaveDialogOpen(true)}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-colors"
              >
                Save Current Card
              </button>
            )}
          </div>

          {/* Saved Cards List */}
          <div className="max-h-64 overflow-y-auto">
            {savedCards.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No saved cards yet
              </div>
            ) : (
              <div className="py-1">
                {savedCards
                  .sort((a, b) => b.savedAt - a.savedAt)
                  .map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleLoad(card)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {card.imageData ? (
                          <img
                            src={card.imageData}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            ?
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 truncate">
                          {card.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="uppercase">{card.version}</span>
                          <span>•</span>
                          <span>{formatDate(card.savedAt)}</span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(card.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
