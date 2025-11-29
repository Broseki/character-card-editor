interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  monospace?: boolean;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
  monospace = false,
}: TextAreaProps) {
  const baseClasses =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y';
  const monoClasses = monospace ? 'font-mono text-sm' : '';

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${baseClasses} ${monoClasses} ${className}`}
      />
      <div className="absolute bottom-2 right-2 text-sm text-gray-500 pointer-events-none">
        {value.length.toLocaleString()}
      </div>
    </div>
  );
}
