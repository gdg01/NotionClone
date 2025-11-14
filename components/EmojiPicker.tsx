import React, { useEffect, useRef } from 'react';
import Picker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  // isDarkMode: boolean; // Ricorda di gestire questo
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose,
  // isDarkMode = true 
}) => {
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    // onClose(); 
  };

  const pickerTheme = Theme.AUTO; // Gestisci questo dinamicamente
  
  return (
    <div
      ref={pickerRef}
      className="absolute z-20 w-72" // Controlla la larghezza
      style={{ top: '100%', left: 0, marginTop: '4px' }}
    >
      <Picker
        onEmojiClick={handleEmojiClick}
        theme={pickerTheme}
        width="100%"
        height={350} // Aggiusta l'altezza se necessario

        // Rimuove il banner "What's Your Mood?"
        previewConfig={{ showPreview: false }}

      />
    </div>
  );
};