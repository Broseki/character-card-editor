import { useState } from 'react';

import type { CharacterBook, CharacterBookEntry, SpecVersion } from '../utils/types';
import { createEmptyBookEntry } from '../utils/types';
import { BookEntryEditor } from './BookEntryEditor';

interface CharacterBookEditorProps {
  book: CharacterBook | undefined;
  version: SpecVersion;
  onChange: (book: CharacterBook | undefined) => void;
}

export function CharacterBookEditor({ book, version, onChange }: CharacterBookEditorProps) {
  const [expanded, setExpanded] = useState(false);

  // V1 doesn't have character book
  if (version === 'v1') {
    return null;
  }

  const createBook = () => {
    onChange({
      extensions: {},
      entries: [],
    });
    setExpanded(true);
  };

  const removeBook = () => {
    onChange(undefined);
    setExpanded(false);
  };

  const addEntry = () => {
    if (!book) return;
    const maxId = book.entries.reduce((max, e) => Math.max(max, e.id ?? 0), 0);
    onChange({
      ...book,
      entries: [...book.entries, createEmptyBookEntry(maxId + 1)],
    });
  };

  const updateEntry = (index: number, entry: CharacterBookEntry) => {
    if (!book) return;
    const entries = [...book.entries];
    entries[index] = entry;
    onChange({ ...book, entries });
  };

  const deleteEntry = (index: number) => {
    if (!book) return;
    onChange({
      ...book,
      entries: book.entries.filter((_, i) => i !== index),
    });
  };

  const updateBookField = (changes: Partial<CharacterBook>) => {
    if (!book) return;
    onChange({ ...book, ...changes });
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-800 cursor-pointer"
        onClick={() => book && setExpanded(!expanded)}
      >
        {book && (
          <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        )}
        <span className="flex-1 text-lg font-semibold text-gray-200">
          Character Book / Lorebook
          <span className="text-xs text-gray-500 ml-2">(V2+)</span>
        </span>
        {book ? (
          <>
            <span className="text-sm text-gray-400">
              {book.entries.length} {book.entries.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeBook();
              }}
              className="text-gray-400 hover:text-red-400 transition-colors px-2"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              createBook();
            }}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            + Add Character Book
          </button>
        )}
      </div>

      {book && expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Book Name
              </label>
              <input
                type="text"
                value={book.name || ''}
                onChange={(e) => updateBookField({ name: e.target.value })}
                placeholder="Optional name"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={book.description || ''}
                onChange={(e) => updateBookField({ description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Scan Depth
              </label>
              <input
                type="number"
                value={book.scan_depth ?? ''}
                onChange={(e) => updateBookField({ scan_depth: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Default"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Token Budget
              </label>
              <input
                type="number"
                value={book.token_budget ?? ''}
                onChange={(e) => updateBookField({ token_budget: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Default"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={book.recursive_scanning ?? false}
                  onChange={(e) => updateBookField({ recursive_scanning: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                Recursive Scanning
              </label>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-200">Entries</h3>
              <button
                type="button"
                onClick={addEntry}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
              >
                + Add Entry
              </button>
            </div>

            {book.entries.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No entries yet. Add an entry to define lorebook content.
              </p>
            ) : (
              <div className="space-y-3">
                {book.entries.map((entry, index) => (
                  <BookEntryEditor
                    key={entry.id ?? index}
                    entry={entry}
                    version={version}
                    onChange={(updated) => updateEntry(index, updated)}
                    onDelete={() => deleteEntry(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
