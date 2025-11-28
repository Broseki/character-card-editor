import type { EditorCardData, SpecVersion } from '../utils/types';

interface BasicInfoSectionProps {
  data: EditorCardData;
  version: SpecVersion;
  onChange: (data: Partial<EditorCardData>) => void;
}

export function BasicInfoSection({ data, version, onChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
        Basic Information
      </h2>

      <div className={version === 'v3' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Character name"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {version === 'v3' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nickname
              <span className="text-xs text-gray-500 ml-2">(V3)</span>
            </label>
            <input
              type="text"
              value={data.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              placeholder="Display name (replaces {{char}})"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Character description, background, and traits..."
          rows={6}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Personality
        </label>
        <textarea
          value={data.personality}
          onChange={(e) => onChange({ personality: e.target.value })}
          placeholder="Character personality traits..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scenario
        </label>
        <textarea
          value={data.scenario}
          onChange={(e) => onChange({ scenario: e.target.value })}
          placeholder="The setting or scenario for the conversation..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>
    </div>
  );
}
