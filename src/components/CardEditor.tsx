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
  convertImageToPng,
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
      } else if (file.type.startsWith('image/')) {
        // Convert any image format to PNG
        let pngBlob: Blob;
        try {
          pngBlob = await convertImageToPng(file);
        } catch (err) {
          console.error('Image conversion error:', err);
          setStatus(err instanceof Error ? err.message : 'Failed to convert image to PNG');
          setTimeout(() => setStatus(''), 3000);
          return;
        }

        // Try to extract card data from PNG (only works if original was PNG with embedded data)
        const extracted = file.type === 'image/png' ? await extractCardFromPng(file) : null;
        if (extracted) {
          const editorData = cardToEditorData(extracted.card);
          setCardData(editorData);
          setVersion(extracted.detectedVersion);
          setStatus(`PNG imported (${extracted.detectedVersion.toUpperCase()})`);
        } else {
          setStatus('Image imported (no character data found)');
        }

        // Set the converted PNG as the image
        const reader = new FileReader();
        reader.onload = () => {
          setImageData(reader.result as string);
          setImageBlob(pngBlob);
        };
        reader.readAsDataURL(pngBlob);
      } else {
        setStatus('Unsupported file format. Use .json or an image file');
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
      {/* Toast Notification */}
      {status && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-200">{status}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <img src="/wizard.svg" alt="" className="w-8 h-8" />
              Character Card Editor
            </h1>

            {/* Version Selector - desktop only */}
            <div className="hidden md:flex items-center gap-2">
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
          </div>

          {/* Version Selector - mobile */}
          <div className="flex md:hidden items-center gap-2">
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

          {/* Buttons - stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleNewCard}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              New Card
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              Import Card
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
          accept=".json,image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </header>

      {/* Version Info Banner */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          <div>
            <span className="text-gray-400">Editing as </span>
            <span className="text-blue-400 font-medium">{version.toUpperCase()}</span>
            <span className="text-gray-500 ml-2 hidden md:inline">
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
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Image */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            {isLoading ? (
              <div className="w-40 h-60 md:w-48 md:h-72 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center">
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
          <div className="flex-1 space-y-6 min-w-0">
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

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800 px-4 md:px-6 py-3 md:py-4 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-400">
          <span>Open source on</span>
          <a
            href="https://github.com/Broseki/character-card-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
