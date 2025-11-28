import type { EditorCardData, SpecVersion } from '../utils/types';

interface SystemSectionProps {
  data: EditorCardData;
  version: SpecVersion;
  onChange: (data: Partial<EditorCardData>) => void;
}

export function SystemSection({ data, version, onChange }: SystemSectionProps) {
  // V1 doesn't have system settings
  if (version === 'v1') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
        System Settings
        <span className="text-xs text-gray-500 ml-2">(V2+)</span>
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          System Prompt
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Replaces the global system prompt. Use {'{{original}}'} to include the default prompt.
        </p>
        <textarea
          value={data.system_prompt}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
          placeholder="Custom system prompt for this character..."
          rows={5}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Post-History Instructions
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Also known as "jailbreak" or "UJB". Inserted after the chat history. Use {'{{original}}'} for default.
        </p>
        <textarea
          value={data.post_history_instructions}
          onChange={(e) => onChange({ post_history_instructions: e.target.value })}
          placeholder="Instructions to insert after chat history..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
        />
      </div>
    </div>
  );
}
