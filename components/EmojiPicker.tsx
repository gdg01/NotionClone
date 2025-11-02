import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const emojis = [
  '😀', '👋', '👍', '❤️', '🎉', '💡', '🔥', '🚀', '⭐', '🔧',
  '📚', '📄', '📁', '💼', '📈', '📌', '✅', '❌', '❓', '❗',
  '💻', '📱', '🤖', '🧠', '⚙️', '🌍', '🏠', '🏢', '🏗️', 'T',
  // Aggiungi altri emoji se vuoi
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute z-20 w-48 bg-notion-sidebar dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-xl p-2"
      style={{ top: '100%', left: 0, marginTop: '4px' }} // Position below the trigger button
    >
      <div className="grid grid-cols-5 gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-xl rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors aspect-square flex items-center justify-center"
            aria-label={`Select emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
