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
  loadedCardId: string | null;
  onLoad: (card: SavedCard) => void;
  onLoadedCardIdChange: (id: string | null) => void;
  onStatusChange: (status: string) => void;
}

type SaveAsMode = 'new' | 'overwrite' | null;

export function SavedCardsMenu({
  currentCardData,
  currentVersion,
  currentImageData,
  loadedCardId,
  onLoad,
  onLoadedCardIdChange,
  onStatusChange,
}: SavedCardsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [saveAsMode, setSaveAsMode] = useState<SaveAsMode>(null);
  const [saveName, setSaveName] = useState('');
  const [selectedOverwriteId, setSelectedOverwriteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedCards(loadSavedCards());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSaveAsMode(null);
        setSelectedOverwriteId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save to currently loaded card
  const handleSave = () => {
    if (!loadedCardId) return;

    const card = savedCards.find((c) => c.id === loadedCardId);
    if (!card) return;

    const updated = savedCards.map((c) =>
      c.id === loadedCardId
        ? {
            ...c,
            cardData: currentCardData,
            version: currentVersion,
            imageData: currentImageData,
            savedAt: Date.now(),
          }
        : c
    );
    setSavedCards(updated);
    saveSavedCards(updated);
    setIsOpen(false);
    onStatusChange(`Saved "${card.name}"`);
  };

  // Save as new card
  const handleSaveAsNew = () => {
    const name = saveName.trim() || currentCardData.name || 'Unnamed Card';
    const newId = Date.now().toString();
    const newCard: SavedCard = {
      id: newId,
      name,
      cardData: currentCardData,
      version: currentVersion,
      imageData: currentImageData,
      savedAt: Date.now(),
    };

    const updated = [...savedCards, newCard];
    setSavedCards(updated);
    saveSavedCards(updated);
    setSaveAsMode(null);
    setSaveName('');
    setIsOpen(false);
    onLoadedCardIdChange(newId);
    onStatusChange(`Saved "${name}"`);
  };

  // Overwrite selected card
  const handleOverwriteSelected = () => {
    if (!selectedOverwriteId) return;

    const card = savedCards.find((c) => c.id === selectedOverwriteId);
    if (!card) return;

    const updated = savedCards.map((c) =>
      c.id === selectedOverwriteId
        ? {
            ...c,
            cardData: currentCardData,
            version: currentVersion,
            imageData: currentImageData,
            savedAt: Date.now(),
          }
        : c
    );
    setSavedCards(updated);
    saveSavedCards(updated);
    setSaveAsMode(null);
    setSelectedOverwriteId(null);
    setIsOpen(false);
    onLoadedCardIdChange(selectedOverwriteId);
    onStatusChange(`Overwrote "${card.name}"`);
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
      // Clear loadedCardId if we deleted the loaded card
      if (loadedCardId === id) {
        onLoadedCardIdChange(null);
      }
      onStatusChange(`Deleted "${card.name}"`);
    }
  };

  const resetSaveAsDialog = () => {
    setSaveAsMode(null);
    setSaveName('');
    setSelectedOverwriteId(null);
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
        className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center sm:justify-start gap-2"
      >
        <span>Saved Cards</span>
        <span className="text-xs bg-purple-700 px-1.5 py-0.5 rounded">
          {savedCards.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 sm:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[70vh] flex flex-col">
          {/* Save Section */}
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            {saveAsMode === null ? (
              /* Main Save Buttons */
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!loadedCardId}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                    loadedCardId
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={loadedCardId ? 'Save to current card' : 'No card loaded'}
                >
                  Save
                </button>
                <button
                  onClick={() => setSaveAsMode('new')}
                  className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors"
                >
                  Save As...
                </button>
              </div>
            ) : saveAsMode === 'new' ? (
              /* Save As New Dialog */
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-1">Save as new card</div>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={currentCardData.name || 'Card name...'}
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAsNew();
                    if (e.key === 'Escape') resetSaveAsDialog();
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAsNew}
                    className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSaveAsMode('overwrite')}
                    disabled={savedCards.length === 0}
                    className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                      savedCards.length > 0
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Overwrite...
                  </button>
                  <button
                    onClick={resetSaveAsDialog}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Overwrite Existing Dialog */
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-1">Select card to overwrite</div>
                <div className="max-h-40 overflow-y-auto bg-gray-700 rounded border border-gray-600">
                  {savedCards
                    .sort((a, b) => b.savedAt - a.savedAt)
                    .map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedOverwriteId(card.id)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-600 last:border-b-0 ${
                          selectedOverwriteId === card.id
                            ? 'bg-purple-600/30'
                            : 'hover:bg-gray-600'
                        }`}
                      >
                        <div className="w-6 h-8 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          {card.imageData?.startsWith('data:image/png;base64,') ? (
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
                        <span className="text-sm text-gray-200 truncate">{card.name}</span>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOverwriteSelected}
                    disabled={!selectedOverwriteId}
                    className={`flex-1 px-3 py-1.5 text-white text-sm rounded transition-colors ${
                      selectedOverwriteId
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Overwrite
                  </button>
                  <button
                    onClick={() => setSaveAsMode('new')}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={resetSaveAsDialog}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Cards List - hidden when in overwrite mode */}
          {saveAsMode !== 'overwrite' && (
          <div className="flex-1 overflow-y-auto overscroll-contain">
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
                      className={`flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 active:bg-gray-600 cursor-pointer group border-b border-gray-700/50 last:border-b-0 ${
                        loadedCardId === card.id ? 'bg-purple-900/20' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className={`w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0 ${
                        loadedCardId === card.id ? 'ring-2 ring-purple-500' : ''
                      }`}>
                        {card.imageData?.startsWith('data:image/png;base64,') ? (
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
                        <div className="text-sm text-gray-200 truncate flex items-center gap-2">
                          {card.name}
                          {loadedCardId === card.id && (
                            <span className="text-xs text-purple-400">(loaded)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="uppercase">{card.version}</span>
                          <span>•</span>
                          <span>{formatDate(card.savedAt)}</span>
                        </div>
                      </div>

                      {/* Delete Button - always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => handleDelete(card.id, e)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 active:text-red-500 transition-all flex-shrink-0"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
