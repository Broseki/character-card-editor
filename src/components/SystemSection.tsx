import type { EditorCardData, SpecVersion } from '../utils/types';
import { TextArea } from './TextArea';

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
        <TextArea
          value={data.system_prompt}
          onChange={(value) => onChange({ system_prompt: value })}
          placeholder="Custom system prompt for this character..."
          rows={5}
          monospace
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Post-History Instructions
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Also known as "jailbreak" or "UJB". Inserted after the chat history. Use {'{{original}}'} for default.
        </p>
        <TextArea
          value={data.post_history_instructions}
          onChange={(value) => onChange({ post_history_instructions: value })}
          placeholder="Instructions to insert after chat history..."
          rows={4}
          monospace
        />
      </div>
    </div>
  );
}
