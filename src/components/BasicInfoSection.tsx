import type { EditorCardData, SpecVersion } from '../utils/types';
import { TextArea } from './TextArea';

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
        <TextArea
          value={data.description}
          onChange={(value) => onChange({ description: value })}
          placeholder="Character description, background, and traits..."
          rows={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Personality
        </label>
        <TextArea
          value={data.personality}
          onChange={(value) => onChange({ personality: value })}
          placeholder="Character personality traits..."
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scenario
        </label>
        <TextArea
          value={data.scenario}
          onChange={(value) => onChange({ scenario: value })}
          placeholder="The setting or scenario for the conversation..."
          rows={3}
        />
      </div>
    </div>
  );
}
