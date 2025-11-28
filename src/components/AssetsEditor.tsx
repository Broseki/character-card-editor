import { useState } from 'react';

import type { CharacterAsset, SpecVersion } from '../utils/types';
import { createEmptyAsset } from '../utils/types';

interface AssetsEditorProps {
  assets: CharacterAsset[];
  version: SpecVersion;
  onChange: (assets: CharacterAsset[]) => void;
}

const ASSET_TYPES = [
  { value: 'icon', label: 'Icon' },
  { value: 'background', label: 'Background' },
  { value: 'user_icon', label: 'User Icon' },
  { value: 'emotion', label: 'Emotion' },
];

export function AssetsEditor({ assets, version, onChange }: AssetsEditorProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show for V3
  if (version !== 'v3') {
    return null;
  }

  const addAsset = () => {
    onChange([...assets, createEmptyAsset()]);
  };

  const updateAsset = (index: number, changes: Partial<CharacterAsset>) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], ...changes };
    onChange(updated);
  };

  const removeAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        <span className="flex-1 text-lg font-semibold text-gray-200">
          Assets
          <span className="text-xs text-gray-500 ml-2">(V3)</span>
        </span>
        <span className="text-sm text-gray-400">
          {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addAsset();
            setExpanded(true);
          }}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        >
          + Add Asset
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {assets.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No assets. Add icons, backgrounds, emotions, or other media.
            </p>
          ) : (
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div key={index} className="p-4 bg-gray-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      Asset {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAsset(index)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={asset.type}
                        onChange={(e) => updateAsset(index, { type: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                      >
                        {ASSET_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                        <option value="custom">Custom (x_ prefix)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={asset.name}
                        onChange={(e) => updateAsset(index, { name: e.target.value })}
                        placeholder='e.g., "main", "happy", "sad"'
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URI
                    </label>
                    <input
                      type="text"
                      value={asset.uri}
                      onChange={(e) => updateAsset(index, { uri: e.target.value })}
                      placeholder="https://..., data:image/png;base64,..., or embedded://..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      HTTPS URL, base64 data URI, embedded://path, or ccdefault:
                    </p>
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Extension
                    </label>
                    <input
                      type="text"
                      value={asset.ext}
                      onChange={(e) => updateAsset(index, { ext: e.target.value.toLowerCase() })}
                      placeholder="png"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
