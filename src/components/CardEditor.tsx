import { useState, useRef, useEffect, useCallback } from 'react';

import type { EditorCardData, SpecVersion } from '../utils/types';
import { createEmptyEditorData } from '../utils/types';
import {
  extractCardFromPng,
  embedCardInPng,
  downloadBlob,
  downloadJson,
  cardToEditorData,
  detectCardVersion,
} from '../utils/pngUtils';
import { ImageUploader } from './ImageUploader';
import { BasicInfoSection } from './BasicInfoSection';
import { MessagesSection } from './MessagesSection';
import { SystemSection } from './SystemSection';
import { MetadataSection } from './MetadataSection';
import { CharacterBookEditor } from './CharacterBookEditor';
import { AssetsEditor } from './AssetsEditor';
import { SavedCardsMenu, type SavedCard } from './SavedCardsMenu';

const STORAGE_KEY = 'character-card-editor-state';

const VERSION_OPTIONS: { value: SpecVersion; label: string; description: string }[] = [
  { value: 'v1', label: 'V1', description: 'Basic fields only' },
  { value: 'v2', label: 'V2', description: 'Extended fields + lorebook' },
  { value: 'v3', label: 'V3', description: 'Full features + assets' },
];

interface SavedState {
  cardData: EditorCardData;
  version: SpecVersion;
  imageData: string | null;
  savedAt: number;
}

function loadFromStorage(): SavedState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedState;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
}

function saveToStorage(state: Omit<SavedState, 'savedAt'>): void {
  try {
    const toSave: SavedState = {
      ...state,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Convert data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function CardEditor() {
  const [cardData, setCardData] = useState<EditorCardData>(createEmptyEditorData());
  const [version, setVersion] = useState<SpecVersion>('v2');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = loadFromStorage();
      if (saved) {
        setCardData(saved.cardData);
        setVersion(saved.version);
        setImageData(saved.imageData);
        setLastSaved(new Date(saved.savedAt));

        // Recreate blob from data URL if we have image data
        if (saved.imageData) {
          const blob = await dataUrlToBlob(saved.imageData);
          setImageBlob(blob);
        }

        setStatus('Restored from auto-save');
        setTimeout(() => setStatus(''), 3000);
      }
      isInitialLoad.current = false;
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    // Don't save during initial load
    if (isInitialLoad.current) return;

    const timeoutId = setTimeout(() => {
      saveToStorage({ cardData, version, imageData });
      setLastSaved(new Date());
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timeoutId);
  }, [cardData, version, imageData]);

  const updateCardData = useCallback((changes: Partial<EditorCardData>) => {
    setCardData((prev) => ({ ...prev, ...changes }));
  }, []);

  const handleImageChange = useCallback((dataUrl: string, blob: File | Blob) => {
    setImageData(dataUrl);
    setImageBlob(blob);
  }, []);

  const handleImport = async (file: File) => {
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const detectedVersion = detectCardVersion(parsed);
        const editorData = cardToEditorData(parsed);

        setCardData(editorData);
        setVersion(detectedVersion);
        setStatus(`JSON imported (${detectedVersion.toUpperCase()})`);
      } else if (file.type.startsWith('image/png')) {
        const extracted = await extractCardFromPng(file);
        if (extracted) {
          const editorData = cardToEditorData(extracted.card);
          setCardData(editorData);
          setVersion(extracted.detectedVersion);

          const reader = new FileReader();
          reader.onload = () => {
            setImageData(reader.result as string);
            setImageBlob(file);
          };
          reader.readAsDataURL(file);
          setStatus(`PNG imported (${extracted.detectedVersion.toUpperCase()})`);
        } else {
          setStatus('No character data found in PNG');
        }
      } else {
        setStatus('Unsupported file format. Use .json or .png');
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus('Error importing file');
    }

    setTimeout(() => setStatus(''), 3000);
  };

  const handleExportJson = () => {
    const filename = `${cardData.name || 'character'}.json`;
    downloadJson(cardData, version, filename);
    setStatus(`JSON exported (${version.toUpperCase()})`);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleExportPng = async () => {
    if (!imageBlob) {
      setStatus('Please add an image first');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    try {
      const pngBlob = await embedCardInPng(imageBlob, cardData, version);
      const filename = `${cardData.name || 'character'}.png`;
      downloadBlob(pngBlob, filename);
      setStatus(`PNG exported (${version.toUpperCase()})`);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Error exporting PNG');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleNewCard = () => {
    if (window.confirm('This will clear your current card and start fresh. Are you sure?')) {
      clearStorage();
      setCardData(createEmptyEditorData());
      setVersion('v2');
      setImageData(null);
      setImageBlob(null);
      setLastSaved(null);
      setStatus('New card created');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleLoadSavedCard = async (card: SavedCard) => {
    setCardData(card.cardData);
    setVersion(card.version);
    setImageData(card.imageData);

    if (card.imageData) {
      const blob = await dataUrlToBlob(card.imageData);
      setImageBlob(blob);
    } else {
      setImageBlob(null);
    }
  };

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-100">Character Card Editor</h1>

          {/* Version Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Format:</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              {VERSION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVersion(opt.value)}
                  title={opt.description}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    version === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status && (
              <span className="text-sm text-green-400">{status}</span>
            )}
            <button
              onClick={handleNewCard}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              New
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              Import
            </button>
            <SavedCardsMenu
              currentCardData={cardData}
              currentVersion={version}
              currentImageData={imageData}
              onLoad={handleLoadSavedCard}
              onStatusChange={showStatus}
            />
            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportPng}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              Export PNG
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.png,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </header>

      {/* Version Info Banner */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400">Editing as </span>
            <span className="text-blue-400 font-medium">{version.toUpperCase()}</span>
            <span className="text-gray-500 ml-2">
              {version === 'v1' && '— Basic fields: name, description, personality, scenario, messages'}
              {version === 'v2' && '— Extended fields + system prompts, metadata, tags, lorebook'}
              {version === 'v3' && '— Full features: assets, group greetings, timestamps, regex entries'}
            </span>
          </div>
          {lastSaved && (
            <span className="text-gray-500 text-xs">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Left Column - Image */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-48 h-72 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <ImageUploader
                imageData={imageData}
                onImageChange={handleImageChange}
              />
            )}
          </div>

          {/* Right Column - Form */}
          <div className="flex-1 space-y-6">
            <BasicInfoSection
              data={cardData}
              version={version}
              onChange={updateCardData}
            />

            <MessagesSection
              data={cardData}
              version={version}
              onChange={updateCardData}
            />

            <SystemSection
              data={cardData}
              version={version}
              onChange={updateCardData}
            />

            <MetadataSection
              data={cardData}
              version={version}
              onChange={updateCardData}
            />

            <AssetsEditor
              assets={cardData.assets}
              version={version}
              onChange={(assets) => updateCardData({ assets })}
            />

            <CharacterBookEditor
              book={cardData.character_book}
              version={version}
              onChange={(character_book) => updateCardData({ character_book })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
