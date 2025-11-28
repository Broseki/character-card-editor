import type { EditorCardData, SpecVersion } from '../utils/types';
import { TagInput } from './TagInput';

interface MetadataSectionProps {
  data: EditorCardData;
  version: SpecVersion;
  onChange: (data: Partial<EditorCardData>) => void;
}

export function MetadataSection({ data, version, onChange }: MetadataSectionProps) {
  // V1 doesn't have metadata
  if (version === 'v1') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
        Metadata
        <span className="text-xs text-gray-500 ml-2">(V2+)</span>
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Creator
          </label>
          <input
            type="text"
            value={data.creator}
            onChange={(e) => onChange({ creator: e.target.value })}
            placeholder="Your name or handle"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Version
          </label>
          <input
            type="text"
            value={data.character_version}
            onChange={(e) => onChange({ character_version: e.target.value })}
            placeholder="1.0"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <TagInput
        tags={data.tags}
        onChange={(tags) => onChange({ tags })}
        placeholder="Add tags (press Enter)"
        label="Tags"
      />

      {/* V3: Source URLs */}
      {version === 'v3' && (
        <TagInput
          tags={data.source}
          onChange={(source) => onChange({ source })}
          placeholder="Add source URL (press Enter)"
          label={
            <>
              Source URLs
              <span className="text-xs text-gray-500 ml-2">(V3)</span>
            </>
          }
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Creator Notes
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Notes for users. Not included in prompts.
        </p>
        <textarea
          value={data.creator_notes}
          onChange={(e) => onChange({ creator_notes: e.target.value })}
          placeholder="Usage notes, recommendations, changelog..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      {/* V3: Timestamps */}
      {version === 'v3' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Creation Date
              <span className="text-xs text-gray-500 ml-2">(V3)</span>
            </label>
            <input
              type="datetime-local"
              value={data.creation_date ? new Date(data.creation_date * 1000).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : undefined;
                onChange({ creation_date: timestamp });
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Modification Date
              <span className="text-xs text-gray-500 ml-2">(V3)</span>
            </label>
            <input
              type="datetime-local"
              value={data.modification_date ? new Date(data.modification_date * 1000).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const timestamp = e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : undefined;
                onChange({ modification_date: timestamp });
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
