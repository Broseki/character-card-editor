import type { EditorCardData, SpecVersion } from '../utils/types';

interface MessagesSectionProps {
  data: EditorCardData;
  version: SpecVersion;
  onChange: (data: Partial<EditorCardData>) => void;
}

export function MessagesSection({ data, version, onChange }: MessagesSectionProps) {
  const addAlternateGreeting = () => {
    onChange({
      alternate_greetings: [...data.alternate_greetings, ''],
    });
  };

  const updateAlternateGreeting = (index: number, value: string) => {
    const updated = [...data.alternate_greetings];
    updated[index] = value;
    onChange({ alternate_greetings: updated });
  };

  const removeAlternateGreeting = (index: number) => {
    onChange({
      alternate_greetings: data.alternate_greetings.filter((_, i) => i !== index),
    });
  };

  const addGroupGreeting = () => {
    onChange({
      group_only_greetings: [...data.group_only_greetings, ''],
    });
  };

  const updateGroupGreeting = (index: number, value: string) => {
    const updated = [...data.group_only_greetings];
    updated[index] = value;
    onChange({ group_only_greetings: updated });
  };

  const removeGroupGreeting = (index: number) => {
    onChange({
      group_only_greetings: data.group_only_greetings.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
        Messages
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          First Message <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.first_mes}
          onChange={(e) => onChange({ first_mes: e.target.value })}
          placeholder="The character's opening message..."
          rows={5}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Example Messages
        </label>
        <textarea
          value={data.mes_example}
          onChange={(e) => onChange({ mes_example: e.target.value })}
          placeholder="Example conversation format:&#10;<START>&#10;{{user}}: Hello!&#10;{{char}}: Hi there!"
          rows={6}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
        />
      </div>

      {/* Alternate Greetings - V2+ only */}
      {version !== 'v1' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Alternate Greetings
              <span className="text-xs text-gray-500 ml-2">(V2+)</span>
            </label>
            <button
              type="button"
              onClick={addAlternateGreeting}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              + Add Greeting
            </button>
          </div>

          {data.alternate_greetings.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No alternate greetings. Add one to give users swipe options.
            </p>
          ) : (
            <div className="space-y-3">
              {data.alternate_greetings.map((greeting, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={greeting}
                    onChange={(e) => updateAlternateGreeting(index, e.target.value)}
                    placeholder={`Alternate greeting ${index + 1}...`}
                    rows={3}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => removeAlternateGreeting(index)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Only Greetings - V3 only */}
      {version === 'v3' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Group Chat Greetings
              <span className="text-xs text-gray-500 ml-2">(V3)</span>
            </label>
            <button
              type="button"
              onClick={addGroupGreeting}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              + Add Group Greeting
            </button>
          </div>

          {data.group_only_greetings.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No group chat greetings. Add greetings specifically for group chats.
            </p>
          ) : (
            <div className="space-y-3">
              {data.group_only_greetings.map((greeting, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={greeting}
                    onChange={(e) => updateGroupGreeting(index, e.target.value)}
                    placeholder={`Group greeting ${index + 1}...`}
                    rows={3}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroupGreeting(index)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
