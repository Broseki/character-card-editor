import { useState } from 'react';

import type { CharacterBookEntry, SpecVersion } from '../utils/types';
import { TagInput } from './TagInput';

interface BookEntryEditorProps {
  entry: CharacterBookEntry;
  version: SpecVersion;
  onChange: (entry: CharacterBookEntry) => void;
  onDelete: () => void;
}

export function BookEntryEditor({ entry, version, onChange, onDelete }: BookEntryEditorProps) {
  const [expanded, setExpanded] = useState(true);

  const update = (changes: Partial<CharacterBookEntry>) => {
    onChange({ ...entry, ...changes });
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        <span className="flex-1 text-gray-200 font-medium">
          {entry.name || `Entry ${entry.id}`}
        </span>
        <label
          className="flex items-center gap-2 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-400">Enabled</span>
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-400 transition-colors px-2"
        >
          Delete
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4 bg-gray-850">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Entry Name
              </label>
              <input
                type="text"
                value={entry.name || ''}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Optional identifier"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Comment
              </label>
              <input
                type="text"
                value={entry.comment || ''}
                onChange={(e) => update({ comment: e.target.value })}
                placeholder="Internal note"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <TagInput
            tags={entry.keys}
            onChange={(keys) => update({ keys })}
            placeholder="Add trigger keys (press Enter)"
            label="Trigger Keys"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Content
            </label>
            <textarea
              value={entry.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="Content to insert when triggered..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={entry.priority ?? 10}
                onChange={(e) => update({ priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Insertion Order
              </label>
              <input
                type="number"
                value={entry.insertion_order}
                onChange={(e) => update({ insertion_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Position
              </label>
              <select
                value={entry.position || 'before_char'}
                onChange={(e) => update({ position: e.target.value as 'before_char' | 'after_char' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="before_char">Before Character</option>
                <option value="after_char">After Character</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={entry.case_sensitive ?? false}
                onChange={(e) => update({ case_sensitive: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              Case Sensitive
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={entry.selective ?? false}
                onChange={(e) => update({ selective: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              Selective
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={entry.constant ?? false}
                onChange={(e) => update({ constant: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              Constant (Always Active)
            </label>
            {/* V3: use_regex */}
            {version === 'v3' && (
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={entry.use_regex ?? false}
                  onChange={(e) => update({ use_regex: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                Use Regex
                <span className="text-xs text-gray-500">(V3)</span>
              </label>
            )}
          </div>

          {entry.selective && (
            <TagInput
              tags={entry.secondary_keys || []}
              onChange={(secondary_keys) => update({ secondary_keys })}
              placeholder="Add secondary keys (press Enter)"
              label="Secondary Keys (for selective mode)"
            />
          )}
        </div>
      )}
    </div>
  );
}
